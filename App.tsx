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
import { Upload, RotateCcw, Download, Cloud, Loader2 } from 'lucide-react';
import { Tenant, User, UserRole, Clinic, SystemTool, Employee, GovernanceConfig, ClinicType, StaffRole, EmploymentType } from './types';
import { db } from './services/db';
import { GOVERNANCE_RULES } from './constants';

const App: React.FC = () => {
  // --- Global State ---
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showImportModal, setShowImportModal] = useState(false);
  
  // Auth & Data State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const data = await db.getTenants();
        setTenants(data);
      } catch (err) {
        console.error("Failed to load initial data from DB", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

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

    // Try finding tenant in the loaded data
    const matchedTenant = tenants.find(t => t.ownerEmail === email);
    if (matchedTenant || (email === 'demo@whitedental.jp' && pass === 'demo')) {
       const tid = matchedTenant ? matchedTenant.id : 'tenant_demo_001';
       setCurrentUser({
         id: `user_${tid}`,
         email,
         name: matchedTenant ? `${matchedTenant.name} 管理者` : '管理者 アカウント',
         role: UserRole.CLIENT_ADMIN,
         tenantId: tid
       });
       return true;
    }
    return false;
  };

  const signup = async (company: string, email: string, pass: string): Promise<boolean> => {
    setIsSaving(true);
    const newTenantId = `tenant_${Date.now()}`;
    const defaultClinicId = `c_${Date.now()}_hq`;
    const adminEmployeeId = `e_${Date.now()}_admin`;

    const defaultClinic: Clinic = {
      id: defaultClinicId,
      name: `${company} 本院`,
      type: ClinicType.HQ,
      address: '',
      phone: '',
      chairs: 0
    };

    const adminEmployee: Employee = {
      id: adminEmployeeId,
      firstName: '管理者',
      lastName: '（初期）',
      clinicId: defaultClinicId,
      role: StaffRole.SYSADMIN,
      employmentType: EmploymentType.FULL_TIME,
      email: email,
      joinDate: new Date().toISOString().split('T')[0],
      assignedSystems: [],
      status: 'Active'
    };

    const newTenant: Tenant = {
      id: newTenantId,
      name: company,
      plan: 'Free',
      status: 'Active',
      createdAt: new Date().toISOString().split('T')[0],
      ownerEmail: email,
      clinics: [defaultClinic],
      systems: [],
      employees: [adminEmployee],
      governance: GOVERNANCE_RULES
    };

    try {
      // Create in DB (Relational)
      await db.upsertTenant(newTenantId, newTenant);
      await db.upsertClinic(newTenantId, defaultClinic);
      await db.upsertEmployee(newTenantId, adminEmployee);

      setTenants(prev => [...prev, newTenant]);
      setCurrentUser({
        id: `user_${newTenantId}`,
        email,
        name: `${company} 管理者`,
        role: UserRole.CLIENT_ADMIN,
        tenantId: newTenantId
      });
      return true;
    } catch (err) {
      console.error("Signup failed", err);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const logout = () => {
    setCurrentUser(null);
    setActiveTab('dashboard');
  };

  // --- Data Mutation Actions (Atomic Updates) ---
  
  const handleAddClinic = async (newClinic: Clinic) => {
    if (!currentUser || !currentTenant) return;
    setIsSaving(true);
    try {
      await db.upsertClinic(currentTenant.id, newClinic);
      setTenants(prev => prev.map(t => {
        if (t.id === currentTenant.id) return { ...t, clinics: [...t.clinics, newClinic] };
        return t;
      }));
    } catch (err) {
      alert("保存に失敗しました。");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateClinic = async (updatedClinic: Clinic) => {
    if (!currentUser || !currentTenant) return;
    setIsSaving(true);
    try {
      await db.upsertClinic(currentTenant.id, updatedClinic);
      setTenants(prev => prev.map(t => {
        if (t.id === currentTenant.id) {
          return { 
            ...t, 
            clinics: t.clinics.map(c => c.id === updatedClinic.id ? updatedClinic : c) 
          };
        }
        return t;
      }));
    } catch (err) {
      alert("保存に失敗しました。");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddSystem = async (newSystem: SystemTool) => {
    if (!currentUser || !currentTenant) return;
    setIsSaving(true);
    try {
      await db.upsertSystem(currentTenant.id, newSystem);
      setTenants(prev => prev.map(t => {
        if (t.id === currentTenant.id) return { ...t, systems: [...t.systems, newSystem] };
        return t;
      }));
    } catch (err) {
      alert("保存に失敗しました。");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateSystem = async (updatedSystem: SystemTool) => {
    if (!currentUser || !currentTenant) return;
    setIsSaving(true);
    try {
      await db.upsertSystem(currentTenant.id, updatedSystem);
      setTenants(prev => prev.map(t => {
        if (t.id === currentTenant.id) {
          return { 
            ...t, 
            systems: t.systems.map(s => s.id === updatedSystem.id ? updatedSystem : s) 
          };
        }
        return t;
      }));
    } catch (err) {
      alert("保存に失敗しました。");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddEmployee = async (newEmployee: Employee) => {
    if (!currentUser || !currentTenant) return;
    setIsSaving(true);
    try {
      await db.upsertEmployee(currentTenant.id, newEmployee);
      setTenants(prev => prev.map(t => {
        if (t.id === currentTenant.id) return { ...t, employees: [...t.employees, newEmployee] };
        return t;
      }));
    } catch (err) {
      alert("保存に失敗しました。");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateEmployee = async (updatedEmployee: Employee) => {
    if (!currentUser || !currentTenant) return;
    setIsSaving(true);
    try {
      await db.upsertEmployee(currentTenant.id, updatedEmployee);
      setTenants(prev => prev.map(t => {
        if (t.id === currentTenant.id) {
          return { 
            ...t, 
            employees: t.employees.map(e => e.id === updatedEmployee.id ? updatedEmployee : e) 
          };
        }
        return t;
      }));
    } catch (err) {
      alert("保存に失敗しました。");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateGovernance = async (newGovernance: GovernanceConfig) => {
    if (!currentUser || !currentTenant) return;
    setIsSaving(true);
    try {
      await db.upsertTenant(currentTenant.id, { governance: newGovernance });
      setTenants(prev => prev.map(t => {
        if (t.id === currentTenant.id) return { ...t, governance: newGovernance };
        return t;
      }));
    } catch (err) {
      alert("保存に失敗しました。");
    } finally {
      setIsSaving(false);
    }
  };

  // --- Rendering ---
  
  if (isLoading && tenants.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
         <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
         <p className="text-slate-600 font-medium">データを読み込み中...</p>
         <p className="text-xs text-slate-400 mt-2">Connecting to Supabase Database...</p>
      </div>
    );
  }

  if (!currentUser) {
    return <Auth onLogin={login} onSignup={signup} />;
  }

  if (currentUser.role === UserRole.SUPER_ADMIN) {
    return <SuperAdminDashboard tenants={tenants} onLogout={logout} />;
  }

  if (!currentTenant) return <div className="p-20 text-center">テナントデータが見つかりません</div>;

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
            <div className={`flex items-center text-xs px-3 py-1.5 rounded-full transition-colors ${isSaving ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                {isSaving ? <Loader2 size={14} className="animate-spin mr-1.5" /> : <Cloud size={14} className="mr-1.5" />}
                <span>{isSaving ? 'Saving to Database...' : 'Relational DB Connected'}</span>
            </div>
         </div>
      </div>

      {renderContent()}
    </Layout>
  );
};

export default App;