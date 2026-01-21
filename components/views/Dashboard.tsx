import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Users, CreditCard, AlertTriangle, CheckCircle, CalendarDays } from 'lucide-react';
import { Clinic, Employee, SystemTool } from '../../types';

interface DashboardProps {
  clinics: Clinic[];
  systems: SystemTool[];
  employees: Employee[];
}

const Dashboard: React.FC<DashboardProps> = ({ clinics, systems, employees }) => {
  const totalStaff = employees.length;
  
  const monthlyTotal = systems.reduce((acc, sys) => {
    const userCount = employees.filter(e => e.assignedSystems.includes(sys.id)).length;
    return acc + sys.baseMonthlyCost + (sys.monthlyCostPerUser * userCount);
  }, 0);

  // Filter systems renewing in next 30 days
  const upcomingRenewals = systems.filter(sys => {
    if (!sys.renewalDate) return false;
    const renewal = new Date(sys.renewalDate);
    const now = new Date();
    const diff = (renewal.getTime() - now.getTime()) / (1000 * 3600 * 24);
    return diff > 0 && diff <= 30;
  });

  const activeAlerts = systems.filter(s => s.status === 'Review' || s.issues.length > 0).length + upcomingRenewals.length;

  const roleData = React.useMemo(() => {
    const roles: Record<string, number> = {};
    employees.forEach(e => {
      roles[e.role] = (roles[e.role] || 0) + 1;
    });
    return Object.keys(roles).map(role => ({ name: role.split(' ')[0], count: roles[role] }));
  }, [employees]);

  const clinicData = React.useMemo(() => {
    return clinics.map(clinic => {
      return {
        name: clinic.name.replace('クリニック', ''),
        count: employees.filter(e => e.clinicId === clinic.id).length
      };
    });
  }, [clinics, employees]);

  const COLORS = ['#0ea5e9', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">ダッシュボード</h1>
        <p className="text-slate-500">医院全体のIT資産・人員状況のサマリー</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">今月のIT総コスト</p>
              <p className="text-2xl font-bold text-slate-900">¥{monthlyTotal.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
              <CreditCard size={24} />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-slate-600">
            <span className="text-green-600 font-medium mr-2">安定推移</span>
            前月比 +0%
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">従業員総数</p>
              <p className="text-2xl font-bold text-slate-900">{totalStaff}名</p>
            </div>
            <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600">
              <Users size={24} />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-slate-600">
            常勤 {employees.filter(e => e.employmentType === '常勤').length} / 非常勤 {employees.filter(e => e.employmentType === '非常勤').length}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">アラート/期限切近</p>
              <p className="text-2xl font-bold text-slate-900">{activeAlerts}件</p>
            </div>
            <div className="p-3 bg-amber-50 rounded-lg text-amber-600">
              <AlertTriangle size={24} />
            </div>
          </div>
          <div className="mt-4 text-sm text-slate-600">
            {upcomingRenewals.length}件の契約更新が間近です
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">システム稼働率</p>
              <p className="text-2xl font-bold text-slate-900">100%</p>
            </div>
            <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600">
              <CheckCircle size={24} />
            </div>
          </div>
          <div className="mt-4 text-sm text-slate-600">
            全システム正常稼働中
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Renewals List */}
        <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
            <CalendarDays size={18} className="mr-2 text-blue-600" />
            30日以内の更新予定
          </h3>
          <div className="space-y-4">
            {upcomingRenewals.length === 0 ? (
              <p className="text-sm text-slate-400 py-8 text-center border border-dashed rounded-lg">直近の更新予定はありません</p>
            ) : (
              upcomingRenewals.map(sys => (
                <div key={sys.id} className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-slate-900 text-sm">{sys.name}</span>
                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                      残り {Math.ceil((new Date(sys.renewalDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24))}日
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">更新日: {sys.renewalDate}</div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Charts Container */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-4">職種別スタッフ構成</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={roleData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: '#f1f5f9' }} />
                  <Bar dataKey="count" fill="#0ea5e9" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;