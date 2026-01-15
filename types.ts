import React from 'react';

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
  renewalDate: string; // ISO Date
  adminOwner: string;
  vendorContact: string;
  status: 'Active' | 'Review' | 'Canceling';
  issues: string[];
}

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  clinicId: string;
  role: StaffRole;
  employmentType: EmploymentType;
  email: string;
  joinDate: string;
  assignedSystems: string[]; // System IDs
  status: 'Active' | 'Onboarding' | 'Offboarding';
}

export interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
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
  tenantId: string; // Creates the link to data
}

export interface Tenant {
  id: string;
  name: string; // Organization Name
  plan: 'Free' | 'Pro' | 'Enterprise';
  status: 'Active' | 'Inactive';
  createdAt: string;
  ownerEmail: string;
  // Data Store for this tenant
  clinics: Clinic[];
  systems: SystemTool[];
  employees: Employee[];
}

export interface AppState {
  currentUser: User | null;
  tenants: Tenant[]; // In a real app, this would be in DB. Here we store all mock data.
}