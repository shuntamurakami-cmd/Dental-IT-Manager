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
  issues: string[]; 
  contract_url?: string; // NEW
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
  monthlyCostPerUser: number;
  baseMonthlyCost: number;
  renewalDate: string;
  adminOwner: string;
  vendorContact: string;
  status: 'Active' | 'Review' | 'Canceling';
  issues: string[];
  contractUrl?: string; // NEW
}

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  clinicId: string;
  role: string; // Changed from StaffRole enum to string to support custom roles
  employmentType: EmploymentType;
  email: string;
  joinDate: string;
  assignedSystems: string[];
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

export interface ManualLink {
  title: string;
  url: string;
  updatedAt: string;
}

export interface GovernanceConfig {
  naming: NamingRule[];
  security: SecurityPolicy[];
  manuals?: ManualLink[];
  customRoles?: string[]; // NEW: For custom staff roles
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

export interface Tenant {
  id: string;
  name: string;
  plan: 'Free' | 'Pro' | 'Enterprise';
  status: 'Active' | 'Inactive' | 'Suspended';
  createdAt: string;
  ownerEmail: string;
  clinics: Clinic[];
  systems: SystemTool[];
  employees: Employee[];
  governance: GovernanceConfig;
}

export interface AppState {
  currentUser: User | null;
  tenants: Tenant[];
}