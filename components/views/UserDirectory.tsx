import React, { useState } from 'react';
import { Search, Filter, MoreHorizontal, UserPlus, X, Pencil, Download } from 'lucide-react';
import { Clinic, Employee, SystemTool, StaffRole, EmploymentType } from '../../types';

interface UserDirectoryProps {
  clinics: Clinic[];
  systems: SystemTool[];
  employees: Employee[];
  onAddEmployee: (employee: Employee) => void;
  onUpdateEmployee: (employee: Employee) => void;
}

const UserDirectory: React.FC<UserDirectoryProps> = ({ clinics, systems, employees, onAddEmployee, onUpdateEmployee }) => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

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

  const handleExportCSV = () => {
    const headers = ['姓', '名', 'メール', '所属医院', '職種', '雇用形態', '入社日', '利用システム数'];
    const rows = employees.map(e => {
      const clinicName = clinics.find(c => c.id === e.clinicId)?.name || '';
      return [
        e.lastName,
        e.firstName,
        e.email,
        clinicName,
        e.role,
        e.employmentType,
        e.joinDate,
        e.assignedSystems.length
      ].join(',');
    });

    const csvContent = "\uFEFF" + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `staff_directory_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredEmployees = employees.filter(e => 
    e.lastName.includes(searchTerm) || 
    e.firstName.includes(searchTerm) ||
    e.email.includes(searchTerm)
  );

  const openAddModal = () => {
    setEditingEmployee(null);
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
    setIsModalOpen(true);
  };

  const openEditModal = (employee: Employee) => {
    setEditingEmployee(employee);
    setFormData({
      lastName: employee.lastName,
      firstName: employee.firstName,
      email: employee.email,
      clinicId: employee.clinicId,
      role: employee.role,
      employmentType: employee.employmentType,
      joinDate: employee.joinDate,
      assignedSystems: employee.assignedSystems
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingEmployee) {
      onUpdateEmployee({ ...editingEmployee, ...formData, status: editingEmployee.status });
    } else {
      onAddEmployee({ id: `e_${Date.now()}`, ...formData, status: 'Active' });
    }
    setIsModalOpen(false);
  };

  const toggleSystemAssignment = (sysId: string) => {
    setFormData(prev => ({
      ...prev,
      assignedSystems: prev.assignedSystems.includes(sysId) 
        ? prev.assignedSystems.filter(id => id !== sysId) 
        : [...prev.assignedSystems, sysId]
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">アカウント管理</h1>
          <p className="text-slate-500">従業員マスタとCSV出力</p>
        </div>
        <div className="flex space-x-2">
          <button onClick={handleExportCSV} className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 text-sm font-medium hover:bg-slate-50 flex items-center transition-all shadow-sm">
            <Download size={16} className="mr-2 text-slate-400" /> CSV出力
          </button>
          <button onClick={openAddModal} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center shadow-lg active:scale-95 transition-transform">
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
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">氏名 / メール</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">所属</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">利用ツール</th>
                <th className="px-6 py-3 text-right"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {filteredEmployees.map((person) => {
                const clinicName = clinics.find(c => c.id === person.clinicId)?.name || '不明';
                return (
                  <tr key={person.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 font-bold">{person.lastName[0]}</div>
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
                      <div className="flex -space-x-1">
                        {person.assignedSystems.map(sysId => (
                          <div key={sysId} className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-800">
                            {systems.find(s => s.id === sysId)?.name?.[0]}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <button onClick={() => openEditModal(person)} className="text-slate-400 hover:text-slate-800"><Pencil size={16} /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-900">{editingEmployee ? 'スタッフ編集' : 'スタッフ登録'}</h3>
              <button onClick={() => setIsModalOpen(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
               <div className="grid grid-cols-2 gap-4">
                <input type="text" placeholder="姓" required value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} className="px-3 py-2 border rounded-lg" />
                <input type="text" placeholder="名" required value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} className="px-3 py-2 border rounded-lg" />
               </div>
               <input type="email" placeholder="メール" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
               <div className="grid grid-cols-2 gap-4">
                  <select value={formData.clinicId} onChange={e => setFormData({...formData, clinicId: e.target.value})} className="px-3 py-2 border rounded-lg bg-white">
                    {clinics.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as StaffRole})} className="px-3 py-2 border rounded-lg bg-white">
                    {Object.values(StaffRole).map(role => <option key={role} value={role}>{role}</option>)}
                  </select>
               </div>
               <div className="pt-4 flex justify-end space-x-3">
                 <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-500">キャンセル</button>
                 <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold">保存</button>
               </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDirectory;