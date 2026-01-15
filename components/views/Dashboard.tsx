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
import { Users, CreditCard, AlertTriangle, CheckCircle } from 'lucide-react';
import { CLINICS, EMPLOYEES, SYSTEMS } from '../../constants';
import { ClinicType } from '../../types';

const Dashboard: React.FC = () => {
  // Calculate Totals
  const totalStaff = EMPLOYEES.length;
  
  // Simple Cost Approx (Logic repeated in Cost component, simplified here)
  const monthlyTotal = SYSTEMS.reduce((acc, sys) => {
    const userCount = EMPLOYEES.filter(e => e.assignedSystems.includes(sys.id)).length;
    return acc + sys.baseMonthlyCost + (sys.monthlyCostPerUser * userCount);
  }, 0);

  const activeAlerts = SYSTEMS.filter(s => s.status === 'Review' || s.issues.length > 0).length;

  // Chart Data: Staff by Role
  const roleData = React.useMemo(() => {
    const roles: Record<string, number> = {};
    EMPLOYEES.forEach(e => {
      roles[e.role] = (roles[e.role] || 0) + 1;
    });
    return Object.keys(roles).map(role => ({ name: role.split(' ')[0], count: roles[role] }));
  }, []);

  // Chart Data: Staff by Clinic
  const clinicData = React.useMemo(() => {
    return CLINICS.map(clinic => {
      return {
        name: clinic.name.replace('ホワイトデンタル ', '').replace('クリニック', ''),
        count: EMPLOYEES.filter(e => e.clinicId === clinic.id).length
      };
    });
  }, []);

  const COLORS = ['#0ea5e9', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">ダッシュボード</h1>
        <p className="text-slate-500">医院全体のIT資産・人員状況のサマリー</p>
      </div>

      {/* Stat Cards */}
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
            <span className="font-medium mr-2">内訳:</span>
            常勤 {EMPLOYEES.filter(e => e.employmentType === '常勤').length} / 非常勤 {EMPLOYEES.filter(e => e.employmentType === '非常勤').length}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">契約/課題アラート</p>
              <p className="text-2xl font-bold text-slate-900">{activeAlerts}件</p>
            </div>
            <div className="p-3 bg-amber-50 rounded-lg text-amber-600">
              <AlertTriangle size={24} />
            </div>
          </div>
          <div className="mt-4 text-sm text-slate-600">
            要確認のシステム契約があります
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

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-900 mb-4">職種別スタッフ構成</h3>
          <div className="h-64">
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

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-900 mb-4">医院別スタッフ配置</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={clinicData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="count"
                >
                  {clinicData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 text-sm text-slate-600 mt-2">
            {clinicData.map((entry, index) => (
              <div key={index} className="flex items-center">
                <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                {entry.name}: {entry.count}名
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;