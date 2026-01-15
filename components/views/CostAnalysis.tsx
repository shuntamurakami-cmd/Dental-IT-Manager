import React from 'react';
import { SYSTEMS, EMPLOYEES } from '../../constants';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { DollarSign, TrendingUp } from 'lucide-react';

const CostAnalysis: React.FC = () => {
  // Compute cost data per system
  const systemCosts = SYSTEMS.map(sys => {
    const userCount = EMPLOYEES.filter(e => e.assignedSystems.includes(sys.id)).length;
    const totalCost = sys.baseMonthlyCost + (sys.monthlyCostPerUser * userCount);
    return {
      name: sys.name,
      value: totalCost,
      userCount
    };
  }).sort((a, b) => b.value - a.value);

  const totalMonthlyCost = systemCosts.reduce((acc, item) => acc + item.value, 0);
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#6366f1', '#8b5cf6'];

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">コスト管理</h1>
        <p className="text-slate-500">IT投資対効果の可視化と予実管理</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Summary Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-sm font-medium text-slate-500 mb-2">月間総コスト（概算）</h3>
            <div className="flex items-baseline">
              <span className="text-3xl font-bold text-slate-900">¥{totalMonthlyCost.toLocaleString()}</span>
              <span className="ml-2 text-sm text-slate-500">/月</span>
            </div>
            <div className="mt-4 p-3 bg-blue-50 rounded-lg flex items-start">
              <TrendingUp size={18} className="text-blue-600 mt-0.5 mr-2" />
              <p className="text-sm text-blue-800">
                1人あたりのITコスト: <br/>
                <span className="font-bold">¥{Math.round(totalMonthlyCost / EMPLOYEES.length).toLocaleString()}</span>
              </p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-4">コスト構成比</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={systemCosts}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {systemCosts.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `¥${value.toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
             <div className="mt-2 space-y-2">
               {systemCosts.slice(0, 3).map((item, idx) => (
                 <div key={item.name} className="flex items-center justify-between text-sm">
                   <div className="flex items-center">
                     <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: COLORS[idx] }}></div>
                     {item.name}
                   </div>
                   <span className="font-medium text-slate-700">{Math.round((item.value / totalMonthlyCost) * 100)}%</span>
                 </div>
               ))}
             </div>
          </div>
        </div>

        {/* Detail Table */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <h3 className="text-lg font-bold text-slate-900">システム別コスト内訳</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">システム名</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">基本料金</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">単価 x 人数</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">小計</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {systemCosts.map((item) => {
                   const sys = SYSTEMS.find(s => s.name === item.name);
                   return (
                    <tr key={item.name} className="hover:bg-slate-50">
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">{item.name}</td>
                      <td className="px-6 py-4 text-sm text-slate-500 text-right">¥{sys?.baseMonthlyCost.toLocaleString()}</td>
                      <td className="px-6 py-4 text-sm text-slate-500 text-right">
                        ¥{sys?.monthlyCostPerUser.toLocaleString()} × {item.userCount}名
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-slate-900 text-right">¥{item.value.toLocaleString()}</td>
                    </tr>
                   );
                })}
              </tbody>
              <tfoot className="bg-slate-50">
                <tr>
                  <td colSpan={3} className="px-6 py-4 text-sm font-bold text-slate-900 text-right">合計</td>
                  <td className="px-6 py-4 text-sm font-bold text-blue-600 text-right">¥{totalMonthlyCost.toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CostAnalysis;