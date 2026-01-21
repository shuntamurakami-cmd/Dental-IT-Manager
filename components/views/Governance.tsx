import React, { useState } from 'react';
import { Book, Shield, Key, Pencil, Save, X, Plus, Trash2, Link as LinkIcon, ExternalLink } from 'lucide-react';
import { GovernanceConfig, NamingRule, SecurityPolicy, ManualLink } from '../../types';

interface GovernanceProps {
  governance: GovernanceConfig;
  onUpdate: (newGovernance: GovernanceConfig) => void;
}

const Governance: React.FC<GovernanceProps> = ({ governance, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<GovernanceConfig>(governance);

  const handleSave = () => {
    onUpdate(editData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData(governance);
    setIsEditing(false);
  };

  const addManual = () => {
    const newManuals = editData.manuals || [];
    setEditData({
      ...editData,
      manuals: [...newManuals, { title: '新規マニュアル', url: '', updatedAt: new Date().toISOString().split('T')[0] }]
    });
  };

  const removeManual = (idx: number) => {
    setEditData({
      ...editData,
      manuals: editData.manuals?.filter((_, i) => i !== idx)
    });
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
              <button onClick={handleCancel} className="px-4 py-2 text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 flex items-center font-medium">
                <X size={16} className="mr-2" /> キャンセル
              </button>
              <button onClick={handleSave} className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center font-medium">
                <Save size={16} className="mr-2" /> 変更を保存
              </button>
            </div>
          ) : (
            <button onClick={() => { setEditData(governance); setIsEditing(true); }} className="px-4 py-2 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 flex items-center font-medium">
              <Pencil size={16} className="mr-2" /> 編集モード
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <section className={`bg-white rounded-xl shadow-sm border ${isEditing ? 'border-blue-300 ring-2 ring-blue-50' : 'border-slate-200'} p-6 overflow-hidden`}>
           <div className="flex items-center mb-6">
              <Key className="text-blue-500 mr-3" />
              <h2 className="text-lg font-bold text-slate-900">ネーミングルール定義</h2>
            </div>
            <div className="space-y-4">
              {editData.naming.map((rule, idx) => (
                <div key={idx} className="border-l-4 border-blue-500 pl-4">
                  <h3 className="font-bold text-slate-900 text-sm">{rule.rule}</h3>
                  <code className="block mt-1 p-2 bg-slate-100 rounded text-xs font-mono text-slate-700">{rule.pattern}</code>
                </div>
              ))}
            </div>
        </section>

        <section className={`bg-white rounded-xl shadow-sm border ${isEditing ? 'border-emerald-300 ring-2 ring-emerald-50' : 'border-slate-200'} p-6 overflow-hidden`}>
          <div className="flex items-center mb-6">
              <Shield className="text-emerald-500 mr-3" />
              <h2 className="text-lg font-bold text-slate-900">セキュリティポリシー</h2>
          </div>
          <div className="space-y-4">
            {editData.security.map((policy, idx) => (
              <div key={idx}>
                <h3 className="font-bold text-slate-900 text-sm flex items-center">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-2"></span>
                  {policy.title}
                </h3>
                <p className="mt-1 text-xs text-slate-600 leading-relaxed">{policy.content}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="md:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-6 overflow-hidden">
          <div className="flex items-center justify-between mb-6">
             <div className="flex items-center">
               <Book className="text-blue-600 mr-2" />
               <h2 className="text-lg font-bold text-slate-900">マニュアル・関連リンク</h2>
             </div>
             {isEditing && (
               <button onClick={addManual} className="text-xs flex items-center text-blue-600 font-medium">
                 <Plus size={14} className="mr-1" /> 追加
               </button>
             )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             {(editData.manuals || []).map((manual, idx) => (
               <div key={idx} className="relative group p-4 border border-slate-200 rounded-xl hover:border-blue-500 transition-all bg-slate-50/30">
                 {isEditing ? (
                   <div className="space-y-2">
                     <button onClick={() => removeManual(idx)} className="absolute top-2 right-2 text-red-400 hover:text-red-600"><Trash2 size={14}/></button>
                     <input value={manual.title} onChange={e => {
                       const next = [...(editData.manuals || [])];
                       next[idx].title = e.target.value;
                       setEditData({...editData, manuals: next});
                     }} className="w-full text-sm font-bold bg-white border rounded px-2 py-1" />
                     <input value={manual.url} onChange={e => {
                       const next = [...(editData.manuals || [])];
                       next[idx].url = e.target.value;
                       setEditData({...editData, manuals: next});
                     }} className="w-full text-xs text-blue-600 bg-white border rounded px-2 py-1" placeholder="URLを入力" />
                   </div>
                 ) : (
                   <a href={manual.url} target="_blank" rel="noreferrer" className="block">
                     <div className="flex justify-between items-start">
                       <h3 className="font-bold text-slate-800 text-sm">{manual.title}</h3>
                       <ExternalLink size={14} className="text-slate-400" />
                     </div>
                     <p className="text-[10px] text-slate-400 mt-2 font-mono">{manual.url || 'URL未設定'}</p>
                   </a>
                 )}
               </div>
             ))}
             {!isEditing && (!governance.manuals || governance.manuals.length === 0) && (
               <p className="col-span-3 text-center py-8 text-slate-400 text-sm border-2 border-dashed rounded-xl">マニュアルが登録されていません</p>
             )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Governance;