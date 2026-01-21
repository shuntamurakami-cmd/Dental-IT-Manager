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
  vendorContact: row.vendor_contact || '',
  status: row.status as any,
  issues: row.issues || [],
  contractUrl: row.contract_url || undefined
});

const mapDBToEmployee = (row: any, assignedSystems: string[]): Employee => ({
  id: row.id,
  firstName: row.first_name,
  lastName: row.last_name,
  clinicId: row.clinic_id || '',
  role: row.role as StaffRole,
  employmentType: row.employment_type as EmploymentType,
  email: row.email || '',
  joinDate: row.join_date || '',
  assignedSystems: assignedSystems,
  status: row.status as any
});

export const db = {
  // Check if the necessary tables exist
  checkSchema: async (): Promise<{ ok: boolean; message?: string }> => {
    try {
      // Try to select 1 record from tenants to see if table exists
      const { error } = await supabase.from('tenants').select('id').limit(1);
      if (error) {
        // Postgres error 42P01 means "relation does not exist" (table missing)
        if (error.code === '42P01') {
          return { ok: false, message: 'MISSING_TABLES' };
        }
        // Other errors (auth, network)
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

  getTenants: async (): Promise<Tenant[]> => {
    const { data: dbTenants, error: tError } = await supabase.from('tenants').select('*');
    if (tError) throw tError;

    const tenants: Tenant[] = [];

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

  uploadSystemFile: async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `contracts/${fileName}`;

    // Ensure bucket exists or handle error is done via SQL setup usually
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
    const { error: empError } = await supabase.from('employees').upsert({
      id: employee.id,
      tenant_id: tenantId,
      clinic_id: employee.clinicId || null,
      first_name: employee.firstName,
      last_name: employee.lastName,
      email: employee.email,
      role: employee.role,
      employment_type: employee.employmentType,
      status: employee.status,
      join_date: employee.joinDate
    });

    if (empError) throw empError;

    // Handle many-to-many relationship
    await supabase.from('employee_assigned_systems').delete().eq('employee_id', employee.id);
    if (employee.assignedSystems.length > 0) {
      const assignments = employee.assignedSystems.map(sysId => ({
        employee_id: employee.id,
        system_id: sysId
      }));
      await supabase.from('employee_assigned_systems').insert(assignments);
    }
  }
};