import React from 'react';
import { Tenant } from '../../types';
import { Activity, Users, DollarSign, Database, LogOut } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface SuperAdminDashboardProps {
  tenants: Tenant[];
  onLogout: () => void;
}

const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({ tenants, onLogout }) => {
  const totalMRR = tenants.reduce((acc, t) => {
    // Mock MRR calc: Pro = 30000, Enterprise = 100000, Free = 0
    let amount = 0;
    if (t.plan === 'Pro') amount = 30000;
    if (t.plan === 'Enterprise') amount = 100000;
    return acc + amount;
  }, 0);

  const totalUsers = tenants.reduce((acc, t) => acc + t.employees.length, 0);

  const chartData = tenants.map(t => ({
    name: t.name,
    users: t.employees.length,
    systems: t.systems.length
  }));

  return (
    <div className="min-h-screen bg-slate-100 font-sans">
      <nav className="bg-slate-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Database className="text-purple-400 mr-2" />
              <span className="font-bold text-xl">Dental IT Manager <span className="text-xs bg-purple-600 px-2 py-1 rounded ml-2">ADMIN</span></span>
            </div>
            <div className="flex items-center">
              <button 
                onClick={onLogout}
                className="text-slate-300 hover:text-white flex items-center text-sm"
              >
                <LogOut size={16} className="mr-1" /> ログアウト
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">運営管理ダッシュボード</h1>
          <p className="text-slate-500 mt-1">SaaS全体の利用状況とクライアント管理</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
           <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
             <div className="flex justify-between items-start">
                <div>
                   <p className="text-sm text-slate-500 font-medium">導入クライアント数</p>
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
                   <p className="text-sm text-slate-500 font-medium">総管理ユーザー数</p>
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
                   <p className="text-sm text-slate-500 font-medium">システム稼働状況</p>
                   <p className="text-3xl font-bold text-slate-900 mt-2">100%</p>
                </div>
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
                   <Activity size={24} />
                </div>
             </div>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           {/* Tenant List */}
           <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200">
                 <h2 className="text-lg font-bold text-slate-900">クライアント一覧</h2>
              </div>
              <div className="overflow-x-auto">
                 <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                       <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">会社名</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">プラン</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">ユーザー数</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">ステータス</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">登録日</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                       {tenants.map((t) => (
                          <tr key={t.id} className="hover:bg-slate-50">
                             <td className="px-6 py-4 text-sm font-medium text-slate-900">{t.name}</td>
                             <td className="px-6 py-4 text-sm text-slate-500">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                   t.plan === 'Enterprise' ? 'bg-purple-100 text-purple-700' : 
                                   t.plan === 'Pro' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'
                                }`}>
                                   {t.plan}
                                </span>
                             </td>
                             <td className="px-6 py-4 text-sm text-slate-500">{t.employees.length}名</td>
                             <td className="px-6 py-4 text-sm text-slate-500">
                                <span className="flex items-center text-green-600">
                                   <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                                   Active
                                </span>
                             </td>
                             <td className="px-6 py-4 text-sm text-slate-500">{t.createdAt}</td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </div>

           {/* Usage Chart */}
           <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-6">利用規模比較</h2>
              <div className="h-64">
                 <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} layout="vertical">
                       <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                       <XAxis type="number" />
                       <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12}} />
                       <Tooltip />
                       <Bar dataKey="users" name="ユーザー数" fill="#8884d8" radius={[0, 4, 4, 0]} />
                    </BarChart>
                 </ResponsiveContainer>
              </div>
           </div>
        </div>
      </main>
    </div>
  );
};

export default SuperAdminDashboard;