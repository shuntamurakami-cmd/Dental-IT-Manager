import React, { useState } from 'react';
import { Search, Filter, MoreHorizontal, UserPlus, X } from 'lucide-react';
import { Clinic, Employee, SystemTool, StaffRole, EmploymentType } from '../../types';

interface UserDirectoryProps {
  clinics: Clinic[];
  systems: SystemTool[];
  employees: Employee[];
  onAddEmployee: (employee: Employee) => void;
}

const UserDirectory: React.FC<UserDirectoryProps> = ({ clinics, systems, employees, onAddEmployee }) => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    lastName: '',
    firstName: '',
    email: '',
    clinicId: clinics[0]?.id || '',
    role: StaffRole.DA,
    employmentType: EmploymentType.FULL_TIME,
    joinDate: new Date().toISOString().split('T')[0],
    assignedSystems: [] as string[]
  });

  const filteredEmployees = employees.filter(e => 
    e.lastName.includes(searchTerm) || 
    e.firstName.includes(searchTerm) ||
    e.email.includes(searchTerm)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.lastName || !formData.email) return;

    const newEmployee: Employee = {
      id: `e_${Date.now()}`,
      ...formData,
      status: 'Active'
    };
    
    onAddEmployee(newEmployee);
    setIsModalOpen(false);
    // Reset Form (keep date and some defaults)
    setFormData({
      lastName: '',
      firstName: '',
      email: '',
      clinicId: clinics[0]?.id || '',
      role: StaffRole.DA,
      employmentType: EmploymentType.FULL_TIME,
      joinDate: new Date().toISOString().split('T')[0],
      assignedSystems: []
    });
  };

  const toggleSystemAssignment = (sysId: string) => {
    setFormData(prev => {
      if (prev.assignedSystems.includes(sysId)) {
        return { ...prev, assignedSystems: prev.assignedSystems.filter(id => id !== sysId) };
      } else {
        return { ...prev, assignedSystems: [...prev.assignedSystems, sysId] };
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">アカウント管理</h1>
          <p className="text-slate-500">従業員マスタとSaaSライセンス付与状況</p>
        </div>
        <div className="flex space-x-2">
          <button className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 text-sm font-medium hover:bg-slate-50 flex items-center">
            <Filter size={16} className="mr-2" /> フィルター
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center"
          >
            <UserPlus size={16} className="mr-2" /> スタッフ登録
          </button>
        </div>
      </div>

      <div className="bg-white shadow-sm border border-slate-200 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="氏名、メールアドレスで検索..." 
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">氏名 / メール</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">所属・役職</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">雇用形態</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">利用ツール</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">入社日</th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {filteredEmployees.length === 0 ? (
                <tr>
                   <td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-500">
                     該当するスタッフが見つかりません。
                   </td>
                </tr>
              ) : (
                filteredEmployees.map((person) => {
                  const clinicName = clinics.find(c => c.id === person.clinicId)?.name || '不明';
                  return (
                    <tr key={person.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-slate-200 rounded-full flex items-center justify-center text-slate-500 font-bold">
                            {person.lastName[0]}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-slate-900">{person.lastName} {person.firstName}</div>
                            <div className="text-sm text-slate-500">{person.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-900">{person.role}</div>
                        <div className="text-xs text-slate-500">{clinicName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-slate-100 text-slate-800">
                          {person.employmentType}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        <div className="flex -space-x-1 overflow-hidden">
                          {person.assignedSystems.map(sysId => {
                            const sys = systems.find(s => s.id === sysId);
                            return (
                              <div key={sysId} title={sys?.name} className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-800">
                                {sys?.name?.[0] || '?'}
                              </div>
                            )
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {person.joinDate}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button className="text-slate-400 hover:text-slate-600">
                          <MoreHorizontal size={20} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

       {/* Add Employee Modal */}
       {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-900">スタッフ登録</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
               <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">姓 <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    required
                    value={formData.lastName}
                    onChange={e => setFormData({...formData, lastName: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="歯科"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">名 <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    required
                    value={formData.firstName}
                    onChange={e => setFormData({...formData, firstName: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="太郎"
                  />
                </div>
               </div>

               <div>
                 <label className="block text-sm font-medium text-slate-700 mb-1">メールアドレス <span className="text-red-500">*</span></label>
                 <input 
                   type="email" 
                   required
                   value={formData.email}
                   onChange={e => setFormData({...formData, email: e.target.value})}
                   className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                   placeholder="taro@example.com"
                 />
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div>
                     <label className="block text-sm font-medium text-slate-700 mb-1">所属医院</label>
                     <select 
                       value={formData.clinicId}
                       onChange={e => setFormData({...formData, clinicId: e.target.value})}
                       className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                     >
                        {clinics.length === 0 && <option value="">医院未登録</option>}
                        {clinics.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                     </select>
                  </div>
                  <div>
                     <label className="block text-sm font-medium text-slate-700 mb-1">職種</label>
                     <select 
                       value={formData.role}
                       onChange={e => setFormData({...formData, role: e.target.value as StaffRole})}
                       className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                     >
                        {Object.values(StaffRole).map(role => (
                          <option key={role} value={role}>{role}</option>
                        ))}
                     </select>
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">雇用形態</label>
                   <select 
                       value={formData.employmentType}
                       onChange={e => setFormData({...formData, employmentType: e.target.value as EmploymentType})}
                       className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                     >
                        {Object.values(EmploymentType).map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                     </select>
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">入社日</label>
                    <input 
                      type="date"
                      value={formData.joinDate}
                      onChange={e => setFormData({...formData, joinDate: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                 </div>
               </div>

               <div>
                 <label className="block text-sm font-medium text-slate-700 mb-2">利用システム付与</label>
                 <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border border-slate-200 rounded-lg p-3">
                   {systems.map(sys => (
                     <label key={sys.id} className="flex items-center space-x-2 cursor-pointer">
                       <input 
                         type="checkbox"
                         checked={formData.assignedSystems.includes(sys.id)}
                         onChange={() => toggleSystemAssignment(sys.id)}
                         className="rounded text-blue-600 focus:ring-blue-500" 
                       />
                       <span className="text-sm text-slate-700">{sys.name}</span>
                     </label>
                   ))}
                   {systems.length === 0 && <span className="text-sm text-slate-400">登録システムがありません</span>}
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
                   登録する
                 </button>
               </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDirectory;