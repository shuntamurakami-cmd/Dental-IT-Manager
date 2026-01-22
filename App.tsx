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
import { Loader2, AlertCircle, Cloud, ShieldAlert, RefreshCw } from 'lucide-react';
import { Tenant, User, UserRole, Clinic, SystemTool, Employee, GovernanceConfig, ClinicType, StaffRole, EmploymentType } from './types';
import { db } from './services/db';
import { supabase } from './services/supabase';
import { GOVERNANCE_RULES, CLINICS, SYSTEMS, EMPLOYEES } from './constants';
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
    if (!currentUser) return;

    // Always start loading when fetching/resolving data
    setIsLoading(true);

    try {
      let effectiveTenantId = currentUser.tenantId;

      // 1. Resolve pending tenant ID (e.g. for old users or race condition in signup)
      if (effectiveTenantId === 'pending' && currentUser.role !== UserRole.SUPER_ADMIN) {
        const foundId = await db.getTenantIdByEmail(currentUser.email);
        if (foundId) {
          effectiveTenantId = foundId;
          // Update local state to avoid re-fetching next time
          setCurrentUser(prev => prev ? { ...prev, tenantId: foundId } : null);
        }
      }

      // 2. If still pending, we cannot load data.
      // BUT: If the user is logged in, but has no tenant (Orphan), we return empty to show the "Setup Needed" screen
      if (effectiveTenantId === 'pending' && currentUser.role !== UserRole.SUPER_ADMIN) {
        setTenants([]);
        setIsLoading(false);
        return;
      }

      // 3. Fetch Data
      const targetTenantId = currentUser.role === UserRole.SUPER_ADMIN ? undefined : effectiveTenantId;
      const data = await db.getTenants(targetTenantId);
      setTenants(data);
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

  // Helper to create initial data (Moved out to be reusable for Ghost User recovery)
  const initializeTenantData = async (
    newTenantId: string, 
    email: string, 
    company: string, 
    firstName: string, 
    lastName: string,
    isGuestDemo: boolean
  ) => {
    const defaultClinicId = `c_${Date.now()}_hq`;
    const adminEmployeeId = `e_${Date.now()}_admin`;

    const defaultClinic: Clinic = {
      id: defaultClinicId,
      name: isGuestDemo ? 'ホワイトデンタルクリニック 本院' : `${company} 本院`,
      type: ClinicType.HQ,
      address: isGuestDemo ? '東京都港区六本木1-1-1' : '',
      phone: isGuestDemo ? '03-1234-5678' : '',
      chairs: isGuestDemo ? 8 : 0
    };

    const adminEmployee: Employee = {
      id: adminEmployeeId,
      firstName: firstName || '管理者',
      lastName: lastName || '',
      clinicId: defaultClinicId,
      role: '事務', // Admin Role (changed from '情報システム' to match new list)
      employmentType: EmploymentType.FULL_TIME,
      email: email,
      joinDate: new Date().toISOString().split('T')[0],
      assignedSystems: [],
      status: 'Active',
      accountType: 'Google Workspace'
    };

    await db.upsertTenant(newTenantId, {
      id: newTenantId,
      name: isGuestDemo ? 'ホワイトデンタルグループ (Demo)' : company,
      plan: 'Pro',
      status: 'Active',
      ownerEmail: email,
      governance: GOVERNANCE_RULES
    });
    
    await db.upsertClinic(newTenantId, defaultClinic);
    await db.upsertEmployee(newTenantId, adminEmployee);

    if (isGuestDemo) {
       for (const c of CLINICS) {
         if (c.id === 'c1') continue; 
         await db.upsertClinic(newTenantId, { ...c, id: `${newTenantId}_${c.id}` });
       }
       for (const s of SYSTEMS) {
         await db.upsertSystem(newTenantId, { ...s, id: `${newTenantId}_${s.id}` });
       }
       for (const e of EMPLOYEES) {
         if (e.id === 'e1') continue;
         const mappedClinicId = e.clinicId === 'c1' ? defaultClinicId : `${newTenantId}_${e.clinicId}`;
         const mappedSystems = e.assignedSystems.map(sysId => `${newTenantId}_${sysId}`);
         await db.upsertEmployee(newTenantId, { 
           ...e, 
           id: `${newTenantId}_${e.id}`, 
           clinicId: mappedClinicId,
           assignedSystems: mappedSystems
         });
       }
    }
  };
  
  // --- Auth Actions ---
  const login = async (email: string, pass: string): Promise<{ success: boolean; message?: string }> => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
    
    if (error) {
      if (email === 'admin@saas-provider.com' && error.message.includes('Invalid login credentials')) {
         return signup('SaaS Provider Inc.', 'System', 'Admin', email, pass);
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
    const isGuestDemo = email.startsWith('guest_');

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password: pass,
        options: { 
          data: { 
            full_name: `${lastName} ${firstName}`,
            tenant_id: inviteTenantId || undefined
          } 
        }
      });

      // Handle "User already registered" case (Ghost User Recovery)
      if (authError) {
        if (authError.message.includes('User already registered') || authError.message.includes('unique constraint')) {
          // Try to login to verify ownership
          const { error: loginError } = await supabase.auth.signInWithPassword({ email, password: pass });
          if (!loginError) {
             // Check if tenant exists
             const existingTenantId = await db.getTenantIdByEmail(email);
             if (!existingTenantId && !inviteTenantId) {
                // ORPHAN DETECTED: Auth exists, but DB data is gone. Re-initialize.
                const newTenantId = `tenant_${Date.now()}`;
                await initializeTenantData(newTenantId, email, company, firstName, lastName, isGuestDemo);
                notify('success', 'アカウントデータを再構築しました');
                
                // Refresh state
                setCurrentUser(prev => prev ? { ...prev, tenantId: newTenantId } : null);
                const data = await db.getTenants(newTenantId);
                setTenants(data);
                setIsSaving(false);
                return { success: true };
             } else {
               setIsSaving(false);
               return { success: false, message: 'このメールアドレスは既に登録されています。ログインしてください。' };
             }
          }
        }
        setIsSaving(false);
        return { success: false, message: authError.message };
      }

      if (!authData.user) {
        setIsSaving(false);
        return { success: true, message: '確認メールを送信しました。' };
      }

      // New Tenant ID logic
      const newTenantId = inviteTenantId || `tenant_${Date.now()}`;

      // 2. Create Initial Data in DB
      if (inviteTenantId) {
        const employeeId = `e_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        const newEmployee: Employee = {
          id: employeeId,
          firstName: firstName,
          lastName: lastName,
          clinicId: '', 
          role: '歯科助手', // Default role (changed from '歯科助手 (DA)' to match new list)
          employmentType: EmploymentType.FULL_TIME,
          email: email,
          joinDate: new Date().toISOString().split('T')[0],
          assignedSystems: [],
          status: 'Active',
          accountType: 'Google Workspace'
        };
        await db.upsertEmployee(inviteTenantId, newEmployee);
        notify('success', '組織に参加しました');
      } else {
        await initializeTenantData(newTenantId, email, company, firstName, lastName, isGuestDemo);
        
        if (isGuestDemo) notify('success', 'デモ環境を構築しました');
        else notify('success', 'アカウントと組織を作成しました');
      }
      
      // Update local state immediately
      setCurrentUser(prev => prev ? { ...prev, tenantId: newTenantId } : null);
      
      // Load data
      const data = await db.getTenants(newTenantId);
      setTenants(data);
      
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

  // Manual trigger for users who are logged in but have no data (Orphan recovery UI)
  const handleRecoverAccount = async () => {
    if (!currentUser) return;
    setIsSaving(true);
    try {
      const newTenantId = `tenant_${Date.now()}`;
      // Use generic names as we might have lost the original inputs
      const [lastName, firstName] = (currentUser.name || 'Admin User').split(' ');
      
      await initializeTenantData(
        newTenantId, 
        currentUser.email, 
        'マイクリニック (復旧)', 
        firstName || 'User', 
        lastName || 'Admin', 
        false
      );
      
      notify('success', '組織データを再作成しました');
      setCurrentUser(prev => prev ? { ...prev, tenantId: newTenantId } : null);
      const data = await db.getTenants(newTenantId);
      setTenants(data);
    } catch (err: any) {
      notify('error', `復旧に失敗しました: ${err.message}`);
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

  const wrapMutation = async (mutation: () => Promise<void>, successMessage: string) => {
    if (!currentUser || !tenants.length) return;
    setIsSaving(true);
    try {
      await mutation();
      // Only refresh data for current tenant
      const data = await db.getTenants(currentUser.tenantId);
      setTenants(data);
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
  const handleDeleteSystem = (systemId: string) => wrapMutation(() => db.deleteSystem(tenants[0].id, systemId), 'システムを削除しました');
  
  const handleAddEmployee = (data: Employee) => wrapMutation(() => db.upsertEmployee(tenants[0].id, data), 'スタッフを登録しました');
  const handleUpdateEmployee = (data: Employee) => wrapMutation(() => db.upsertEmployee(tenants[0].id, data), 'スタッフ情報を更新しました');
  const handleDeleteEmployee = (employeeId: string) => wrapMutation(() => db.deleteEmployee(tenants[0].id, employeeId), 'スタッフを削除しました');
  const handleUpdateGovernance = (data: GovernanceConfig) => wrapMutation(() => db.upsertTenant(tenants[0].id, { governance: data }), '運用ルールを更新しました');

  const currentTenant = tenants[0];

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
        onDemoStart={(email, pass) => signup('White Dental Demo', 'Demo', 'User', email, pass)} 
      />
    );
  }

  if (currentUser.role === UserRole.SUPER_ADMIN) {
    return (
       <SuperAdminDashboard 
         tenants={tenants} 
         onLogout={logout} 
         onRefresh={() => loadTenantData()}
       />
    );
  }

  if (!currentTenant) {
    // If we are currently saving (creating account), show loading instead of error
    if (isSaving) {
        return (
          <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 text-slate-600">
             <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
             <p className="font-medium">アカウント設定中...</p>
          </div>
        );
    }
    return (
      <div className="p-8 text-center flex flex-col items-center justify-center min-h-screen bg-slate-50">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
          <AlertCircle className="text-amber-500 mb-4 mx-auto" size={48} />
          <h2 className="text-xl font-bold mb-2 text-slate-900">組織データが見つかりません</h2>
          <p className="text-slate-500 mb-6 text-sm leading-relaxed">
            アカウントは存在しますが、関連付けられた組織データが削除されたか、まだ作成されていません。
          </p>
          
          <div className="space-y-3">
             <button 
               onClick={handleRecoverAccount} 
               className="w-full flex items-center justify-center px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold transition-all shadow-lg shadow-blue-200"
             >
               <RefreshCw size={18} className="mr-2" />
               組織データを新規作成する
             </button>
             <button 
               onClick={logout} 
               className="w-full px-4 py-2.5 text-slate-500 hover:text-slate-700 font-medium"
             >
               一度ログアウトする
             </button>
          </div>
        </div>
      </div>
    );
  }

  // Show Onboarding Wizard if no systems are registered
  const showOnboarding = currentTenant.systems.length === 0;

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard clinics={currentTenant.clinics} systems={currentTenant.systems} employees={currentTenant.employees} />;
      case 'clinics': return <ClinicManagement clinics={currentTenant.clinics} employees={currentTenant.employees} onAddClinic={handleAddClinic} onUpdateClinic={handleUpdateClinic} />;
      case 'systems': 
        return <SystemCatalog 
                 systems={currentTenant.systems} 
                 employees={currentTenant.employees} 
                 onAddSystem={handleAddSystem} 
                 onUpdateSystem={handleUpdateSystem} 
                 onDeleteSystem={handleDeleteSystem}
               />;
      case 'users': return (
        <>
          <UserDirectory 
             tenantId={currentTenant.id}
             clinics={currentTenant.clinics} 
             systems={currentTenant.systems} 
             employees={currentTenant.employees} 
             governance={currentTenant.governance || GOVERNANCE_RULES}
             onAddEmployee={handleAddEmployee} 
             onUpdateEmployee={handleUpdateEmployee}
             onDeleteEmployee={handleDeleteEmployee}
             onUpdateGovernance={handleUpdateGovernance}
          />
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
      {showOnboarding && <OnboardingWizard tenantId={currentTenant.id} onComplete={() => loadTenantData()} />}

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
            {currentUser.email.startsWith('guest_') && (
              <div className="bg-indigo-100 text-indigo-700 text-xs px-3 py-1.5 rounded-full font-bold flex items-center">
                 <ShieldAlert size={12} className="mr-1" />
                 Guest Demo Mode
              </div>
            )}
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