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
import { Cloud, Loader2, AlertCircle } from 'lucide-react';
import { Tenant, User, UserRole, Clinic, SystemTool, Employee, GovernanceConfig, ClinicType, StaffRole, EmploymentType } from './types';
import { db } from './services/db';
import { supabase } from './services/supabase';
import { GOVERNANCE_RULES } from './constants';

const App: React.FC = () => {
  // --- Global State ---
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // 1. Listen for Auth State Changes
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        handleSetUserFromSession(session.user);
      } else {
        setIsLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        handleSetUserFromSession(session.user);
      } else {
        setCurrentUser(null);
        setTenants([]);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSetUserFromSession = (supabaseUser: any) => {
    const isSuperAdmin = supabaseUser.email === 'admin@saas-provider.com';
    setCurrentUser({
      id: supabaseUser.id,
      email: supabaseUser.email || '',
      name: supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0] || 'User',
      role: isSuperAdmin ? UserRole.SUPER_ADMIN : UserRole.CLIENT_ADMIN,
      tenantId: supabaseUser.user_metadata?.tenant_id || 'pending'
    });
  };

  useEffect(() => {
    if (currentUser) {
      loadTenantData();
    }
  }, [currentUser?.id]);

  const loadTenantData = async () => {
    setIsLoading(true);
    try {
      const data = await db.getTenants();
      setTenants(data);
      if (currentUser && currentUser.tenantId === 'pending' && data.length > 0) {
        setCurrentUser(prev => prev ? { ...prev, tenantId: data[0].id } : null);
      }
    } catch (err) {
      console.error("Failed to load tenant data", err);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Auth Actions ---
  
  const login = async (email: string, pass: string): Promise<{ success: boolean; message?: string }> => {
    setAuthError(null);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
    
    // If login fails and it's the demo account, try to auto-signup to facilitate the demo experience
    if (error && email === 'demo@whitedental.jp') {
      console.log("Demo user not found or password incorrect. Attempting auto-provisioning...");
      
      const signupResult = await signup('White Dental Group', email, pass);
      
      // If signup failed, it might be because the user exists but password was wrong in the first place
      if (!signupResult.success) {
        if (signupResult.message?.includes('registered') || signupResult.message?.includes('already exists')) {
          return { 
            success: false, 
            message: "デモアカウントは既に存在しますが、パスワードが一致しません。'demo1234'を使用してください。" 
          };
        }
        return signupResult;
      }
      return { success: true };
    }

    if (error) {
      setAuthError(error.message);
      let msg = 'ログインに失敗しました。メールアドレスとパスワードを確認してください。';
      if (error.message.includes('Invalid login credentials')) msg = 'メールアドレスまたはパスワードが間違っています。';
      return { success: false, message: msg };
    }
    return { success: true };
  };

  const signup = async (company: string, email: string, pass: string): Promise<{ success: boolean; message?: string }> => {
    setIsSaving(true);
    setAuthError(null);

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password: pass,
      options: {
        data: { full_name: company }
      }
    });

    if (authError) {
      setAuthError(authError.message);
      setIsSaving(false);
      return { success: false, message: authError.message };
    }

    if (!authData.user) {
      setIsSaving(false);
      return { success: false, message: 'ユーザー作成に失敗しました。認証サービスを確認してください。' };
    }

    const newTenantId = `tenant_${Date.now()}`;
    const defaultClinicId = `c_${Date.now()}_hq`;
    const adminEmployeeId = `e_${Date.now()}_admin`;

    const defaultClinic: Clinic = {
      id: defaultClinicId,
      name: `${company} 本院`,
      type: ClinicType.HQ,
      address: '東京都港区六本木',
      phone: '03-0000-0000',
      chairs: 5
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

    try {
      await db.upsertTenant(newTenantId, {
        id: newTenantId,
        name: company,
        plan: 'Pro',
        status: 'Active',
        ownerEmail: email,
        governance: GOVERNANCE_RULES
      });
      await db.upsertClinic(newTenantId, defaultClinic);
      await db.upsertEmployee(newTenantId, adminEmployee);
      await loadTenantData();
      return { success: true };
    } catch (err: any) {
      console.error(err);
      setAuthError("初期データの作成に失敗しました。");
      return { success: false, message: 'アカウントは作成されましたが、初期データの構築に失敗しました。' };
    } finally {
      setIsSaving(false);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setTenants([]);
    setActiveTab('dashboard');
  };

  // Mutation handlers... (Add/Update functions)
  const handleAddClinic = async (newClinic: Clinic) => {
    if (!currentUser || tenants.length === 0) return;
    setIsSaving(true);
    try { await db.upsertClinic(tenants[0].id, newClinic); await loadTenantData(); } catch (err) { alert("Error"); } finally { setIsSaving(false); }
  };
  const handleUpdateClinic = async (updatedClinic: Clinic) => {
    if (!currentUser || tenants.length === 0) return;
    setIsSaving(true);
    try { await db.upsertClinic(tenants[0].id, updatedClinic); await loadTenantData(); } catch (err) { alert("Error"); } finally { setIsSaving(false); }
  };
  const handleAddSystem = async (newSystem: SystemTool) => {
    if (!currentUser || tenants.length === 0) return;
    setIsSaving(true);
    try { await db.upsertSystem(tenants[0].id, newSystem); await loadTenantData(); } catch (err) { alert("Error"); } finally { setIsSaving(false); }
  };
  const handleUpdateSystem = async (updatedSystem: SystemTool) => {
    if (!currentUser || tenants.length === 0) return;
    setIsSaving(true);
    try { await db.upsertSystem(tenants[0].id, updatedSystem); await loadTenantData(); } catch (err) { alert("Error"); } finally { setIsSaving(false); }
  };
  const handleAddEmployee = async (newEmployee: Employee) => {
    if (!currentUser || tenants.length === 0) return;
    setIsSaving(true);
    try { await db.upsertEmployee(tenants[0].id, newEmployee); await loadTenantData(); } catch (err) { alert("Error"); } finally { setIsSaving(false); }
  };
  const handleUpdateEmployee = async (updatedEmployee: Employee) => {
    if (!currentUser || tenants.length === 0) return;
    setIsSaving(true);
    try { await db.upsertEmployee(tenants[0].id, updatedEmployee); await loadTenantData(); } catch (err) { alert("Error"); } finally { setIsSaving(false); }
  };
  const handleUpdateGovernance = async (newGovernance: GovernanceConfig) => {
    if (!currentUser || tenants.length === 0) return;
    setIsSaving(true);
    try { await db.upsertTenant(tenants[0].id, { governance: newGovernance }); await loadTenantData(); } catch (err) { alert("Error"); } finally { setIsSaving(false); }
  };

  const currentTenant = tenants[0];

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 text-slate-600">
         <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
         <p className="font-medium">認証セッションを確立中...</p>
      </div>
    );
  }

  if (!currentUser) {
    return <Auth onLogin={login} onSignup={signup} />;
  }

  if (currentUser.role === UserRole.SUPER_ADMIN) {
    return <SuperAdminDashboard tenants={tenants} onLogout={logout} />;
  }

  if (!currentTenant) {
    return (
      <div className="p-20 text-center flex flex-col items-center">
        <AlertCircle className="text-amber-500 mb-4" size={48} />
        <h2 className="text-xl font-bold mb-2">テナント準備中</h2>
        <p className="text-slate-500 mb-6">データベースとの同期を待機しています...</p>
        <div className="flex gap-4">
           <button onClick={loadTenantData} className="px-4 py-2 bg-blue-600 text-white rounded-lg">再読み込み</button>
           <button onClick={logout} className="px-4 py-2 border border-slate-300 rounded-lg">ログアウト</button>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard clinics={currentTenant.clinics} systems={currentTenant.systems} employees={currentTenant.employees} />;
      case 'clinics': return <ClinicManagement clinics={currentTenant.clinics} employees={currentTenant.employees} onAddClinic={handleAddClinic} onUpdateClinic={handleUpdateClinic} />;
      case 'systems': return <SystemCatalog systems={currentTenant.systems} employees={currentTenant.employees} onAddSystem={handleAddSystem} onUpdateSystem={handleUpdateSystem} />;
      case 'users': return <UserDirectory clinics={currentTenant.clinics} systems={currentTenant.systems} employees={currentTenant.employees} onAddEmployee={handleAddEmployee} onUpdateEmployee={handleUpdateEmployee} />;
      case 'costs': return <CostAnalysis systems={currentTenant.systems} employees={currentTenant.employees} />;
      case 'governance': return <Governance governance={currentTenant.governance || GOVERNANCE_RULES} onUpdate={handleUpdateGovernance} />;
      default: return <Dashboard clinics={currentTenant.clinics} systems={currentTenant.systems} employees={currentTenant.employees} />;
    }
  };

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab} user={currentUser} onLogout={logout}>
      <div className="mb-4 flex flex-col md:flex-row justify-between items-end md:items-center gap-2">
         <div className="flex items-center space-x-2">
            <div className={`flex items-center text-xs px-3 py-1.5 rounded-full transition-colors ${isSaving ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                {isSaving ? <Loader2 size={14} className="animate-spin mr-1.5" /> : <Cloud size={14} className="mr-1.5" />}
                <span>{isSaving ? 'Synchronizing...' : 'Securely Connected'}</span>
            </div>
         </div>
      </div>
      {renderContent()}
    </Layout>
  );
};

export default App;