import { Tenant } from '../types';
import { CLINICS, EMPLOYEES, SYSTEMS, GOVERNANCE_RULES } from '../constants';
import { supabase } from './supabase';

const STORAGE_KEY = 'dental_it_manager_data';
const SUPABASE_TABLE = 'json_storage';
const SUPABASE_ROW_KEY = 'dental_data_v1'; // Key to identify this app's data in the table

// Demo Data (Fallback)
const DEMO_TENANT_ID = 'tenant_demo_001';
const INITIAL_TENANTS: Tenant[] = [
  {
    id: DEMO_TENANT_ID,
    name: 'ホワイトデンタルクリニック',
    plan: 'Pro',
    status: 'Active',
    createdAt: '2023-04-01',
    ownerEmail: 'demo@whitedental.jp',
    clinics: CLINICS,
    systems: SYSTEMS,
    employees: EMPLOYEES,
    governance: GOVERNANCE_RULES
  },
  {
    id: 'tenant_sample_002',
    name: 'スマイル矯正歯科',
    plan: 'Enterprise',
    status: 'Active',
    createdAt: '2024-01-15',
    ownerEmail: 'admin@smile-ortho.jp',
    clinics: [
      { id: 'c_s_1', name: 'スマイル矯正歯科 渋谷', type: '本院' as any, address: '東京都渋谷区', chairs: 12, phone: '03-9999-8888' }
    ],
    systems: [SYSTEMS[0]], // Only Google Workspace
    employees: [EMPLOYEES[0], EMPLOYEES[1]],
    governance: GOVERNANCE_RULES
  }
];

export const db = {
  // Load data (GET) - Now Async
  getTenants: async (): Promise<Tenant[]> => {
    try {
      // 1. Try fetching from Supabase
      const { data, error } = await supabase
        .from(SUPABASE_TABLE)
        .select('value')
        .eq('key', SUPABASE_ROW_KEY)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "Row not found"
        console.error('Supabase fetch error:', error);
      }

      if (data && data.value) {
        console.log('Loaded data from Supabase');
        // Simple migration check: ensure governance exists
        const tenants = data.value as Tenant[];
        return tenants.map(t => ({
          ...t,
          governance: t.governance || GOVERNANCE_RULES
        }));
      }

      // 2. Fallback to LocalStorage if Supabase is empty or failed
      const localData = localStorage.getItem(STORAGE_KEY);
      if (localData) {
        console.log('Loaded data from LocalStorage (Fallback)');
        const tenants = JSON.parse(localData) as Tenant[];
        return tenants.map(t => ({
          ...t,
          governance: t.governance || GOVERNANCE_RULES
        }));
      }
      
    } catch (e) {
      console.error('Failed to load data', e);
    }

    // 3. Default Initial Data
    console.log('Loaded Initial Demo Data');
    return INITIAL_TENANTS;
  },

  // Save data (Upsert) - Now Async
  saveTenants: async (tenants: Tenant[]) => {
    try {
      // 1. Save to LocalStorage (Immediate backup)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tenants));

      // 2. Save to Supabase
      const { error } = await supabase
        .from(SUPABASE_TABLE)
        .upsert({ 
          key: SUPABASE_ROW_KEY, 
          value: tenants 
        });

      if (error) {
        console.error('Supabase save error:', error);
      } else {
        // console.log('Saved to Supabase');
      }
    } catch (e) {
      console.error('Failed to save data', e);
    }
  },

  // Reset to initial state
  reset: async () => {
    localStorage.removeItem(STORAGE_KEY);
    await db.saveTenants(INITIAL_TENANTS);
    return INITIAL_TENANTS;
  }
};