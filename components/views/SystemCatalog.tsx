import React from 'react';
import { ExternalLink, AlertCircle, Calendar, User, Server } from 'lucide-react';
import { SystemTool } from '../../types';

interface SystemCatalogProps {
  systems: SystemTool[];
}

const SystemCatalog: React.FC<SystemCatalogProps> = ({ systems }) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">システム台帳</h1>
          <p className="text-slate-500">導入済みSaaS・ソフトウェアの一元管理</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
          + システム登録
        </button>
      </div>

      {systems.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200 border-dashed">
          <Server className="mx-auto h-12 w-12 text-slate-300" />
          <h3 className="mt-2 text-sm font-medium text-slate-900">システムが登録されていません</h3>
          <p className="mt-1 text-sm text-slate-500">利用しているSaaSやソフトウェアを登録しましょう。</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {systems.map((sys) => (
            <div key={sys.id} className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col">
              <div className="p-6 flex-1">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-lg font-bold text-slate-500">
                      {sys.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">{sys.name}</h3>
                      <p className="text-xs text-slate-500">{sys.category}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    sys.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {sys.status === 'Active' ? '稼働中' : '見直し中'}
                  </span>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">月額コスト</span>
                    <span className="font-medium">
                      {sys.baseMonthlyCost > 0 
                        ? `基本 ¥${sys.baseMonthlyCost.toLocaleString()}` 
                        : `1名 ¥${sys.monthlyCostPerUser.toLocaleString()}`}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500 flex items-center"><User size={14} className="mr-1"/>管理者</span>
                    <span>{sys.adminOwner}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500 flex items-center"><Calendar size={14} className="mr-1"/>更新日</span>
                    <span>{sys.renewalDate}</span>
                  </div>
                </div>

                {sys.issues.length > 0 && (
                  <div className="mt-4 p-3 bg-red-50 rounded-lg">
                    <h4 className="text-xs font-bold text-red-700 mb-1 flex items-center">
                      <AlertCircle size={12} className="mr-1" /> 課題・備考
                    </h4>
                    <ul className="text-xs text-red-600 list-disc list-inside">
                      {sys.issues.map((issue, idx) => (
                        <li key={idx}>{issue}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-200 rounded-b-xl flex justify-between items-center">
                <a 
                  href={sys.url} 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                >
                  ログイン <ExternalLink size={14} className="ml-1" />
                </a>
                <button className="text-sm text-slate-500 hover:text-slate-800">
                  詳細編集
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SystemCatalog;