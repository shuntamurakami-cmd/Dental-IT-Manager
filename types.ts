import React from 'react';

// --- Database Row Types (Supabase Direct) ---

export interface DBT_Tenant {
  id: string;
  name: string;
  plan: 'Free' | 'Pro' | 'Enterprise';
  status: string;
  owner_email: string;
  governance: GovernanceConfig; // JSONB
  created_at: string;
}

export interface DBT_Clinic {
  id: string;
  tenant_id: string;
  name: string;
  type: string;
  address: string;
  chairs: number;
  phone: string;
  created_at?: string;
}

export interface DBT_System {
  id: string;
  tenant_id: string;
  name: string;
  category: string;
  url: string;
  status: 'Active' | 'Review' | 'Canceling';
  base_monthly_cost: number;
  monthly_cost_per_user: number;
  renewal_date: string;
  admin_owner: string;
  vendor_contact: string;
  issues: string[]; // text array
}

export interface DBT_Employee {
  id: string;
  tenant_id: string;
  clinic_id: string | null;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  employment_type: string;
  status: string;
  join_date: string;
}

// --- Application Domain Types (Frontend Use) ---

export enum ClinicType {
  HQ = '本院',
  BRANCH = '分院',
}

export enum StaffRole {
  DR = '歯科医師 (Dr)',
  DH = '歯科衛生士 (DH)',
  DA = '歯科助手 (DA)',
  ADMIN = '事務・受付',
  TC = 'トリートメントコーディネーター',
  SYSADMIN = '情報システム',
}

export enum EmploymentType {
  FULL_TIME = '常勤',
  PART_TIME = '非常勤',
}

// Domain Model matches DBT but with CamelCase for frontend consistency if needed,
// but for simplicity, we map DB snake_case to these interfaces.
// Currently keeping the existing interface structure to minimize breaking changes in components,
// but eventually these should map to the DB columns.

export interface Clinic {
  id: string;
  name: string;
  type: ClinicType;
  address: string;
  chairs: number;
  phone: string;
}

export interface SystemTool {
  id: string;
  name: string;
  category: string;
  url: string;
  monthlyCostPerUser: number; // Mapped from monthly_cost_per_user
  baseMonthlyCost: number;    // Mapped from base_monthly_cost
  renewalDate: string;        // Mapped from renewal_date
  adminOwner: string;         // Mapped from admin_owner
  vendorContact: string;      // Mapped from vendor_contact
  status: 'Active' | 'Review' | 'Canceling';
  issues: string[];
}

export interface Employee {
  id: string;
  firstName: string; // Mapped from first_name
  lastName: string;  // Mapped from last_name
  clinicId: string;  // Mapped from clinic_id
  role: StaffRole;
  employmentType: EmploymentType; // Mapped from employment_type
  email: string;
  joinDate: string;  // Mapped from join_date
  assignedSystems: string[]; // This now comes from a join query
  status: 'Active' | 'Onboarding' | 'Offboarding';
}

// Governance Types
export interface NamingRule {
  rule: string;
  pattern: string;
  example: string;
}

export interface SecurityPolicy {
  title: string;
  content: string;
}

export interface GovernanceConfig {
  naming: NamingRule[];
  security: SecurityPolicy[];
}

// SaaS / Auth Types
export enum UserRole {
  CLIENT_ADMIN = 'CLIENT_ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  tenantId: string;
}

// The "Hydrated" Tenant object used by the frontend
export interface Tenant {
  id: string;
  name: string;
  plan: 'Free' | 'Pro' | 'Enterprise';
  status: 'Active' | 'Inactive';
  createdAt: string;
  ownerEmail: string;
  // Relationships
  clinics: Clinic[];
  systems: SystemTool[];
  employees: Employee[];
  governance: GovernanceConfig;
}

export interface AppState {
  currentUser: User | null;
  tenants: Tenant[];
}