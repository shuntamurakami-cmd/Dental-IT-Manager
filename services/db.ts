import { Tenant, Clinic, SystemTool, Employee, GovernanceConfig, StaffRole, EmploymentType, ClinicType } from '../types';
import { supabase } from './supabase';

/**
 * Data Mappers (Supabase -> App Type)
 */
const mapDBToClinic = (row: any): Clinic => ({
  id: row.id,
  name: row.name,
  type: row.type as ClinicType,
  address: row.address || '',
  phone: row.phone || '',
  chairs: row.chairs || 0
});

const mapDBToSystem = (row: any): SystemTool => ({
  id: row.id,
  name: row.name,
  category: row.category || '',
  url: row.url || '',
  monthlyCostPerUser: row.monthly_cost_per_user || 0,
  baseMonthlyCost: row.base_monthly_cost || 0,
  renewalDate: row.renewal_date || '',
  adminOwner: row.admin_owner || '',
  vendorContact: row.vendorContact || '',
  status: row.status as any,
  issues: row.issues || [],
  contractUrl: row.contract_url || undefined
});

const mapDBToEmployee = (row: any, assignedSystems: string[]): Employee => ({
  id: row.id,
  firstName: row.first_name,
  lastName: row.last_name,
  clinicId: row.clinic_id || '',
  role: row.role, // role is string now
  employmentType: row.employment_type as EmploymentType,
  email: row.email || '',
  joinDate: row.join_date || '',
  assignedSystems: assignedSystems,
  status: row.status as any,
  accountType: row.account_type || 'Google Workspace',
  managedPassword: row.managed_password || ''
});

