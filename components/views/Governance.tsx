import React, { useState } from 'react';
import { Book, Shield, Key, Pencil, Save, X, Plus, Trash2 } from 'lucide-react';
import { GovernanceConfig, NamingRule, SecurityPolicy } from '../../types';

interface GovernanceProps {
  governance: GovernanceConfig;
  onUpdate: (newGovernance: GovernanceConfig) => void;
}

const Governance: React.FC<GovernanceProps> = ({ governance, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  // Local state for editing form
  const [editData, setEditData] = useState<GovernanceConfig>(governance);

  const handleSave = () => {
    onUpdate(editData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData(governance);
    setIsEditing(false);
  };

  // Naming Rule Helpers
  const addNamingRule = () => {
    setEditData(prev => ({
      ...prev,
      naming: [...prev.naming, { rule: '新しいルール', pattern: '', example: '' }]
    }));
  };

  const removeNamingRule = (index: number) => {
    setEditData(prev => ({
      ...prev,
      naming: prev.naming.filter((_, i) => i !== index)
    }));
  };

  const updateNamingRule = (index: number, field: keyof NamingRule, value: string) => {
    const newRules = [...editData.naming];
    newRules[index] = { ...newRules[index], [field]: value };
    setEditData(prev => ({ ...prev, naming: newRules }));
  };

  // Security Policy Helpers
  const addSecurityPolicy = () => {
    setEditData(prev => ({
      ...prev,
      security: [...prev.security, { title: '新しいポリシー', content: '' }]
    }));
  };

  const removeSecurityPolicy = (index: number) => {
    setEditData(prev => ({
      ...prev,
      security: prev.security.filter((_, i) => i !== index)
    }));
  };

  const updateSecurityPolicy = (index: number, field: keyof SecurityPolicy, value: string) => {
    const newPolicies = [...editData.security];
    newPolicies[index] = { ...newPolicies[index], [field]: value };
    setEditData(prev => ({ ...prev, security: newPolicies }));
  };

  return (
    <div className="space-y-8">
       <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">運用ルール・規定</h1>
          <p className="text-slate-500">医院全体のITガバナンスとナレッジベース</p>
        </div>
        <div>
          {isEditing ? (
            <div className="flex space-x-2">
              <button 
                onClick={handleCancel}
                className="px-4 py-2 text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 flex items-center font-medium"
              >
                <X size={16} className="mr-2" />
                キャンセル
              </button>
              <button 
                onClick={handleSave}
                className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center font-medium shadow-sm"
              >
                <Save size={16} className="mr-2" />
                変更を保存
              </button>
            </div>
          ) : (
            <button 
              onClick={() => {
                setEditData(governance);
                setIsEditing(true);
              }}
              className="px-4 py-2 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 flex items-center font-medium shadow-sm"
            >
              <Pencil size={16} className="mr-2" />
              ルールを編集
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Naming Conventions */}
        <section className={`bg-white rounded-xl shadow-sm border ${isEditing ? 'border-blue-300 ring-2 ring-blue-50' : 'border-slate-200'} overflow-hidden transition-all`}>
          <div className="p-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center">
              <Key className="text-blue-500 mr-3" />
              <h2 className="text-lg font-bold text-slate-900">ネーミングルール定義</h2>
            </div>
            {isEditing && (
              <button onClick={addNamingRule} className="text-xs flex items-center text-blue-600 hover:text-blue-800 font-medium">
                <Plus size={14} className="mr-1" /> 追加
              </button>
            )}
          </div>
          <div className="p-6">
            <p className="text-sm text-slate-600 mb-6">
              アカウント発行や端末購入時は、以下の命名規則を遵守してください。
            </p>
            <div className="space-y-6">
              {isEditing ? (
                // Edit Mode
                editData.naming.map((rule, idx) => (
                  <div key={idx} className="bg-slate-50 p-4 rounded-lg border border-slate-200 relative group">
                    <button 
                      onClick={() => removeNamingRule(idx)}
                      className="absolute top-2 right-2 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={16} />
                    </button>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">対象</label>
                        <input 
                          type="text" 
                          value={rule.rule}
                          onChange={(e) => updateNamingRule(idx, 'rule', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">命名パターン</label>
                        <input 
                          type="text" 
                          value={rule.pattern}
                          onChange={(e) => updateNamingRule(idx, 'pattern', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-slate-300 rounded font-mono bg-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">作成例</label>
                        <input 
                          type="text" 
                          value={rule.example}
                          onChange={(e) => updateNamingRule(idx, 'example', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-slate-300 rounded text-slate-600 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                // View Mode
                governance.naming.map((rule, idx) => (
                  <div key={idx} className="border-l-4 border-blue-500 pl-4">
                    <h3 className="font-bold text-slate-900">{rule.rule}</h3>
                    <code className="block mt-2 p-2 bg-slate-100 rounded text-sm font-mono text-slate-700">
                      {rule.pattern}
                    </code>
                    <p className="text-xs text-slate-500 mt-1">例: {rule.example}</p>
                  </div>
                ))
              )}
              {isEditing && editData.naming.length === 0 && (
                <div className="text-center text-sm text-slate-400 py-4">ルールがありません</div>
              )}
            </div>
          </div>
        </section>

        {/* Security Policies */}
        <section className={`bg-white rounded-xl shadow-sm border ${isEditing ? 'border-emerald-300 ring-2 ring-emerald-50' : 'border-slate-200'} overflow-hidden transition-all`}>
           <div className="p-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center">
              <Shield className="text-emerald-500 mr-3" />
              <h2 className="text-lg font-bold text-slate-900">セキュリティポリシー</h2>
            </div>
            {isEditing && (
              <button onClick={addSecurityPolicy} className="text-xs flex items-center text-emerald-600 hover:text-emerald-800 font-medium">
                <Plus size={14} className="mr-1" /> 追加
              </button>
            )}
          </div>
          <div className="p-6">
             <div className="space-y-6">
              {isEditing ? (
                // Edit Mode
                editData.security.map((policy, idx) => (
                  <div key={idx} className="bg-slate-50 p-4 rounded-lg border border-slate-200 relative group">
                     <button 
                      onClick={() => removeSecurityPolicy(idx)}
                      className="absolute top-2 right-2 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={16} />
                    </button>
                    <div className="space-y-3">
                      <input 
                          type="text" 
                          value={policy.title}
                          onChange={(e) => updateSecurityPolicy(idx, 'title', e.target.value)}
                          className="w-full px-2 py-1 text-sm font-bold border border-slate-300 rounded focus:outline-none focus:border-emerald-500"
                          placeholder="ポリシータイトル"
                        />
                      <textarea 
                          value={policy.content}
                          onChange={(e) => updateSecurityPolicy(idx, 'content', e.target.value)}
                          rows={3}
                          className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:border-emerald-500"
                          placeholder="ポリシー内容"
                        />
                    </div>
                  </div>
                ))
              ) : (
                // View Mode
                governance.security.map((policy, idx) => (
                  <div key={idx}>
                    <h3 className="font-bold text-slate-900 flex items-center">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></span>
                      {policy.title}
                    </h3>
                    <p className="mt-2 text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                      {policy.content}
                    </p>
                  </div>
                ))
              )}
               {isEditing && editData.security.length === 0 && (
                <div className="text-center text-sm text-slate-400 py-4">ポリシーがありません</div>
              )}
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