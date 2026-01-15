import React, { useState } from 'react';
import { Building, MapPin, Phone, Armchair, Plus, X, Pencil } from 'lucide-react';
import { Clinic, Employee, ClinicType } from '../../types';

interface ClinicManagementProps {
  clinics: Clinic[];
  employees: Employee[];
  onAddClinic: (clinic: Clinic) => void;
  onUpdateClinic: (clinic: Clinic) => void;
}

const ClinicManagement: React.FC<ClinicManagementProps> = ({ clinics, employees, onAddClinic, onUpdateClinic }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClinic, setEditingClinic] = useState<Clinic | null>(null);
  
  // Form State
  const [name, setName] = useState('');
  const [type, setType] = useState<ClinicType>(ClinicType.BRANCH);
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [chairs, setChairs] = useState(0);

  const openAddModal = () => {
    setEditingClinic(null);
    setName('');
    setType(ClinicType.BRANCH);
    setAddress('');
    setPhone('');
    setChairs(0);
    setIsModalOpen(true);
  };

  const openEditModal = (clinic: Clinic) => {
    setEditingClinic(clinic);
    setName(clinic.name);
    setType(clinic.type);
    setAddress(clinic.address);
    setPhone(clinic.phone);
    setChairs(clinic.chairs);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingClinic) {
      // Update existing
      onUpdateClinic({
        ...editingClinic,
        name,
        type,
        address,
        phone,
        chairs
      });
    } else {
      // Create new
      const newClinic: Clinic = {
        id: `c_${Date.now()}`,
        name,
        type,
        address,
        phone,
        chairs
      };
      onAddClinic(newClinic);
    }
    
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">医院・組織管理</h1>
          <p className="text-slate-500">法人内の全クリニックと組織構造の管理</p>
        </div>
        <button 
          onClick={openAddModal}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center"
        >
          <Plus size={16} className="mr-1" />
          医院を追加
        </button>
      </div>

      {clinics.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200 border-dashed">
          <Building className="mx-auto h-12 w-12 text-slate-300" />
          <h3 className="mt-2 text-sm font-medium text-slate-900">医院が登録されていません</h3>
          <p className="mt-1 text-sm text-slate-500">まずは本院の情報を登録しましょう。</p>
          <button 
            onClick={openAddModal}
            className="mt-4 text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            + 最初の医院を登録
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {clinics.map((clinic) => {
            const staffCount = employees.filter(e => e.clinicId === clinic.id).length;
            
            return (
              <div key={clinic.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden group">
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                        <Building size={32} />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-slate-900">{clinic.name}</h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${
                          clinic.type === '本院' ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-800'
                        }`}>
                          {clinic.type}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-slate-900">{staffCount}</div>
                      <div className="text-xs text-slate-500 uppercase tracking-wide">在籍スタッフ</div>
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center text-slate-600">
                      <MapPin size={18} className="mr-2 text-slate-400" />
                      <span className="text-sm">{clinic.address}</span>
                    </div>
                    <div className="flex items-center text-slate-600">
                      <Phone size={18} className="mr-2 text-slate-400" />
                      <span className="text-sm">{clinic.phone}</span>
                    </div>
                    <div className="flex items-center text-slate-600">
                      <Armchair size={18} className="mr-2 text-slate-400" />
                      <span className="text-sm">ユニット数: {clinic.chairs}台</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-slate-50 px-6 py-4 border-t border-slate-200">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-slate-600">
                      <strong>組織責任者:</strong> 未設定
                    </div>
                    <button 
                      onClick={() => openEditModal(clinic)}
                      className="text-sm text-blue-600 font-medium hover:text-blue-800 flex items-center"
                    >
                      <Pencil size={14} className="mr-1" />
                      詳細・編集
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Clinic Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-900">
                {editingClinic ? '医院情報を編集' : '新規医院登録'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">医院名 <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="例: ホワイトデンタル 新宿分院"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">区分</label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input 
                      type="radio" 
                      name="clinicType" 
                      value={ClinicType.BRANCH}
                      checked={type === ClinicType.BRANCH}
                      onChange={() => setType(ClinicType.BRANCH)}
                      className="mr-2"
                    />
                    <span className="text-sm text-slate-700">分院</span>
                  </label>
                  <label className="flex items-center">
                    <input 
                      type="radio" 
                      name="clinicType" 
                      value={ClinicType.HQ}
                      checked={type === ClinicType.HQ}
                      onChange={() => setType(ClinicType.HQ)}
                      className="mr-2"
                    />
                    <span className="text-sm text-slate-700">本院</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">住所</label>
                <input 
                  type="text" 
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="東京都新宿区..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">電話番号</label>
                  <input 
                    type="tel" 
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="03-xxxx-xxxx"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">ユニット数</label>
                  <input 
                    type="number" 
                    min="0"
                    value={chairs}
                    onChange={e => setChairs(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
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
                  {editingClinic ? '更新する' : '登録する'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClinicManagement;