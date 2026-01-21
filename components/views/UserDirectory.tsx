import React, { useState } from 'react';
import { Search, UserPlus, X, Pencil, Download, Mail, Copy, Check, Settings, Plus, Trash2, Server, Eye, EyeOff, KeyRound } from 'lucide-react';
import { Clinic, Employee, SystemTool, StaffRole, EmploymentType, GovernanceConfig } from '../../types';
import { useNotification } from '../../contexts/NotificationContext';
import { DEFAULT_ROLES } from '../../constants';

interface UserDirectoryProps {
  tenantId: string;
  clinics: Clinic[];
  systems: SystemTool[];
  employees: Employee[];
  governance: GovernanceConfig;
  onAddEmployee: (employee: Employee) => void;
  onUpdateEmployee: (employee: Employee) => void;
  onDeleteEmployee: (employeeId: string) => void;
  onUpdateGovernance: (config: GovernanceConfig) => void;
}

const UserDirectory: React.FC<UserDirectoryProps> = ({ tenantId, clinics, systems, employees, governance, onAddEmployee, onUpdateEmployee, onDeleteEmployee, onUpdateGovernance }) => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isRoleManagerOpen, setIsRoleManagerOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  
  const { notify } = useNotification();
  
  // Use custom roles from governance, or fallback to defaults
  const availableRoles = governance.customRoles && governance.customRoles.length > 0 
    ? governance.customRoles 
    : DEFAULT_ROLES;

  const [formData, setFormData] = useState({
    lastName: '',
    firstName: '',
    email: '',
    clinicId: clinics[0]?.id || '',
    role: availableRoles[0],
    employmentType: EmploymentType.FULL_TIME,
    joinDate: new Date().toISOString().split('T')[0],
    assignedSystems: [] as string[],
    accountType: 'Google Workspace' as 'Google Workspace' | 'Google (Free)' | 'Other',
    managedPassword: ''
  });

  // CSV Export
  const handleExportCSV = () => {
    const headers = ['姓', '名', 'メール', 'アカウント種別', '所属医院', '職種', '雇用形態', '入社日', '利用システム数'];
    const rows = employees.map(e => {
      const clinicName = clinics.find(c => c.id === e.clinicId)?.name || '';
      return [
        e.lastName,
        e.firstName,
        e.email,
        e.accountType || 'Google Workspace',
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
    notify('success', 'CSVをダウンロードしました');
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
      role: availableRoles[0],
      employmentType: EmploymentType.FULL_TIME,
      joinDate: new Date().toISOString().split('T')[0],
      assignedSystems: [],
      accountType: 'Google Workspace',
      managedPassword: ''
    });
    setShowPassword(false);
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
      assignedSystems: employee.assignedSystems,
      accountType: employee.accountType || 'Google Workspace',
      managedPassword: employee.managedPassword || ''
    });
    setShowPassword(false);
    setIsModalOpen(true);
  };

  const handleSystemToggle = (systemId: string) => {
    setFormData(prev => {
      if (prev.assignedSystems.includes(systemId)) {
        return { ...prev, assignedSystems: prev.assignedSystems.filter(id => id !== systemId) };
      } else {
        return { ...prev, assignedSystems: [...prev.assignedSystems, systemId] };
      }
    });
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

  const handleDelete = () => {
    // Removed stopPropagation as it might interfere within modal context
    if (editingEmployee && window.confirm(`${editingEmployee.lastName} ${editingEmployee.firstName} を削除しますか？\nこの操作は取り消せません。`)) {
      onDeleteEmployee(editingEmployee.id);
      setIsModalOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">アカウント管理</h1>
          <p className="text-slate-500">従業員マスタの管理</p>
        </div>
        <div className="flex space-x-2">
          {/* Invite Button */}
          <button onClick={() => setIsInviteModalOpen(true)} className="px-4 py-2 bg-indigo-50 border border-indigo-200 rounded-lg text-indigo-700 text-sm font-bold hover:bg-indigo-100 flex items-center transition-all shadow-sm">
            <Mail size={16} className="mr-2" /> スタッフ招待
          </button>

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
                const accountType = person.accountType || 'Google Workspace';
                
                return (
                  <tr key={person.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 font-bold">{person.lastName[0]}</div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-slate-900">{person.lastName} {person.firstName}</div>
                          <div className="flex items-center gap-2">
                             <div className="text-sm text-slate-500">{person.email}</div>
                             {accountType === 'Google (Free)' && (
                               <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                 Free
                               </span>
                             )}
                             {accountType === 'Google Workspace' && (
                               <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-600 border border-blue-100">
                                 WS
                               </span>
                             )}
                             {person.managedPassword && (
                               <KeyRound size={12} className="text-amber-500" title="パスワード管理中" />
                             )}
                          </div>
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
                          <div key={sysId} className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-800" title={systems.find(s => s.id === sysId)?.name}>
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

      {/* Invite Modal */}
      {isInviteModalOpen && (
        <InviteModal 
          onClose={() => setIsInviteModalOpen(false)} 
          tenantId={tenantId}
        />
      )}

      {/* Edit/Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-900">{editingEmployee ? 'スタッフ編集' : 'スタッフ登録'}</h3>
              <button onClick={() => setIsModalOpen(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
               <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">姓</label>
                   <input type="text" placeholder="山田" required value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">名</label>
                   <input type="text" placeholder="花子" required value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-blue-500" />
                </div>
               </div>
               
               <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <h4 className="text-sm font-bold text-slate-700 mb-3">Googleアカウント情報</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">メールアドレス</label>
                      <input type="email" placeholder="hanako@example.jp" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-blue-500" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div>
                         <label className="block text-sm font-medium text-slate-700 mb-1">アカウント種別</label>
                         <select 
                           value={formData.accountType} 
                           onChange={e => setFormData({...formData, accountType: e.target.value as any})}
                           className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-blue-500"
                         >
                            <option value="Google Workspace">Google Workspace (有料)</option>
                            <option value="Google (Free)">Google Free (無料)</option>
                            <option value="Other">その他</option>
                         </select>
                       </div>
                       
                       {formData.accountType === 'Google (Free)' && (
                         <div className="relative">
                           <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center">
                             管理パスワード
                             <span className="ml-2 text-[10px] text-amber-600 bg-amber-50 px-1 rounded">管理用</span>
                           </label>
                           <div className="relative">
                             <input 
                               type={showPassword ? "text" : "password"} 
                               value={formData.managedPassword} 
                               onChange={e => setFormData({...formData, managedPassword: e.target.value})} 
                               placeholder="パスワードを入力"
                               className="w-full pl-3 pr-10 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-blue-500" 
                             />
                             <button 
                               type="button" 
                               onClick={() => setShowPassword(!showPassword)}
                               className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                             >
                               {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                             </button>
                           </div>
                         </div>
                       )}
                    </div>
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">所属医院</label>
                    <select value={formData.clinicId} onChange={e => setFormData({...formData, clinicId: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer focus:ring-2 focus:ring-blue-500">
                      {clinics.map(c => <option key={c.id} value={c.id} className="text-slate-900 bg-white">{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-sm font-medium text-slate-700">職種</label>
                      <button type="button" onClick={() => setIsRoleManagerOpen(true)} className="text-xs text-blue-600 hover:text-blue-800 flex items-center">
                        <Settings size={12} className="mr-1" /> 編集
                      </button>
                    </div>
                    <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer focus:ring-2 focus:ring-blue-500">
                      {availableRoles.map(role => <option key={role} value={role} className="text-slate-900 bg-white">{role}</option>)}
                    </select>
                  </div>
               </div>
               
               {/* Assigned Systems Section */}
               <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center">
                    <Server size={14} className="mr-2 text-slate-500" />
                    利用ツールの割り当て
                  </h4>
                  {systems.length === 0 ? (
                    <p className="text-xs text-slate-400">登録されているシステムがありません</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                       {systems.map(sys => (
                         <label key={sys.id} className="flex items-center space-x-2 p-2 rounded hover:bg-white border border-transparent hover:border-slate-200 transition-all cursor-pointer">
                           <input 
                             type="checkbox" 
                             className="rounded text-blue-600 focus:ring-blue-500"
                             checked={formData.assignedSystems.includes(sys.id)}
                             onChange={() => handleSystemToggle(sys.id)}
                           />
                           <span className="text-sm text-slate-700 truncate">{sys.name}</span>
                         </label>
                       ))}
                    </div>
                  )}
               </div>

               <div className="pt-4 flex justify-between space-x-3">
                 {editingEmployee ? (
                   <button 
                     type="button" 
                     onClick={handleDelete} 
                     className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium flex items-center"
                   >
                     <Trash2 size={16} className="mr-1.5 pointer-events-none" /> 削除
                   </button>
                 ) : <div></div>}
                 <div className="flex space-x-3">
                   <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-500 hover:bg-slate-50 rounded-lg">キャンセル</button>
                   <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700">保存</button>
                 </div>
               </div>
            </form>
          </div>
        </div>
      )}

      {/* Role Manager Modal */}
      {isRoleManagerOpen && (
        <RoleManagerModal 
           roles={availableRoles} 
           onClose={() => setIsRoleManagerOpen(false)}
           onSave={(newRoles) => onUpdateGovernance({ ...governance, customRoles: newRoles })}
        />
      )}
    </div>
  );
};

// Mini Modal for Role Management
const RoleManagerModal: React.FC<{ roles: string[], onClose: () => void, onSave: (roles: string[]) => void }> = ({ roles, onClose, onSave }) => {
  const [currentRoles, setCurrentRoles] = useState(roles);
  const [newRole, setNewRole] = useState('');

  const handleAdd = () => {
    if (newRole && !currentRoles.includes(newRole)) {
      setCurrentRoles([...currentRoles, newRole]);
      setNewRole('');
    }
  };

  const handleDelete = (role: string) => {
    if (window.confirm(`${role} を削除しますか？`)) {
      setCurrentRoles(currentRoles.filter(r => r !== role));
    }
  };

  const handleSave = () => {
    onSave(currentRoles);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/20 p-4">
      <div className="bg-white rounded-xl max-w-sm w-full p-4 shadow-xl border border-slate-200">
         <h4 className="text-md font-bold text-slate-900 mb-3">職種リストの編集</h4>
         <div className="flex gap-2 mb-4">
           <input 
             type="text" 
             value={newRole} 
             onChange={e => setNewRole(e.target.value)} 
             placeholder="新しい職種名" 
             className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
           />
           <button onClick={handleAdd} className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700">
             <Plus size={18} />
           </button>
         </div>
         <div className="max-h-48 overflow-y-auto space-y-2 mb-4">
           {currentRoles.map(role => (
             <div key={role} className="flex justify-between items-center bg-slate-50 px-3 py-2 rounded border border-slate-100 text-sm">
               <span className="text-slate-900">{role}</span>
               <button 
                 type="button"
                 onClick={() => handleDelete(role)} 
                 className="text-slate-400 hover:text-red-500"
               >
                 <Trash2 size={14} className="pointer-events-none" />
               </button>
             </div>
           ))}
         </div>
         <div className="flex justify-end gap-2">
            <button onClick={onClose} className="px-3 py-1.5 text-slate-500 text-sm hover:bg-slate-50 rounded">キャンセル</button>
            <button onClick={handleSave} className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">保存する</button>
         </div>
      </div>
    </div>
  );
}

// Simple Invite Modal Component
const InviteModal: React.FC<{ onClose: () => void; tenantId?: string }> = ({ onClose, tenantId }) => {
  const [copied, setCopied] = useState(false);
  const inviteUrl = `${window.location.origin}?invite=${tenantId}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4 animate-in fade-in">
      <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-slate-900 flex items-center">
            <UserPlus size={20} className="mr-2 text-blue-600" />
            スタッフを招待
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
        </div>
        
        {tenantId ? (
          <>
            <p className="text-sm text-slate-600 mb-4">
              以下のリンクを共有して、スタッフを招待してください。<br/>
              このリンクから登録すると、自動的にこの組織に参加します。
            </p>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-center mb-4">
              <code className="text-xs text-slate-600 truncate flex-1 font-mono">{inviteUrl}</code>
            </div>

            <button 
              onClick={handleCopy}
              className={`w-full py-2.5 rounded-lg text-sm font-bold flex justify-center items-center transition-all ${
                copied ? 'bg-green-600 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {copied ? (
                <>
                  <Check size={16} className="mr-2" />
                  コピーしました
                </>
              ) : (
                <>
                  <Copy size={16} className="mr-2" />
                  招待リンクをコピー
                </>
              )}
            </button>
          </>
        ) : (
          <div className="text-center py-4 text-red-500">
             <p>テナントIDの取得に失敗しました。ページを再読み込みしてください。</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDirectory;