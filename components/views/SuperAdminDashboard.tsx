import React, { useState } from 'react';
import { Tenant } from '../../types';
import { Activity, Users, DollarSign, Database, LogOut, Search, X, Loader2, Trash2, KeyRound, AlertTriangle, ShieldAlert } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { db } from '../../services/db';
import { useNotification } from '../../contexts/NotificationContext';

interface SuperAdminDashboardProps {
  tenants: Tenant[];
  onLogout: () => void;
  onRefresh?: () => Promise<void>;
}

const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({ tenants, onLogout, onRefresh }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'tenants'>('overview');
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const { notify } = useNotification();

  // Derived Stats
  const totalMRR = tenants.reduce((acc, t) => {
    let amount = 0;
    if (t.status !== 'Suspended') {
        if (t.plan === 'Pro') amount = 30000;
        if (t.plan === 'Enterprise') amount = 100000;
    }
    return acc + amount;
  }, 0);

  const totalUsers = tenants.reduce((acc, t) => acc + t.employees.length, 0);

  const filteredTenants = tenants.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.ownerEmail.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Actions
  const handleToggleStatus = async (e: React.MouseEvent, tenant: Tenant) => {
    e.stopPropagation();
    if (!window.confirm(`${tenant.name} のステータスを変更しますか？`)) return;
    setProcessingId(tenant.id);
    try {
      const newStatus = tenant.status === 'Suspended' ? 'Active' : 'Suspended';
      await db.updateTenantStatus(tenant.id, newStatus);
      notify('success', `ステータスを ${newStatus} に変更しました`);
      if (onRefresh) await onRefresh();
    } catch (err: any) {
      notify('error', 'ステータスの変更に失敗しました');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeleteTenant = async (e: React.MouseEvent, tenant: Tenant) => {
    e.stopPropagation();
    
    // Completely destructive action warning
    const confirmMsg = `【危険】${tenant.name} を完全に削除しますか？\n\n・データベース上の全データが消去されます\n・認証ユーザー(${tenant.ownerEmail})もAuthから完全に削除されます\n・このユーザーは次回、新規登録として扱われます\n\n本当に実行しますか？`;
    
    if (!window.confirm(confirmMsg)) return;
    
    setProcessingId(tenant.id);
    try {
      // 1. Delete App Data (DB)
      await db.deleteTenant(tenant.id);
      
      // 2. Delete Auth User (Supabase Auth) via RPC
      // Note: This only works if the admin_delete_user function is set up in SQL
      try {
        await db.deleteAuthUser(tenant.ownerEmail);
        notify('success', 'データと認証ユーザーを完全に削除しました');
      } catch (authErr: any) {
        console.error('Auth deletion failed:', authErr);
        notify('info', 'データは削除されましたが、認証ユーザーの削除に失敗しました（SQL関数の設定を確認してください）');
      }

      if (onRefresh) await onRefresh();
      if (selectedTenant?.id === tenant.id) setSelectedTenant(null);
    } catch (err: any) {
      console.error(err);
      notify('error', `削除エラー: ${err.message}`);
    } finally {
      setProcessingId(null);
    }
  };

  const handlePasswordReset = async (email: string) => {
    if (!window.confirm(`${email} にパスワード再設定メールを送信しますか？`)) return;
    try {
      await db.sendPasswordResetEmail(email);
      notify('success', '再設定メールを送信しました');
    } catch (err: any) {
      notify('error', '送信に失敗しました');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans">
      {/* Navbar */}
      <nav className="bg-slate-900 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Database className="text-purple-400 mr-2" />
              <span className="font-bold text-xl">Dental IT Manager <span className="text-xs bg-purple-600 px-2 py-1 rounded ml-2">ADMIN</span></span>
              
              <div className="ml-10 flex items-baseline space-x-4">
                <button 
                  onClick={() => setActiveTab('overview')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'overview' ? 'bg-slate-800 text-white' : 'text-slate-300 hover:text-white'}`}
                >
                  ダッシュボード
                </button>
                <button 
                  onClick={() => setActiveTab('tenants')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'tenants' ? 'bg-slate-800 text-white' : 'text-slate-300 hover:text-white'}`}
                >
                  クライアント管理
                </button>
              </div>
            </div>
            <div className="flex items-center">
              <button onClick={onLogout} className="text-slate-300 hover:text-white flex items-center text-sm">
                <LogOut size={16} className="mr-1" /> ログアウト
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        
        {activeTab === 'overview' ? (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                  <div className="flex justify-between items-start">
                     <div>
                        <p className="text-sm text-slate-500 font-medium">導入クライアント</p>
                        <p className="text-3xl font-bold text-slate-900 mt-2">{tenants.length}</p>
                     </div>
                     <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
                        <Database size={24} />
                     </div>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                  <div className="flex justify-between items-start">
                     <div>
                        <p className="text-sm text-slate-500 font-medium">総管理ユーザー</p>
                        <p className="text-3xl font-bold text-slate-900 mt-2">{totalUsers}</p>
                     </div>
                     <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                        <Users size={24} />
                     </div>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                  <div className="flex justify-between items-start">
                     <div>
                        <p className="text-sm text-slate-500 font-medium">推定MRR</p>
                        <p className="text-3xl font-bold text-slate-900 mt-2">¥{totalMRR.toLocaleString()}</p>
                     </div>
                     <div className="p-3 bg-green-50 text-green-600 rounded-lg">
                        <DollarSign size={24} />
                     </div>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                  <div className="flex justify-between items-start">
                     <div>
                        <p className="text-sm text-slate-500 font-medium">システム健全性</p>
                        <p className="text-3xl font-bold text-slate-900 mt-2">100%</p>
                     </div>
                     <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
                        <Activity size={24} />
                     </div>
                  </div>
                </div>
             </div>

             <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-6">テナント別利用規模</h3>
                <div className="h-80">
                   <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={tenants.map(t => ({ name: t.name, users: t.employees.length, systems: t.systems.length }))}>
                         <CartesianGrid strokeDasharray="3 3" vertical={false} />
                         <XAxis dataKey="name" />
                         <YAxis />
                         <Tooltip />
                         <Bar dataKey="users" name="ユーザー数" fill="#8884d8" radius={[4, 4, 0, 0]} />
                         <Bar dataKey="systems" name="登録システム数" fill="#82ca9d" radius={[4, 4, 0, 0]} />
                      </BarChart>
                   </ResponsiveContainer>
                </div>
             </div>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center">
              <div className="relative max-w-sm w-full">
                 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                 <input 
                   type="text" 
                   placeholder="会社名、メールアドレスで検索..." 
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                   className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                 />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
               <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                     <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">会社名</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">管理者</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">プラン</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">ステータス</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">アクション</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                     {filteredTenants.map((t) => (
                        <tr key={t.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => setSelectedTenant(t)}>
                           <td className="px-6 py-4 whitespace-nowrap">
                              <div className="font-medium text-slate-900">{t.name}</div>
                              <div className="text-xs text-slate-500">ID: {t.id}</div>
                           </td>
                           <td className="px-6 py-4 text-sm text-slate-500">{t.ownerEmail}</td>
                           <td className="px-6 py-4">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                 t.plan === 'Enterprise' ? 'bg-purple-100 text-purple-700' : 
                                 t.plan === 'Pro' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'
                              }`}>
                                 {t.plan}
                              </span>
                           </td>
                           <td className="px-6 py-4">
                              {t.status === 'Suspended' ? (
                                <span className="inline-flex items-center text-red-600 bg-red-50 px-2 py-1 rounded-full text-xs font-medium">
                                  停止中
                                </span>
                              ) : (
                                <span className="inline-flex items-center text-green-600 bg-green-50 px-2 py-1 rounded-full text-xs font-medium">
                                   稼働中
                                </span>
                              )}
                           </td>
                           <td className="px-6 py-4 text-right space-x-2">
                              <button 
                                onClick={(e) => { e.stopPropagation(); setSelectedTenant(t); }}
                                className="text-blue-600 hover:text-blue-900 text-sm font-medium z-10 relative"
                              >
                                詳細
                              </button>
                              <button 
                                onClick={(e) => handleToggleStatus(e, t)}
                                disabled={processingId === t.id}
                                className={`${t.status === 'Suspended' ? 'text-green-600 hover:text-green-900' : 'text-amber-600 hover:text-amber-900'} text-sm font-medium disabled:opacity-50 z-10 relative`}
                              >
                                {processingId === t.id ? <Loader2 className="animate-spin" size={16} /> : (t.status === 'Suspended' ? '再開' : '停止')}
                              </button>
                              <button 
                                type="button"
                                onClick={(e) => handleDeleteTenant(e, t)}
                                disabled={processingId === t.id}
                                className="text-red-600 hover:text-red-900 text-sm font-medium disabled:opacity-50 z-10 relative"
                              >
                                {processingId === t.id ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} className="pointer-events-none" />}
                              </button>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
          </div>
        )}

        {/* Tenant Detail Modal */}
        {selectedTenant && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl max-w-4xl w-full p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
               <div className="flex justify-between items-center mb-6">
                 <div>
                    <h2 className="text-xl font-bold text-slate-900">{selectedTenant.name} の詳細</h2>
                    <p className="text-sm text-slate-500">{selectedTenant.id}</p>
                 </div>
                 <button onClick={() => setSelectedTenant(null)} className="text-slate-400 hover:text-slate-600">
                   <X size={24} />
                 </button>
               </div>

               <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-start">
                  <ShieldAlert className="text-green-600 mr-3 mt-0.5" size={20} />
                  <div>
                    <h4 className="font-bold text-green-800 text-sm">完全削除が可能になりました</h4>
                    <p className="text-sm text-green-700 mt-1">
                      SQLエディタで「管理者用関数」を実行済みであれば、
                      ここからの削除操作で<b>認証ユーザー(Auth)も同時に削除</b>されます。<br/>
                      これにより、同じメールアドレスでの再登録が可能になります。
                    </p>
                  </div>
               </div>

               <div className="grid grid-cols-3 gap-4 mb-6">
                 <div className="bg-slate-50 p-4 rounded-lg">
                   <p className="text-xs text-slate-500">導入システム数</p>
                   <p className="text-2xl font-bold text-slate-800">{selectedTenant.systems.length}</p>
                 </div>
                 <div className="bg-slate-50 p-4 rounded-lg">
                   <p className="text-xs text-slate-500">拠点数 (医院)</p>
                   <p className="text-2xl font-bold text-slate-800">{selectedTenant.clinics.length}</p>
                 </div>
                 <div className="bg-slate-50 p-4 rounded-lg">
                   <p className="text-xs text-slate-500">登録ユーザー数</p>
                   <p className="text-2xl font-bold text-slate-800">{selectedTenant.employees.length}</p>
                 </div>
               </div>

               <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
                 <Users size={20} className="mr-2 text-slate-500" />
                 登録ユーザー & サポート
               </h3>
               
               <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                 <table className="min-w-full divide-y divide-slate-200">
                   <thead className="bg-slate-50">
                     <tr>
                       <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">氏名</th>
                       <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">メールアドレス</th>
                       <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">権限</th>
                       <th className="px-4 py-2 text-right text-xs font-medium text-slate-500">サポート</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-200">
                     {selectedTenant.employees.map(emp => (
                       <tr key={emp.id} className="hover:bg-slate-50">
                         <td className="px-4 py-3 text-sm font-medium text-slate-900">{emp.lastName} {emp.firstName}</td>
                         <td className="px-4 py-3 text-sm text-slate-500">{emp.email}</td>
                         <td className="px-4 py-3 text-sm text-slate-500">{emp.role}</td>
                         <td className="px-4 py-3 text-right">
                           <button 
                             onClick={() => handlePasswordReset(emp.email)}
                             className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded border border-blue-200 hover:bg-blue-100 flex items-center ml-auto"
                           >
                             <KeyRound size={12} className="mr-1" />
                             PW再設定
                           </button>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default SuperAdminDashboard;