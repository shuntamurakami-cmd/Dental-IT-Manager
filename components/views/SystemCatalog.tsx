import React, { useState } from 'react';
import { ExternalLink, AlertCircle, Calendar, User, Server, Plus, X, Search } from 'lucide-react';
import { SystemTool } from '../../types';

interface SystemCatalogProps {
  systems: SystemTool[];
  onAddSystem: (system: SystemTool) => void;
}

// Preset Data Catalog
const PRESET_SYSTEMS = [
  // Dental Specific
  { name: 'Apotool & Box', category: '予約管理', baseMonthlyCost: 30000, monthlyCostPerUser: 0, url: 'https://apotool.jp' },
  { name: 'Dentis', category: 'クラウドカルテ', baseMonthlyCost: 40000, monthlyCostPerUser: 0, url: 'https://dentis-cloud.com' },
  { name: 'MICHEL', category: 'レセコン', baseMonthlyCost: 25000, monthlyCostPerUser: 0, url: 'https://www.dentalite.co.jp' },
  { name: 'Ado (Stranza)', category: '予約・患者管理', baseMonthlyCost: 35000, monthlyCostPerUser: 0, url: 'https://stranza.co.jp' },
  { name: 'BEOT', category: '精算機システム', baseMonthlyCost: 15000, monthlyCostPerUser: 0, url: '#' },
  
  // General IT
  { name: 'Google Workspace', category: 'グループウェア', baseMonthlyCost: 0, monthlyCostPerUser: 1360, url: 'https://workspace.google.com' },
  { name: 'Microsoft 365', category: 'グループウェア', baseMonthlyCost: 0, monthlyCostPerUser: 1500, url: 'https://www.microsoft.com' },
  { name: 'Slack', category: 'チャット', baseMonthlyCost: 0, monthlyCostPerUser: 960, url: 'https://slack.com' },
  { name: 'Chatwork', category: 'チャット', baseMonthlyCost: 0, monthlyCostPerUser: 800, url: 'https://chatwork.com' },
  { name: 'Zoom', category: 'Web会議', baseMonthlyCost: 0, monthlyCostPerUser: 2000, url: 'https://zoom.us' },
  { name: 'SmartHR', category: '人事労務', baseMonthlyCost: 0, monthlyCostPerUser: 600, url: 'https://smarthr.jp' },
  { name: 'Money Forward', category: '会計', baseMonthlyCost: 3980, monthlyCostPerUser: 0, url: 'https://moneyforward.com' },
  { name: 'freee', category: '会計', baseMonthlyCost: 3980, monthlyCostPerUser: 0, url: 'https://www.freee.co.jp' },
  { name: 'Talknote', category: '社内SNS', baseMonthlyCost: 0, monthlyCostPerUser: 980, url: 'https://talknote.com' },
];

