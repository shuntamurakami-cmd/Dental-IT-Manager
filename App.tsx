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

  // 1. Listen for Auth State Changes (Real-time Session Management)
  useEffect(() => {
    // Initial Session Check
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        handleSetUserFromSession(session.user);
      } else {
        setIsLoading(false);
      }
    });

    // Subscibe to Auth Events
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
    
    // We'll map the user. In a full app, we might fetch a 'profiles' table here.
    setCurrentUser({
      id: supabaseUser.id,
      email: supabaseUser.email || '',
      name: supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0] || 'User',
      role: isSuperAdmin ? UserRole.SUPER_ADMIN : UserRole.CLIENT_ADMIN,
      tenantId: supabaseUser.user_metadata?.tenant_id || 'pending'
    });
  };

  // 2. Fetch Data when User is Authenticated
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
      
      // Update tenantId if it was pending
      if (currentUser && currentUser.tenantId === 'pending' && data.length > 0) {
        setCurrentUser(prev => prev ? { ...prev, tenantId: data[0].id } : null);
      }
    } catch (err) {
      console.error("Failed to load tenant data", err);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Auth Actions (Real Supabase Auth) ---
  
  const login = async (email: string, pass: string): Promise<boolean> => {
    setAuthError(null);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error) {
      setAuthError(error.message);
      return false;
    }
    return !!data.user;
  };

  const signup = async (company: string, email: string, pass: string): Promise<boolean> => {
    setIsSaving(true);
    setAuthError(null);

    // 1. Supabase Auth Signup
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
      return false;
    }

    if (!authData.user) return false;

    // 2. Initialize Tenant Data in Public Schema
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

    try {
      await db.upsertTenant(newTenantId, {
        id: newTenantId,
        name: company,
        plan: 'Free',
        status: 'Active',
        ownerEmail: email,
        governance: GOVERNANCE_RULES
      });
      await db.upsertClinic(newTenantId, defaultClinic);
      await db.upsertEmployee(newTenantId, adminEmployee);

      // Re-fetch to get the clean state
      await loadTenantData();
      return true;
    } catch (err) {
      setAuthError("初期データの作成に失敗しました。管理者に連絡してください。");
      console.error("Signup DB init failed", err);
      return false;
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

  // --- Data Mutation Actions ---
  // (Remaining actions handleAddClinic etc. stay mostly same but now they operate on current session)
  
  const handleAddClinic = async (newClinic: Clinic) => {
    if (!currentUser || tenants.length === 0) return;
    const tid = tenants[0].id;
    setIsSaving(true);
    try {
      await db.upsertClinic(tid, newClinic);
      await loadTenantData();
    } catch (err) { alert("保存に失敗しました。"); } finally { setIsSaving(false); }
  };

  const handleUpdateClinic = async (updatedClinic: Clinic) => {
    if (!currentUser || tenants.length === 0) return;
    const tid = tenants[0].id;
    setIsSaving(true);
    try {
      await db.upsertClinic(tid, updatedClinic);
      await loadTenantData();
    } catch (err) { alert("保存に失敗しました。"); } finally { setIsSaving(false); }
  };

  const handleAddSystem = async (newSystem: SystemTool) => {
    if (!currentUser || tenants.length === 0) return;
    const tid = tenants[0].id;
    setIsSaving(true);
    try {
      await db.upsertSystem(tid, newSystem);
      await loadTenantData();
    } catch (err) { alert("保存に失敗しました。"); } finally { setIsSaving(false); }
  };

  const handleUpdateSystem = async (updatedSystem: SystemTool) => {
    if (!currentUser || tenants.length === 0) return;
    const tid = tenants[0].id;
    setIsSaving(true);
    try {
      await db.upsertSystem(tid, updatedSystem);
      await loadTenantData();
    } catch (err) { alert("保存に失敗しました。"); } finally { setIsSaving(false); }
  };

  const handleAddEmployee = async (newEmployee: Employee) => {
    if (!currentUser || tenants.length === 0) return;
    const tid = tenants[0].id;
    setIsSaving(true);
    try {
      await db.upsertEmployee(tid, newEmployee);
      await loadTenantData();
    } catch (err) { alert("保存に失敗しました。"); } finally { setIsSaving(false); }
  };

  const handleUpdateEmployee = async (updatedEmployee: Employee) => {
    if (!currentUser || tenants.length === 0) return;
    const tid = tenants[0].id;
    setIsSaving(true);
    try {
      await db.upsertEmployee(tid, updatedEmployee);
      await loadTenantData();
    } catch (err) { alert("保存に失敗しました。"); } finally { setIsSaving(false); }
  };

  const handleUpdateGovernance = async (newGovernance: GovernanceConfig) => {
    if (!currentUser || tenants.length === 0) return;
    const tid = tenants[0].id;
    setIsSaving(true);
    try {
      await db.upsertTenant(tid, { governance: newGovernance });
      await loadTenantData();
    } catch (err) { alert("保存に失敗しました。"); } finally { setIsSaving(false); }
  };

  const currentTenant = tenants[0]; // Multi-tenant support can be added later

  // --- Rendering ---
  
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
        <h2 className="text-xl font-bold mb-2">テナントデータが見つかりません</h2>
        <p className="text-slate-500 mb-6">アカウントは作成されましたが、初期設定が完了していない可能性があります。</p>
        <button onClick={logout} className="text-blue-600 font-medium underline">一度ログアウトして再試行</button>
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