import React, { useState } from 'react';
import { ExternalLink, Calendar, User, Plus, X, Pencil, Upload, Loader2, FileCheck } from 'lucide-react';
import { SystemTool, Employee } from '../../types';
import { db } from '../../services/db';
import { useNotification } from '../../contexts/NotificationContext';
import { SYSTEM_PRESETS } from '../../constants';

interface SystemCatalogProps {
  systems: SystemTool[];
  employees?: Employee[];
  onAddSystem: (system: SystemTool) => void;
  onUpdateSystem: (system: SystemTool) => void;
}

const SystemCatalog: React.FC<SystemCatalogProps> = ({ systems, employees = [], onAddSystem, onUpdateSystem }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSystem, setEditingSystem] = useState<SystemTool | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<typeof SYSTEM_PRESETS[0] | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const { notify } = useNotification();

  const [formData, setFormData] = useState<Partial<SystemTool>>({
    name: '',
    category: '',
    url: '',
    baseMonthlyCost: 0,
    monthlyCostPerUser: 0,
    renewalDate: '',
    adminOwner: '',
    status: 'Active',
    issues: [],
    contractUrl: ''
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const publicUrl = await db.uploadSystemFile(file);
      setFormData(prev => ({ ...prev, contractUrl: publicUrl }));
      notify('success', 'ファイルをアップロードしました');
    } catch (err) {
      notify('error', 'ファイルのアップロードに失敗しました。ストレージ設定を確認してください。');
    } finally {
      setIsUploading(false);
    }
  };

  const openAddModal = () => {
    setEditingSystem(null);
    setSelectedPreset(null);
    setFormData({
      name: '',
      category: '',
      url: '',
      baseMonthlyCost: 0,
      monthlyCostPerUser: 0,
      renewalDate: new Date().toISOString().split('T')[0],
      adminOwner: '',
      status: 'Active',
      issues: [],
      contractUrl: ''
    });
    setSearchQuery('');
    setIsModalOpen(true);
  };

  const openEditModal = (system: SystemTool) => {
    setEditingSystem(system);
    setSelectedPreset(null);
    setFormData({ ...system });
    setIsModalOpen(true);
  };

  const handleSelectPreset = (preset: typeof SYSTEM_PRESETS[0]) => {
    setSelectedPreset(preset);
    setFormData(prev => ({
      ...prev,
      name: preset.name,
      category: preset.category,
      url: preset.url,
      baseMonthlyCost: preset.baseMonthlyCost,
      monthlyCostPerUser: preset.monthlyCostPerUser
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    if (editingSystem) {
      onUpdateSystem({ ...editingSystem, ...formData as SystemTool });
    } else {
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
        issues: [],
        contractUrl: formData.contractUrl
      };
      onAddSystem(newSystem);
    }
    setIsModalOpen(false);
  };

  const filteredPresets = SYSTEM_PRESETS.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.includes(searchQuery)
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">システム台帳</h1>
          <p className="text-slate-500">導入済みSaaS・契約書の一元管理</p>
        </div>
        <button onClick={openAddModal} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center">
          <Plus size={16} className="mr-1" />
          システム登録
        </button>
      </div>

      {systems.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200 border-dashed">
          <div className="p-4 bg-slate-50 inline-block rounded-full mb-4">
            <ExternalLink className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-900">システムが登録されていません</h3>
          <p className="mt-2 text-sm text-slate-500 max-w-sm mx-auto">
            現在利用しているSaaSやソフトウェアを登録して、コストや契約更新日を管理しましょう。
          </p>
          <button onClick={openAddModal} className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">
            最初のシステムを登録
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {systems.map((sys) => {
            const assignedCount = employees.filter(e => e.assignedSystems.includes(sys.id)).length;
            const currentTotal = sys.baseMonthlyCost + (sys.monthlyCostPerUser * assignedCount);

            return (
            <div key={sys.id} className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col group relative">
              {sys.contractUrl && (
                <a href={sys.contractUrl} target="_blank" rel="noreferrer" title="契約書を確認" className="absolute top-4 right-12 p-1.5 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors">
                  <FileCheck size={16} />
                </a>
              )}
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

                <div className="bg-slate-50 rounded-lg p-3 mb-4">
                   <div className="text-xs text-slate-500 mb-1">現在の月額コスト</div>
                   <div className="text-lg font-bold text-slate-900">¥{currentTotal.toLocaleString()}</div>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500 flex items-center"><User size={14} className="mr-1"/>管理者</span>
                    <span>{sys.adminOwner}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500 flex items-center"><Calendar size={14} className="mr-1"/>更新日</span>
                    <span>{sys.renewalDate}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-200 rounded-b-xl flex justify-between items-center">
                <a href={sys.url} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:text-blue-800 flex items-center">
                  ログイン <ExternalLink size={14} className="ml-1" />
                </a>
                <button onClick={() => openEditModal(sys)} className="text-sm text-slate-600 hover:text-slate-900 font-medium flex items-center bg-white border border-slate-300 px-3 py-1.5 rounded-lg">
                  <Pencil size={14} className="mr-1.5" /> 編集
                </button>
              </div>
            </div>
            );
          })}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className={`bg-white rounded-xl ${editingSystem ? 'max-w-md' : 'max-w-2xl'} w-full p-6 shadow-2xl overflow-y-auto max-h-[90vh]`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-900">{editingSystem ? 'システム情報を編集' : 'システム登録'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            
            <div className={`flex flex-col ${editingSystem ? '' : 'md:flex-row gap-6'}`}>
               {!editingSystem && (
                 <div className="w-full md:w-1/3 border-r border-slate-100 pr-0 md:pr-6">
                   <h4 className="text-sm font-bold text-slate-700 mb-2">製品カタログ</h4>
                   <div className="space-y-2 max-h-[400px] overflow-y-auto">
                      {filteredPresets.map((preset, idx) => (
                        <div key={idx} onClick={() => handleSelectPreset(preset)} className={`p-2 rounded-lg cursor-pointer text-sm border ${selectedPreset?.name === preset.name ? 'bg-blue-50 border-blue-200' : 'hover:bg-slate-50 border-transparent'}`}>
                          <div className="font-bold text-slate-900">{preset.name}</div>
                          <div className="text-xs text-slate-500">{preset.category}</div>
                        </div>
                      ))}
                   </div>
                 </div>
               )}

               <form onSubmit={handleSubmit} className={`w-full ${editingSystem ? '' : 'md:w-2/3'} space-y-4`}>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">システム名 <span className="text-red-500">*</span></label>
                    <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
                  </div>
                  
                  {/* File Upload Section */}
                  <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100">
                    <label className="block text-xs font-bold text-blue-700 mb-2 uppercase">契約書・マニュアル (PDF/画像)</label>
                    <div className="flex items-center gap-3">
                      {formData.contractUrl ? (
                         <div className="flex items-center gap-2 text-sm text-blue-800 font-medium">
                           <FileCheck size={18} className="text-blue-600" />
                           アップロード済み
                           <button type="button" onClick={() => setFormData({...formData, contractUrl: ''})} className="text-xs text-red-500 ml-2 hover:underline">削除</button>
                         </div>
                      ) : (
                        <div className="relative flex-1">
                          <input type="file" onChange={handleFileUpload} disabled={isUploading} className="hidden" id="file-upload" />
                          <label htmlFor="file-upload" className={`flex items-center justify-center gap-2 w-full px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${isUploading ? 'bg-slate-50 border-slate-200' : 'border-blue-200 hover:bg-blue-100 hover:border-blue-300'}`}>
                            {isUploading ? <Loader2 size={18} className="animate-spin text-blue-600" /> : <Upload size={18} className="text-blue-600" />}
                            <span className="text-sm font-medium text-blue-700">{isUploading ? 'アップロード中...' : 'ファイルを選択'}</span>
                          </label>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">基本料金</label>
                      <input type="number" min="0" value={formData.baseMonthlyCost} onChange={e => setFormData({...formData, baseMonthlyCost: parseInt(e.target.value)})} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">単価</label>
                      <input type="number" min="0" value={formData.monthlyCostPerUser} onChange={e => setFormData({...formData, monthlyCostPerUser: parseInt(e.target.value)})} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">管理責任者</label>
                      <input type="text" value={formData.adminOwner} onChange={e => setFormData({...formData, adminOwner: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">更新日</label>
                      <input type="date" value={formData.renewalDate} onChange={e => setFormData({...formData, renewalDate: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
                    </div>
                  </div>
                  
                  <div className="pt-4 flex justify-end space-x-3">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium">キャンセル</button>
                    <button type="submit" disabled={isUploading} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">保存する</button>
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