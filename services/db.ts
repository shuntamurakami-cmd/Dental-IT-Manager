import { Tenant, Clinic, SystemTool, Employee, GovernanceConfig, StaffRole, EmploymentType, ClinicType } from '../types';
import { supabase } from './supabase';

/**
 * Data Mappers: Convert between DB (snake_case) and Frontend (camelCase)
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
  issues: row.issues || []
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
  // Load all data (Hydrate)
  getTenants: async (): Promise<Tenant[]> => {
    // 1. Fetch Tenants
    const { data: dbTenants, error: tError } = await supabase.from('tenants').select('*');
    if (tError) throw tError;

    const tenants: Tenant[] = [];

    for (const t of dbTenants) {
      // 2. Fetch related data for each tenant
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

  // --- Specific Mutations ---

  upsertTenant: async (tenantId: string, data: Partial<Tenant>) => {
    const dbData: any = {};
    if (data.name) dbData.name = data.name;
    if (data.plan) dbData.plan = data.plan;
    if (data.governance) dbData.governance = data.governance;
    if (data.status) dbData.status = data.status;

    await supabase.from('tenants').upsert({ id: tenantId, ...dbData });
  },

  upsertClinic: async (tenantId: string, clinic: Clinic) => {
    await supabase.from('clinics').upsert({
      id: clinic.id,
      tenant_id: tenantId,
      name: clinic.name,
      type: clinic.type,
      address: clinic.address,
      phone: clinic.phone,
      chairs: clinic.chairs
    });
  },

  upsertSystem: async (tenantId: string, system: SystemTool) => {
    await supabase.from('systems').upsert({
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
      issues: system.issues
    });
  },

  upsertEmployee: async (tenantId: string, employee: Employee) => {
    // 1. Update basic info
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

    // 2. Update assignments (Delete then Insert)
    await supabase.from('employee_assigned_systems').delete().eq('employee_id', employee.id);
    if (employee.assignedSystems.length > 0) {
      const assignments = employee.assignedSystems.map(sysId => ({
        employee_id: employee.id,
        system_id: sysId
      }));
      await supabase.from('employee_assigned_systems').insert(assignments);
    }
  },

  // Initial dummy reset not supported in relational mode for security, 
  // but we can provide a method to re-insert demo data if needed.
  reset: async () => {
    console.warn("Reset method not fully implemented for relational mode. Please use SQL Editor.");
    return [];
  }
};