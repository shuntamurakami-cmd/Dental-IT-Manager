import React from 'react';
import { GOVERNANCE_RULES } from '../../constants';
import { Book, Shield, Key } from 'lucide-react';

const Governance: React.FC = () => {
  return (
    <div className="space-y-8">
       <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">運用ルール・規定</h1>
        <p className="text-slate-500">医院全体のITガバナンスとナレッジベース</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Naming Conventions */}
        <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 bg-slate-50 border-b border-slate-200 flex items-center">
            <Key className="text-blue-500 mr-3" />
            <h2 className="text-lg font-bold text-slate-900">ネーミングルール定義</h2>
          </div>
          <div className="p-6">
            <p className="text-sm text-slate-600 mb-6">
              アカウント発行や端末購入時は、以下の命名規則を遵守してください。
            </p>
            <div className="space-y-6">
              {GOVERNANCE_RULES.naming.map((rule, idx) => (
                <div key={idx} className="border-l-4 border-blue-500 pl-4">
                  <h3 className="font-bold text-slate-900">{rule.rule}</h3>
                  <code className="block mt-2 p-2 bg-slate-100 rounded text-sm font-mono text-slate-700">
                    {rule.pattern}
                  </code>
                  <p className="text-xs text-slate-500 mt-1">例: {rule.example}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Security Policies */}
        <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
           <div className="p-6 bg-slate-50 border-b border-slate-200 flex items-center">
            <Shield className="text-emerald-500 mr-3" />
            <h2 className="text-lg font-bold text-slate-900">セキュリティポリシー</h2>
          </div>
          <div className="p-6">
             <div className="space-y-6">
              {GOVERNANCE_RULES.security.map((policy, idx) => (
                <div key={idx}>
                  <h3 className="font-bold text-slate-900 flex items-center">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></span>
                    {policy.title}
                  </h3>
                  <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                    {policy.content}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-8 p-4 bg-yellow-50 rounded-lg border border-yellow-100">
               <h4 className="text-sm font-bold text-yellow-800 mb-1">緊急時の連絡先</h4>
               <p className="text-xs text-yellow-700">
                 セキュリティインシデント発生時は、直ちに情シス担当（内線: 999）へ連絡してください。
               </p>
            </div>
          </div>
        </section>

        {/* Manuals / Links (Placeholder) */}
        <section className="md:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center mb-4">
             <Book className="text-slate-500 mr-2" />
             <h2 className="text-lg font-bold text-slate-900">マニュアル・関連リンク</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <a href="#" className="block p-4 border border-slate-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all group">
               <h3 className="font-bold text-slate-800 group-hover:text-blue-600">入社時セットアップ手順</h3>
               <p className="text-xs text-slate-500 mt-1">最終更新: 2024/05/01</p>
             </a>
             <a href="#" className="block p-4 border border-slate-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all group">
               <h3 className="font-bold text-slate-800 group-hover:text-blue-600">退職時アカウント削除フロー</h3>
               <p className="text-xs text-slate-500 mt-1">最終更新: 2023/12/15</p>
             </a>
             <a href="#" className="block p-4 border border-slate-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all group">
               <h3 className="font-bold text-slate-800 group-hover:text-blue-600">ファイルサーバー接続方法</h3>
               <p className="text-xs text-slate-500 mt-1">Windows / Mac対応</p>
             </a>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Governance;