const SystemCatalog: React.FC<SystemCatalogProps> = ({ systems, onAddSystem }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<typeof PRESET_SYSTEMS[0] | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<SystemTool>>({
    name: '',
    category: '',
    url: '',
    baseMonthlyCost: 0,
    monthlyCostPerUser: 0,
    renewalDate: '',
    adminOwner: '',
    status: 'Active',
    issues: []
  });

  const handleSelectPreset = (preset: typeof PRESET_SYSTEMS[0]) => {
    setSelectedPreset(preset);
    setFormData({
      ...formData,
      name: preset.name,
      category: preset.category,
      url: preset.url,
      baseMonthlyCost: preset.baseMonthlyCost,
      monthlyCostPerUser: preset.monthlyCostPerUser
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    const newSystem: SystemTool = {
      id: `s_${Date.now()}`,
      name: formData.name,
      category: formData.category || 'その他',
      url: formData.url || '',
      monthlyCostPerUser: formData.monthlyCostPerUser || 0,
      baseMonthlyCost: formData.baseMonthlyCost || 0,
      renewalDate: formData.renewalDate || new Date().toISOString().split('T')[0],
      adminOwner: formData.adminOwner || '未設定',
      vendorContact: '',
      status: (formData.status as any) || 'Active',
      issues: []
    };

    onAddSystem(newSystem);
    setIsModalOpen(false);
    // Reset
    setSelectedPreset(null);
    setFormData({ name: '', category: '', url: '', baseMonthlyCost: 0, monthlyCostPerUser: 0 });
    setSearchQuery('');
  };

  const filteredPresets = PRESET_SYSTEMS.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.includes(searchQuery)
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">システム台帳</h1>
          <p className="text-slate-500">導入済みSaaS・ソフトウェアの一元管理</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center"
        >
          <Plus size={16} className="mr-1" />
          システム登録
        </button>
      </div>

      {systems.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200 border-dashed">
          <Server className="mx-auto h-12 w-12 text-slate-300" />
          <h3 className="mt-2 text-sm font-medium text-slate-900">システムが登録されていません</h3>
          <p className="mt-1 text-sm text-slate-500">利用しているSaaSやソフトウェアを登録しましょう。</p>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="mt-4 text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            + 最初のシステムを登録
          </button>
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

      {/* Add System Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-900">システム登録</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            
            <div className="flex flex-col md:flex-row gap-6">
               {/* Left: Preset Selection */}
               <div className="w-full md:w-1/3 border-r border-slate-100 pr-0 md:pr-6">
                 <h4 className="text-sm font-bold text-slate-700 mb-2">製品カタログから選択</h4>
                 <div className="relative mb-3">
                   <Search className="absolute left-2 top-2 text-slate-400" size={14} />
                   <input 
                     type="text" 
                     placeholder="製品名を検索" 
                     className="w-full pl-8 pr-2 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                     value={searchQuery}
                     onChange={e => setSearchQuery(e.target.value)}
                   />
                 </div>
                 <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {filteredPresets.map((preset, idx) => (
                      <div 
                        key={idx}
                        onClick={() => handleSelectPreset(preset)}
                        className={`p-2 rounded-lg cursor-pointer text-sm transition-colors ${
                          selectedPreset?.name === preset.name 
                            ? 'bg-blue-50 border border-blue-200' 
                            : 'hover:bg-slate-50 border border-transparent'
                        }`}
                      >
                        <div className="font-bold text-slate-900">{preset.name}</div>
                        <div className="text-xs text-slate-500">{preset.category}</div>
                      </div>
                    ))}
                    <div 
                      onClick={() => {
                        setSelectedPreset(null);
                        setFormData({name: '', category: '', baseMonthlyCost: 0, monthlyCostPerUser: 0});
                      }}
                      className={`p-2 rounded-lg cursor-pointer text-sm border border-dashed border-slate-300 text-center text-slate-500 hover:bg-slate-50 ${!selectedPreset ? 'bg-slate-50' : ''}`}
                    >
                      カスタム入力（新規）
                    </div>
                 </div>
               </div>

               {/* Right: Input Form */}
               <form onSubmit={handleSubmit} className="w-full md:w-2/3 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">システム名 <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      required
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">カテゴリ</label>
                    <input 
                      type="text" 
                      value={formData.category}
                      onChange={e => setFormData({...formData, category: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">基本月額費用</label>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-slate-500">¥</span>
                        <input 
                          type="number" 
                          min="0"
                          value={formData.baseMonthlyCost}
                          onChange={e => setFormData({...formData, baseMonthlyCost: parseInt(e.target.value)})}
                          className="w-full pl-7 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">1名あたり月額</label>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-slate-500">¥</span>
                        <input 
                          type="number" 
                          min="0"
                          value={formData.monthlyCostPerUser}
                          onChange={e => setFormData({...formData, monthlyCostPerUser: parseInt(e.target.value)})}
                          className="w-full pl-7 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">管理責任者</label>
                    <input 
                      type="text" 
                      value={formData.adminOwner}
                      onChange={e => setFormData({...formData, adminOwner: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="例: 佐藤 太郎"
                    />
                  </div>
                  
                  <div className="pt-4 flex justify-end space-x-3">
                    <button 
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium"
                    >
                      キャンセル
                    </button>
                    <button 
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                    >
                      登録する
                    </button>
                  </div>
               </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemCatalog;