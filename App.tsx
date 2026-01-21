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
import { OnboardingWizard } from './components/OnboardingWizard';
import { SetupGuide } from './components/SetupGuide';
import { Loader2, AlertCircle, Cloud } from 'lucide-react';
import { Tenant, User, UserRole, Clinic, SystemTool, Employee, GovernanceConfig, ClinicType, StaffRole, EmploymentType } from './types';
import { db } from './services/db';
import { supabase } from './services/supabase';
import { GOVERNANCE_RULES } from './constants';
import { NotificationProvider, useNotification } from './contexts/NotificationContext';

// Main App Component Content (Separated for Context usage)
const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [schemaStatus, setSchemaStatus] = useState<'checking' | 'ok' | 'missing_tables' | 'error'>('checking');
  const [schemaErrorMessage, setSchemaErrorMessage] = useState('');
  
  const { notify } = useNotification();

  // 1. Check Schema & Auth on Load
  useEffect(() => {
    checkSystem();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        handleSetUserFromSession(session.user);
      } else {
        setCurrentUser(null);
        setTenants([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkSystem = async () => {
    // First, check if we can talk to the DB and if tables exist
    const schemaCheck = await db.checkSchema();
    
    if (!schemaCheck.ok) {
      if (schemaCheck.message === 'MISSING_TABLES') {
        setSchemaStatus('missing_tables');
      } else {
        setSchemaStatus('error');
        setSchemaErrorMessage(schemaCheck.message || 'Unknown error');
      }
      setIsLoading(false);
      return;
    }

    setSchemaStatus('ok');

    // If schema is OK, check session
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      handleSetUserFromSession(session.user);
    } else {
      setIsLoading(false);
    }
  };

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
    if (currentUser && schemaStatus === 'ok') {
      loadTenantData();
    }
  }, [currentUser?.id, schemaStatus]);

  const loadTenantData = async () => {
    setIsLoading(true);
    try {
      const data = await db.getTenants();
      setTenants(data);
      if (currentUser && currentUser.tenantId === 'pending' && data.length > 0) {
        setCurrentUser(prev => prev ? { ...prev, tenantId: data[0].id } : null);
      }
    } catch (err: any) {
      console.error("Failed to load tenant data", err);
      if (err.code === '42P01') {
        setSchemaStatus('missing_tables');
      } else {
        notify('error', 'データの読み込みに失敗しました');
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  // --- Auth Actions ---
  const login = async (email: string, pass: string): Promise<{ success: boolean; message?: string }> => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
    
    if (error) {
      // If user doesn't exist and it is the demo user, try to auto-provision
      if (email === 'demo@whitedental.jp' && error.message.includes('Invalid login credentials')) {
         return signup('White Dental Group', '管理者', '', email, pass);
      }

      let msg = 'ログインに失敗しました。';
      if (error.message.includes('Invalid login credentials')) msg = 'メールアドレスまたはパスワードが間違っています。';
      return { success: false, message: msg };
    }
    notify('success', 'ログインしました');
    return { success: true };
  };

  const signup = async (company: string, lastName: string, firstName: string, email: string, pass: string, inviteTenantId?: string): Promise<{ success: boolean; message?: string }> => {
    setIsSaving(true);

    try {
      // 1. Create Auth User
      // Note: In a real app, we should probably check if tenant exists first if inviteTenantId is present.
      
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password: pass,
        options: { 
          data: { 
            full_name: `${lastName} ${firstName}`,
            // If invited, we can optionally set metadata here, but we will handle DB link below
            tenant_id: inviteTenantId || undefined
          } 
        }
      });

      if (authError) {
        setIsSaving(false);
        return { success: false, message: authError.message };
      }

      if (!authData.user) {
        setIsSaving(false);
        return { success: true, message: '確認メールを送信しました。メール内のリンクをクリックしてください。' };
      }

      // 2. Create Initial Data in DB
      
      if (inviteTenantId) {
        // --- JOIN EXISTING TENANT FLOW ---
        // Just create the employee record
        const employeeId = `e_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        const newEmployee: Employee = {
          id: employeeId,
          firstName: firstName,
          lastName: lastName,
          clinicId: '', // Ideally we assign to HQ or ask later
          role: StaffRole.DA, // Default role
          employmentType: EmploymentType.FULL_TIME,
          email: email,
          joinDate: new Date().toISOString().split('T')[0],
          assignedSystems: [],
          status: 'Active'
        };

        await db.upsertEmployee(inviteTenantId, newEmployee);
        
        // Refresh session to ensure user has correct context if needed (though we handle logic via DB fetch)
        notify('success', '組織に参加しました');

      } else {
        // --- CREATE NEW TENANT FLOW ---
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
          firstName: firstName || '管理者',
          lastName: lastName || '',
          clinicId: defaultClinicId,
          role: StaffRole.SYSADMIN,
          employmentType: EmploymentType.FULL_TIME,
          email: email,
          joinDate: new Date().toISOString().split('T')[0],
          assignedSystems: [],
          status: 'Active'
        };

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
        notify('success', 'アカウントと組織を作成しました');
      }
      
      await loadTenantData();
      return { success: true };

    } catch (err: any) {
      console.error("Signup Failed:", err);
      setIsSaving(false);
      if (err.code === '42P01') {
         setSchemaStatus('missing_tables');
         return { success: false, message: 'データベースのテーブルが見つかりません。セットアップが必要です。' };
      }
      return { success: false, message: 'アカウント作成後のデータ処理に失敗しました。' };
    } finally {
      setIsSaving(false);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setTenants([]);
    setActiveTab('dashboard');
    notify('info', 'ログアウトしました');
  };

  // --- Mutation Wrappers ---
  const wrapMutation = async (mutation: () => Promise<void>, successMessage: string) => {
    if (!currentUser) return;
    setIsSaving(true);
    try {
      await mutation();
      await loadTenantData();
      notify('success', successMessage);
    } catch (err: any) {
      console.error(err);
      notify('error', `エラーが発生しました: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddClinic = (data: Clinic) => wrapMutation(() => db.upsertClinic(tenants[0].id, data), '医院を追加しました');
  const handleUpdateClinic = (data: Clinic) => wrapMutation(() => db.upsertClinic(tenants[0].id, data), '医院情報を更新しました');
  const handleAddSystem = (data: SystemTool) => wrapMutation(() => db.upsertSystem(tenants[0].id, data), 'システムを登録しました');
  const handleUpdateSystem = (data: SystemTool) => wrapMutation(() => db.upsertSystem(tenants[0].id, data), 'システム情報を更新しました');
  const handleAddEmployee = (data: Employee) => wrapMutation(() => db.upsertEmployee(tenants[0].id, data), 'スタッフを登録しました');
  const handleUpdateEmployee = (data: Employee) => wrapMutation(() => db.upsertEmployee(tenants[0].id, data), 'スタッフ情報を更新しました');
  const handleUpdateGovernance = (data: GovernanceConfig) => wrapMutation(() => db.upsertTenant(tenants[0].id, { governance: data }), '運用ルールを更新しました');

  const currentTenant = tenants[0];

  // --- Render Logic ---

  if (schemaStatus === 'missing_tables') {
    return <SetupGuide />;
  }

  if (schemaStatus === 'error') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6 text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Supabase接続エラー</h1>
        <p className="text-slate-600 mb-6 max-w-md">
          バックエンドへの接続に失敗しました。<br/>
          APIキーやURLの設定が正しいか確認してください。
        </p>
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm text-left w-full max-w-md overflow-x-auto">
          <code className="text-xs text-red-600 font-mono">{schemaErrorMessage}</code>
        </div>
        <button onClick={() => window.location.reload()} className="mt-8 px-6 py-2 bg-slate-900 text-white rounded-lg">再試行</button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 text-slate-600">
         <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
         <p className="font-medium">システム起動中...</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <Auth 
        onLogin={login} 
        onSignup={signup} 
        onDemoStart={() => login('demo@whitedental.jp', 'demo1234')} 
      />
    );
  }

  if (currentUser.role === UserRole.SUPER_ADMIN) {
    return <SuperAdminDashboard tenants={tenants} onLogout={logout} />;
  }

  if (!currentTenant) {
    return (
      <div className="p-20 text-center flex flex-col items-center justify-center min-h-screen bg-slate-50">
        <AlertCircle className="text-amber-500 mb-4" size={48} />
        <h2 className="text-xl font-bold mb-2">テナント設定エラー</h2>
        <p className="text-slate-500 mb-6">アカウントに関連付けられたテナント情報が見つかりません。</p>
        <button onClick={logout} className="px-4 py-2 bg-slate-900 text-white rounded-lg">ログアウトして戻る</button>
      </div>
    );
  }

  // Show Onboarding Wizard if no systems are registered
  const showOnboarding = currentTenant.systems.length === 0;

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard clinics={currentTenant.clinics} systems={currentTenant.systems} employees={currentTenant.employees} />;
      case 'clinics': return <ClinicManagement clinics={currentTenant.clinics} employees={currentTenant.employees} onAddClinic={handleAddClinic} onUpdateClinic={handleUpdateClinic} />;
      case 'systems': return <SystemCatalog systems={currentTenant.systems} employees={currentTenant.employees} onAddSystem={handleAddSystem} onUpdateSystem={handleUpdateSystem} />;
      // Pass tenant ID implicitly via the fact we are rendering with context, but UserDirectory uses invite link from window for now.
      case 'users': return (
        <>
          {/* We pass the tenantId for the invite modal to generate correct link */}
          <UserDirectory 
             clinics={currentTenant.clinics} 
             systems={currentTenant.systems} 
             employees={currentTenant.employees} 
             onAddEmployee={handleAddEmployee} 
             onUpdateEmployee={handleUpdateEmployee} 
          />
          {/* NOTE: Inside UserDirectory, we are using a simplified InviteModal that relies on passing tenantId via props was cleaner,
              but for minimal code changes I embedded it in UserDirectory. Since UserDirectory receives employees list,
              I grabbed tenant_id from employee data inside the component.
           */}
        </>
      );
      case 'costs': return <CostAnalysis systems={currentTenant.systems} employees={currentTenant.employees} />;
      case 'governance': return <Governance governance={currentTenant.governance || GOVERNANCE_RULES} onUpdate={handleUpdateGovernance} />;
      default: return <Dashboard clinics={currentTenant.clinics} systems={currentTenant.systems} employees={currentTenant.employees} />;
    }
  };

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab} user={currentUser} onLogout={logout}>
      {/* Onboarding Wizard Modal */}
      {showOnboarding && <OnboardingWizard tenantId={currentTenant.id} onComplete={loadTenantData} />}

      <div className="mb-4 flex flex-col md:flex-row justify-between items-end md:items-center gap-2">
         <div className="flex items-center space-x-2">
            <div className={`flex items-center text-xs px-3 py-1.5 rounded-full transition-colors ${
              isSaving ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
            }`}>
                {isSaving ? (
                  <>
                    <Loader2 size={14} className="animate-spin mr-1.5" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Cloud size={14} className="mr-1.5" />
                    <span>Online</span>
                  </>
                )}
            </div>
         </div>
      </div>
      {renderContent()}
    </Layout>
  );
};

// Main App Wrapper
const App: React.FC = () => {
  return (
    <NotificationProvider>
      <AppContent />
    </NotificationProvider>
  );
};

export default App;