export const db = {
  // Check if the necessary tables exist
  checkSchema: async (): Promise<{ ok: boolean; message?: string }> => {
    try {
      const { error } = await supabase.from('tenants').select('id').limit(1);
      if (error) {
        if (error.code === '42P01') {
          return { ok: false, message: 'MISSING_TABLES' };
        }
        return { ok: false, message: error.message };
      }
      return { ok: true };
    } catch (err: any) {
      return { ok: false, message: err.message };
    }
  },

  getTenantById: async (tenantId: string): Promise<{ id: string; name: string } | null> => {
    const { data, error } = await supabase
      .from('tenants')
      .select('id, name')
      .eq('id', tenantId)
      .single();
    
    if (error || !data) return null;
    return data;
  },

  // NEW: Resolve Tenant ID by Email (Fallback for missing metadata)
  getTenantIdByEmail: async (email: string): Promise<string | null> => {
    // 1. Check employees table
    const { data: emp } = await supabase
      .from('employees')
      .select('tenant_id')
      .eq('email', email)
      .maybeSingle();
    
    if (emp) return emp.tenant_id;

    // 2. Check tenants table (owner_email)
    const { data: tenant } = await supabase
      .from('tenants')
      .select('id')
      .eq('owner_email', email)
      .maybeSingle();
      
    if (tenant) return tenant.id;

    return null;
  },

  // Modified to optionally filter by tenantId (Critical for data isolation)
  getTenants: async (targetTenantId?: string): Promise<Tenant[]> => {
    let query = supabase.from('tenants').select('*');
    
    // CRITICAL FIX: If a tenantId is provided, ONLY fetch that tenant.
    if (targetTenantId) {
      query = query.eq('id', targetTenantId);
    }

    const { data: dbTenants, error: tError } = await query;
    if (tError) throw tError;

    const tenants: Tenant[] = [];

    // Fetch related data for the retrieved tenants only
    for (const t of dbTenants) {
      const [
        { data: dbClinics },
        { data: dbSystems },
        { data: dbEmployees },
        { data: dbAssignments }
      ] = await Promise.all([
        supabase.from('clinics').select('*').eq('tenant_id', t.id),
        supabase.from('systems').select('*').eq('tenant_id', t.id),
        supabase.from('employees').select('*').eq('tenant_id', t.id),
        supabase.from('employee_assigned_systems').select('employee_id, system_id') 
      ]);

      const clinics = (dbClinics || []).map(mapDBToClinic);
      const systems = (dbSystems || []).map(mapDBToSystem);
      
      const employees = (dbEmployees || []).map(emp => {
        const assigned = (dbAssignments || [])
          .filter(a => a.employee_id === emp.id)
          .map(a => a.system_id);
        return mapDBToEmployee(emp, assigned);
      });

      tenants.push({
        id: t.id,
        name: t.name,
        plan: t.plan,
        status: t.status as any,
        createdAt: t.created_at,
        ownerEmail: t.owner_email,
        clinics,
        systems,
        employees,
        governance: t.governance as GovernanceConfig
      });
    }

    return tenants;
  },

  upsertTenant: async (tenantId: string, data: Partial<Tenant>) => {
    const dbData: any = {};
    if (data.name) dbData.name = data.name;
    if (data.plan) dbData.plan = data.plan;
    if (data.governance) dbData.governance = data.governance;
    if (data.status) dbData.status = data.status;
    if (data.ownerEmail) dbData.owner_email = data.ownerEmail;

    const { error } = await supabase.from('tenants').upsert({ id: tenantId, ...dbData });
    if (error) throw error;
  },

  updateTenantStatus: async (tenantId: string, status: 'Active' | 'Suspended') => {
    const { error } = await supabase.from('tenants').update({ status }).eq('id', tenantId);
    if (error) throw error;
  },

  // SUPER ADMIN FUNCTION: Delete Auth User via RPC
  deleteAuthUser: async (email: string) => {
     const { error } = await supabase.rpc('admin_delete_user', { target_email: email });
     if (error) throw error;
  },

  deleteTenant: async (tenantId: string) => {
    // Manually delete related data first to ensure no foreign key violations
    // 1. Get all employees
    const { data: employees } = await supabase.from('employees').select('id').eq('tenant_id', tenantId);
    if (employees && employees.length > 0) {
      const empIds = employees.map(e => e.id);
      // Delete assignments
      await supabase.from('employee_assigned_systems').delete().in('employee_id', empIds);
    }

    // 2. Delete Employees
    const { error: empError } = await supabase.from('employees').delete().eq('tenant_id', tenantId);
    if (empError) throw new Error(`Failed to delete employees: ${empError.message}`);

    // 3. Delete Systems (Assignments are already gone via Step 1, but system rows remain)
    const { error: sysError } = await supabase.from('systems').delete().eq('tenant_id', tenantId);
    if (sysError) throw new Error(`Failed to delete systems: ${sysError.message}`);

    // 4. Delete Clinics
    const { error: clinicError } = await supabase.from('clinics').delete().eq('tenant_id', tenantId);
    if (clinicError) throw new Error(`Failed to delete clinics: ${clinicError.message}`);

    // 5. Delete Tenant
    const { error: tenantError } = await supabase.from('tenants').delete().eq('id', tenantId);
    if (tenantError) throw new Error(`Failed to delete tenant: ${tenantError.message}`);
  },

  sendPasswordResetEmail: async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '?reset=true',
    });
    if (error) throw error;
  },

  upsertClinic: async (tenantId: string, clinic: Clinic) => {
    const { error } = await supabase.from('clinics').upsert({
      id: clinic.id,
      tenant_id: tenantId,
      name: clinic.name,
      type: clinic.type,
      address: clinic.address,
      phone: clinic.phone,
      chairs: clinic.chairs
    });
    if (error) throw error;
  },

  upsertSystem: async (tenantId: string, system: SystemTool) => {
    const { error } = await supabase.from('systems').upsert({
      id: system.id,
      tenant_id: tenantId,
      name: system.name,
      category: system.category,
      url: system.url,
      status: system.status,
      base_monthly_cost: system.baseMonthlyCost,
      monthly_cost_per_user: system.monthlyCostPerUser,
      renewal_date: system.renewalDate,
      admin_owner: system.adminOwner,
      vendor_contact: system.vendorContact,
      issues: system.issues,
      contract_url: system.contractUrl || null
    });
    if (error) throw error;
  },

  deleteSystem: async (tenantId: string, systemId: string) => {
     // 1. Manually delete assignments for this system to prevent FK errors if CASCADE isn't set
     await supabase.from('employee_assigned_systems').delete().eq('system_id', systemId);
     
     // 2. Delete the system
     const { error } = await supabase.from('systems').delete().eq('id', systemId).eq('tenant_id', tenantId);
     if (error) throw error;
  },

  uploadSystemFile: async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `contracts/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('system-assets')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('system-assets')
      .getPublicUrl(filePath);

    return data.publicUrl;
  },

  upsertEmployee: async (tenantId: string, employee: Employee) => {
    const empData: any = {
      id: employee.id,
      tenant_id: tenantId,
      clinic_id: employee.clinicId || null,
      first_name: employee.firstName,
      last_name: employee.lastName,
      email: employee.email,
      role: employee.role,
      employment_type: employee.employmentType,
      status: employee.status,
      join_date: employee.joinDate,
      account_type: employee.accountType,
      managed_password: employee.managedPassword
    };

    const { error: empError } = await supabase.from('employees').upsert(empData);

    if (empError) {
      // Fallback: If migration hasn't run yet, 'account_type' or 'managed_password' column might be missing.
      // Error code 42703 is undefined_column in Postgres
      if (empError.code === '42703' || empError.message.includes('column')) {
        console.warn('DB Migration missing: Retrying upsert without new columns...');
        delete empData.account_type;
        delete empData.managed_password;
        const { error: retryError } = await supabase.from('employees').upsert(empData);
        if (retryError) throw retryError;
      } else {
        throw empError;
      }
    }

    await supabase.from('employee_assigned_systems').delete().eq('employee_id', employee.id);
    if (employee.assignedSystems.length > 0) {
      const assignments = employee.assignedSystems.map(sysId => ({
        employee_id: employee.id,
        system_id: sysId
      }));
      await supabase.from('employee_assigned_systems').insert(assignments);
    }
  },

  deleteEmployee: async (tenantId: string, employeeId: string) => {
    // 1. Delete system assignments first
    await supabase.from('employee_assigned_systems').delete().eq('employee_id', employeeId);

    // 2. Delete employee
    const { error } = await supabase.from('employees').delete().eq('id', employeeId).eq('tenant_id', tenantId);
    if (error) throw error;
  }
};