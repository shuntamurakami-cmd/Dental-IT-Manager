import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/views/Dashboard';
import ClinicManagement from './components/views/ClinicManagement';
import SystemCatalog from './components/views/SystemCatalog';
import UserDirectory from './components/views/UserDirectory';
import CostAnalysis from './components/views/CostAnalysis';
import Governance from './components/views/Governance';
import Auth from './components/Auth';
import SuperAdminDashboard from './components/views/SuperAdminDashboard';
import { Upload } from 'lucide-react';
import { AppState, Tenant, User, UserRole, Clinic, SystemTool, Employee } from './types';
import { CLINICS, EMPLOYEES, SYSTEMS } from './constants';

// Initial Mock Data Seeding
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
    employees: EMPLOYEES
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
    employees: [EMPLOYEES[0], EMPLOYEES[1]] // Just a few
  }
];

const App: React.FC = () => {
  // --- Global State ---
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showImportModal, setShowImportModal] = useState(false);
  
  // Auth & Data State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>(INITIAL_TENANTS);

  // Derived state for current tenant data
  const currentTenant = tenants.find(t => t.id === currentUser?.tenantId);
  
  // --- Mock Auth Actions ---
  const login = async (email: string, pass: string): Promise<boolean> => {
    // Simulating API Call
    await new Promise(resolve => setTimeout(resolve, 800));

    // Super Admin Check
    if (email === 'admin@saas-provider.com' && pass === 'admin') {
      setCurrentUser({
        id: 'super_admin_01',
        email,
        name: 'SaaS Administrator',
        role: UserRole.SUPER_ADMIN,
        tenantId: 'system'
      });
      return true;
    }

    // Demo User Check
    if (email === 'demo@whitedental.jp' && pass === 'demo') {
      setCurrentUser({
        id: 'user_demo_01',
        email,
        name: '管理者 アカウント',
        role: UserRole.CLIENT_ADMIN,
        tenantId: DEMO_TENANT_ID
      });
      return true;
    }

    // Check newly created users (In a real app, this hits DB)
    const matchedTenant = tenants.find(t => t.ownerEmail === email);
    if (matchedTenant) {
       setCurrentUser({
         id: `user_${matchedTenant.id}`,
         email,
         name: `${matchedTenant.name} 管理者`,
         role: UserRole.CLIENT_ADMIN,
         tenantId: matchedTenant.id
       });
       return true;
    }

    return false;
  };

  const signup = async (company: string, email: string, pass: string): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 800));

    // Create new empty tenant
    const newTenantId = `tenant_${Date.now()}`;
    const newTenant: Tenant = {
      id: newTenantId,
      name: company,
      plan: 'Free',
      status: 'Active',
      createdAt: new Date().toISOString().split('T')[0],
      ownerEmail: email,
      clinics: [],
      systems: [],
      employees: []
    };

    setTenants([...tenants, newTenant]);
    
    // Auto login
    setCurrentUser({
      id: `user_${newTenantId}`,
      email,
      name: `${company} 管理者`,
      role: UserRole.CLIENT_ADMIN,
      tenantId: newTenantId
    });

    return true;
  };

  const logout = () => {
    setCurrentUser(null);
    setActiveTab('dashboard');
  };

  // --- Data Mutation Actions ---
  const handleAddClinic = (newClinic: Clinic) => {
    if (!currentUser || !currentTenant) return;
    setTenants(prev => prev.map(t => {
      if (t.id === currentTenant.id) {
        return { ...t, clinics: [...t.clinics, newClinic] };
      }
      return t;
    }));
  };

  const handleAddSystem = (newSystem: SystemTool) => {
    if (!currentUser || !currentTenant) return;
    setTenants(prev => prev.map(t => {
      if (t.id === currentTenant.id) {
        return { ...t, systems: [...t.systems, newSystem] };
      }
      return t;
    }));
  };

  const handleAddEmployee = (newEmployee: Employee) => {
    if (!currentUser || !currentTenant) return;
    setTenants(prev => prev.map(t => {
      if (t.id === currentTenant.id) {
        return { ...t, employees: [...t.employees, newEmployee] };
      }
      return t;
    }));
  };

  // --- Rendering ---

  if (!currentUser) {
    return <Auth onLogin={login} onSignup={signup} />;
  }

  if (currentUser.role === UserRole.SUPER_ADMIN) {
    return <SuperAdminDashboard tenants={tenants} onLogout={logout} />;
  }

  // Safety check
  if (!currentTenant) return <div>Error loading tenant data</div>;

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard clinics={currentTenant.clinics} systems={currentTenant.systems} employees={currentTenant.employees} />;
      case 'clinics':
        return <ClinicManagement clinics={currentTenant.clinics} employees={currentTenant.employees} onAddClinic={handleAddClinic} />;
      case 'systems':
        return <SystemCatalog systems={currentTenant.systems} onAddSystem={handleAddSystem} />;
      case 'users':
        return <UserDirectory clinics={currentTenant.clinics} systems={currentTenant.systems} employees={currentTenant.employees} onAddEmployee={handleAddEmployee} />;
      case 'costs':
        return <CostAnalysis systems={currentTenant.systems} employees={currentTenant.employees} />;
      case 'governance':
        return <Governance />;
      default:
        return <Dashboard clinics={currentTenant.clinics} systems={currentTenant.systems} employees={currentTenant.employees} />;
    }
  };

  return (
    <Layout 
      activeTab={activeTab} 
      onTabChange={setActiveTab} 
      user={currentUser}
      onLogout={logout}
    >
      <div className="mb-4 flex justify-end">
         <button 
           onClick={() => setShowImportModal(true)}
           className="flex items-center text-xs text-slate-500 hover:text-blue-600 transition-colors"
         >
           <Upload size={14} className="mr-1" />
           既存データ(CSV)をインポート
         </button>
      </div>

      {renderContent()}

      {/* Import Modal Simulation */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 mb-2">データインポート</h3>
            <p className="text-sm text-slate-600 mb-6">
              現在管理しているスプレッドシートやCSVファイルをアップロードして、
              初期データを構築します。
            </p>
            
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer">
              <Upload className="mx-auto h-10 w-10 text-slate-400" />
              <p className="mt-2 text-sm text-slate-500">クリックしてファイルを選択</p>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button 
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium"
              >
                キャンセル
              </button>
              <button 
                onClick={() => {
                  alert('デモ環境のため、実際のインポートはスキップされました。');
                  setShowImportModal(false);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                インポート実行
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default App;