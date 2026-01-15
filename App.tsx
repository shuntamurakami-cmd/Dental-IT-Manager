import React, { useState, useEffect, useRef } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/views/Dashboard';
import ClinicManagement from './components/views/ClinicManagement';
import SystemCatalog from './components/views/SystemCatalog';
import UserDirectory from './components/views/UserDirectory';
import CostAnalysis from './components/views/CostAnalysis';
import Governance from './components/views/Governance';
import Auth from './components/Auth';
import SuperAdminDashboard from './components/views/SuperAdminDashboard';
import { Upload, RotateCcw, Download, FileJson, Cloud, Loader2 } from 'lucide-react';
import { AppState, Tenant, User, UserRole, Clinic, SystemTool, Employee, GovernanceConfig } from './types';
import { db } from './services/db';
import { GOVERNANCE_RULES } from './constants';

const App: React.FC = () => {
  // --- Global State ---
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showImportModal, setShowImportModal] = useState(false);
  
  // Auth & Data State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // Data State
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      const data = await db.getTenants();
      setTenants(data);
      setIsLoading(false);
    };
    loadData();
  }, []);

  // Save to DB Service whenever tenants change (Debounced)
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const save = async () => {
      setIsSaving(true);
      await db.saveTenants(tenants);
      setIsSaving(false);
    };

    // Simple debounce to prevent too many API calls
    const timeoutId = setTimeout(save, 1000);
    return () => clearTimeout(timeoutId);
  }, [tenants]);

  // Derived state for current tenant data
  const currentTenant = tenants.find(t => t.id === currentUser?.tenantId);
  
  // --- Auth Actions ---
  const login = async (email: string, pass: string): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 500));

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

    if (email === 'demo@whitedental.jp' && pass === 'demo') {
      setCurrentUser({
        id: 'user_demo_01',
        email,
        name: '管理者 アカウント',
        role: UserRole.CLIENT_ADMIN,
        tenantId: 'tenant_demo_001'
      });
      return true;
    }

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
      employees: [],
      governance: GOVERNANCE_RULES // Initialize with default rules
    };

    setTenants(prev => [...prev, newTenant]);
    
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

  const resetData = async () => {
    if (confirm('現在のデータを全て削除し、初期デモデータに戻しますか？この操作は取り消せません。')) {
      setIsLoading(true);
      const initial = await db.reset();
      setTenants(initial);
      setIsLoading(false);
      alert('データをリセットしました。');
    }
  };

  // --- Backup & Restore Actions ---
  const handleExport = () => {
    const dataStr = JSON.stringify(tenants, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `dental_it_manager_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = e.target?.result as string;
        const parsedData = JSON.parse(json);
        // Simple validation check
        if (Array.isArray(parsedData) && parsedData.length > 0 && parsedData[0].id) {
          if (confirm('現在のデータを上書きして、バックアップデータを復元しますか？\n（現在の未保存データは失われます）')) {
            setTenants(parsedData);
            setShowImportModal(false);
            alert('データの復元が完了しました。');
          }
        } else {
          alert('無効なデータ形式です。Dental IT Managerのバックアップファイルを選択してください。');
        }
      } catch (err) {
        console.error(err);
        alert('ファイルの読み込みに失敗しました。');
      }
    };
    reader.readAsText(file);
  };

  // --- Data Mutation Actions (Create & Update) ---
  
  // Clinics
  const handleAddClinic = (newClinic: Clinic) => {
    if (!currentUser || !currentTenant) return;
    setTenants(prev => prev.map(t => {
      if (t.id === currentTenant.id) return { ...t, clinics: [...t.clinics, newClinic] };
      return t;
    }));
  };

  const handleUpdateClinic = (updatedClinic: Clinic) => {
    if (!currentUser || !currentTenant) return;
    setTenants(prev => prev.map(t => {
      if (t.id === currentTenant.id) {
        return { 
          ...t, 
          clinics: t.clinics.map(c => c.id === updatedClinic.id ? updatedClinic : c) 
        };
      }
      return t;
    }));
  };

  // Systems
  const handleAddSystem = (newSystem: SystemTool) => {
    if (!currentUser || !currentTenant) return;
    setTenants(prev => prev.map(t => {
      if (t.id === currentTenant.id) return { ...t, systems: [...t.systems, newSystem] };
      return t;
    }));
  };

  const handleUpdateSystem = (updatedSystem: SystemTool) => {
    if (!currentUser || !currentTenant) return;
    setTenants(prev => prev.map(t => {
      if (t.id === currentTenant.id) {
        return { 
          ...t, 
          systems: t.systems.map(s => s.id === updatedSystem.id ? updatedSystem : s) 
        };
      }
      return t;
    }));
  };

  // Employees
  const handleAddEmployee = (newEmployee: Employee) => {
    if (!currentUser || !currentTenant) return;
    setTenants(prev => prev.map(t => {
      if (t.id === currentTenant.id) return { ...t, employees: [...t.employees, newEmployee] };
      return t;
    }));
  };

  const handleUpdateEmployee = (updatedEmployee: Employee) => {
    if (!currentUser || !currentTenant) return;
    setTenants(prev => prev.map(t => {
      if (t.id === currentTenant.id) {
        return { 
          ...t, 
          employees: t.employees.map(e => e.id === updatedEmployee.id ? updatedEmployee : e) 
        };
      }
      return t;
    }));
  };

  // Governance
  const handleUpdateGovernance = (newGovernance: GovernanceConfig) => {
    if (!currentUser || !currentTenant) return;
    setTenants(prev => prev.map(t => {
      if (t.id === currentTenant.id) {
        return { 
          ...t, 
          governance: newGovernance
        };
      }
      return t;
    }));
  };

  // --- Rendering ---
  
  if (isLoading && tenants.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
         <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
         <p className="text-slate-600 font-medium">データを読み込み中...</p>
         <p className="text-xs text-slate-400 mt-2">Connecting to Supabase...</p>
      </div>
    );
  }

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
        return (
          <ClinicManagement 
            clinics={currentTenant.clinics} 
            employees={currentTenant.employees} 
            onAddClinic={handleAddClinic} 
            onUpdateClinic={handleUpdateClinic}
          />
        );
      case 'systems':
        return (
          <SystemCatalog 
            systems={currentTenant.systems} 
            employees={currentTenant.employees}
            onAddSystem={handleAddSystem} 
            onUpdateSystem={handleUpdateSystem}
          />
        );
      case 'users':
        return (
          <UserDirectory 
            clinics={currentTenant.clinics} 
            systems={currentTenant.systems} 
            employees={currentTenant.employees} 
            onAddEmployee={handleAddEmployee}
            onUpdateEmployee={handleUpdateEmployee}
          />
        );
      case 'costs':
        return <CostAnalysis systems={currentTenant.systems} employees={currentTenant.employees} />;
      case 'governance':
        return (
          <Governance 
            governance={currentTenant.governance || GOVERNANCE_RULES}
            onUpdate={handleUpdateGovernance}
          />
        );
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
      <div className="mb-4 flex flex-col md:flex-row justify-between items-end md:items-center gap-2">
         <div className="flex items-center space-x-2">
            <div className={`flex items-center text-xs px-3 py-1.5 rounded-full transition-colors ${isSaving ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                {isSaving ? <Loader2 size={14} className="animate-spin mr-1.5" /> : <Cloud size={14} className="mr-1.5" />}
                <span>{isSaving ? 'Saving to Supabase...' : 'Supabase Connected'}</span>
            </div>
         </div>
         <div className="flex space-x-2">
            <button 
              onClick={resetData}
              className="flex items-center px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 transition-colors"
              title="データを初期状態に戻す"
            >
              <RotateCcw size={14} className="mr-1.5" />
              リセット
            </button>
            <button 
              onClick={handleExport}
              className="flex items-center px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
              title="現在のデータをファイルに保存"
            >
              <Download size={14} className="mr-1.5" />
              保存
            </button>
            <button 
              onClick={() => setShowImportModal(true)}
              className="flex items-center px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
              title="バックアップファイルから復元"
            >
              <Upload size={14} className="mr-1.5" />
              復元
            </button>
         </div>
      </div>

      {renderContent()}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 mb-2">データ復元（インポート）</h3>
            <p className="text-sm text-slate-600 mb-6">
              以前保存したバックアップファイル（.json）を選択してください。<br/>
              <span className="text-red-500 font-bold">※現在のデータは上書きされます。</span>
            </p>
            
            <label className="block w-full border-2 border-dashed border-slate-300 rounded-lg p-8 text-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer">
              <input 
                type="file" 
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
              />
              <FileJson className="mx-auto h-10 w-10 text-slate-400" />
              <p className="mt-2 text-sm text-slate-500">クリックしてJSONファイルを選択</p>
            </label>

            <div className="mt-6 flex justify-end space-x-3">
              <button 
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default App;