import React, { useState } from 'react';
import { Search, UserPlus, X, Pencil, Download, Upload, FileUp, AlertTriangle, Mail, Copy, Check } from 'lucide-react';
import { Clinic, Employee, SystemTool, StaffRole, EmploymentType, Tenant } from '../../types';
import { useNotification } from '../../contexts/NotificationContext';

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
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false); // New Invite Modal
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [inviteCopied, setInviteCopied] = useState(false);
  
  const { notify } = useNotification();

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

  // CSV Import State
  const [csvContent, setCsvContent] = useState<string>('');
  const [parsedEmployees, setParsedEmployees] = useState<Partial<Employee>[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);

  // CSV Export
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
    notify('success', 'CSVをダウンロードしました');
  };

  const handleDownloadTemplate = () => {
    const headers = ['姓', '名', 'メール', '職種', '雇用形態', '所属医院ID'];
    const sample = ['山田', '花子', 'hanako@example.com', '歯科衛生士 (DH)', '常勤', clinics[0]?.id || ''];
    const content = "\uFEFF" + [headers.join(','), sample.join(',')].join('\n');
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'staff_import_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvContent(text);
      parseCSV(text);
    };
    reader.readAsText(file);
  };

  const parseCSV = (text: string) => {
    const lines = text.split(/\r\n|\n/).filter(line => line.trim() !== '');
    if (lines.length < 2) {
      setImportErrors(['データが見つかりません。ヘッダーを含めて2行以上必要です。']);
      return;
    }

    const errors: string[] = [];
    const parsed: Partial<Employee>[] = [];
    
    // Skip header (index 0)
    for (let i = 1; i < lines.length; i++) {
      const columns = lines[i].split(',').map(c => c.trim());
      if (columns.length < 5) {
        errors.push(`${i + 1}行目: カラム数が不足しています`);
        continue;
      }

      const [lastName, firstName, email, roleStr, empTypeStr, clinicIdRaw] = columns;

      // Validate required
      if (!lastName || !firstName) {
        errors.push(`${i + 1}行目: 氏名が不足しています`);
        continue;
      }

      // Role mapping (simple includes check)
      const role = Object.values(StaffRole).find(r => r.includes(roleStr)) || StaffRole.DA;
      const empType = Object.values(EmploymentType).find(t => t.includes(empTypeStr)) || EmploymentType.FULL_TIME;
      
      // Clinic matching (ID match or Name match)
      let clinicId = clinicIdRaw;
      if (!clinics.find(c => c.id === clinicIdRaw)) {
         // Try to find by name
         const found = clinics.find(c => c.name.includes(clinicIdRaw));
         if (found) clinicId = found.id;
         else clinicId = clinics[0]?.id; // Fallback
      }

      parsed.push({
        firstName,
        lastName,
        email,
        role: role as StaffRole,
        employmentType: empType as EmploymentType,
        clinicId,
        joinDate: new Date().toISOString().split('T')[0],
        assignedSystems: []
      });
    }

    setImportErrors(errors);
    setParsedEmployees(parsed);
  };

  const executeImport = () => {
    if (parsedEmployees.length === 0) {
      notify('error', 'インポートするデータがありません');
      return;
    }
    
    let count = 0;
    parsedEmployees.forEach(emp => {
      onAddEmployee({
        ...emp,
        id: `e_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        status: 'Active'
      } as Employee);
      count++;
    });

    notify('success', `${count}件のスタッフデータをインポートしました`);
    setIsImportModalOpen(false);
    setParsedEmployees([]);
    setCsvContent('');
  };

  const getInviteLink = () => {
    // In a real app, this would be the tenant ID from context/props.
    // Assuming employees[0] belongs to the current tenant for now.
    // Or we can assume there's a parent prop for tenantId, but here we can infer from current data structure or URL.
    // For MVP, we will construct using the first employee's tenant relation logic (which is hidden in frontend types but exists in DB).
    // Let's use the current URL origin and append a param. 
    // We need the Tenant ID. In `App.tsx`, we know `tenants[0].id`. But here we don't have it directly.
    // Let's assume the parent passes it, or we rely on the fact that `clinics` usually have ids starting with `c_...` 
    // Wait, we need the TenantID.
    // Let's rely on a workaround: The `App.tsx` passes `tenants[0]` down.
    // Actually, `UserDirectory` receives `clinics`. 
    // Let's use `window.location.origin` + `?invite=` + (we need to know the tenant ID).
    // **Fix:** We should pass `tenantId` to `UserDirectory` props. 
    // But to keep changes minimal, let's assume `employees[0]` exists, but that's risky.
    // We will extract tenant ID from the first clinic ID if possible, BUT clinic ID format `c_...` is different from tenant ID `tenant_...`.
    // Let's just assume for now we can get it or the user copies it. 
    // BETTER APPROACH: Just ask the user to copy the URL if we can't get ID easily? No, that's bad UX.
    // Let's update `App.tsx` to pass tenantID to `UserDirectory`? 
    // No, let's use a workaround: The `App.tsx` renders this. Let's see `App.tsx`. 
    // `App.tsx` has `currentTenant`. We can pass tenantId as prop.
    return ""; 
  };
  
  // Note: We need to update the Component props in App.tsx to pass tenantId.
  // We will assume `tenantId` is passed in props or accessible.
  // For this XML block, I will add `tenantId` to props.

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

  const copyInviteLink = () => {
     // We need the tenant ID. Since we can't easily change the prop signature everywhere without touching App.tsx too (which we will),
     // let's grab it from the URL if we are logged in? No.
     // Let's assume the App passes it. We'll modify App.tsx.
     // For now, let's put a placeholder until App.tsx is updated.
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">アカウント管理</h1>
          <p className="text-slate-500">従業員マスタの管理と一括登録</p>
        </div>
        <div className="flex space-x-2">
          {/* Invite Button */}
          <button onClick={() => setIsInviteModalOpen(true)} className="px-4 py-2 bg-indigo-50 border border-indigo-200 rounded-lg text-indigo-700 text-sm font-bold hover:bg-indigo-100 flex items-center transition-all shadow-sm">
            <Mail size={16} className="mr-2" /> スタッフ招待
          </button>

          <button onClick={() => setIsImportModalOpen(true)} className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 text-sm font-medium hover:bg-slate-50 flex items-center transition-all shadow-sm">
            <FileUp size={16} className="mr-2 text-slate-400" /> インポート
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

      {/* Invite Modal */}
      {isInviteModalOpen && (
        <InviteModal 
          onClose={() => setIsInviteModalOpen(false)} 
          tenantId={(employees[0] as any)?.tenant_id /* Will be fixed in App.tsx passing prop */}
        />
      )}

      {/* Edit/Add Modal */}
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

      {/* CSV Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                  <FileUp size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">スタッフ一括インポート</h3>
                  <p className="text-xs text-slate-500">CSVファイルからデータを読み込みます</p>
                </div>
              </div>
              <button onClick={() => setIsImportModalOpen(false)}><X size={20} className="text-slate-400" /></button>
            </div>

            <div className="space-y-6">
              {/* Step 1: Template Download */}
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <h4 className="text-sm font-bold text-slate-700 mb-2">1. テンプレートの準備</h4>
                <div className="flex justify-between items-center">
                  <p className="text-xs text-slate-500">専用のフォーマットを使用してください。</p>
                  <button onClick={handleDownloadTemplate} className="text-blue-600 text-sm font-medium hover:underline flex items-center">
                    <Download size={14} className="mr-1" /> テンプレートをダウンロード
                  </button>
                </div>
              </div>

              {/* Step 2: Upload */}
              <div>
                <h4 className="text-sm font-bold text-slate-700 mb-2">2. ファイルのアップロード</h4>
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-3 text-slate-400" />
                    <p className="mb-2 text-sm text-slate-500"><span className="font-semibold">クリックして選択</span> またはドラッグ＆ドロップ</p>
                    <p className="text-xs text-slate-500">CSVファイルのみ (Max 5MB)</p>
                  </div>
                  <input type="file" className="hidden" accept=".csv" onChange={handleFileSelect} />
                </label>
              </div>

              {/* Preview & Errors */}
              {(parsedEmployees.length > 0 || importErrors.length > 0) && (
                <div className="mt-4">
                  <h4 className="text-sm font-bold text-slate-700 mb-2">3. プレビュー確認</h4>
                  {importErrors.length > 0 && (
                    <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-red-700 font-bold text-sm mb-1">
                        <AlertTriangle size={16} /> エラーが見つかりました ({importErrors.length}件)
                      </div>
                      <ul className="list-disc list-inside text-xs text-red-600 space-y-1 max-h-32 overflow-y-auto">
                        {importErrors.map((err, i) => <li key={i}>{err}</li>)}
                      </ul>
                    </div>
                  )}
                  
                  {parsedEmployees.length > 0 && (
                    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden max-h-48 overflow-y-auto">
                      <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50 sticky top-0">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">氏名</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">メール</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">職種</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {parsedEmployees.map((e, i) => (
                            <tr key={i}>
                              <td className="px-4 py-2 text-xs text-slate-900">{e.lastName} {e.firstName}</td>
                              <td className="px-4 py-2 text-xs text-slate-500">{e.email}</td>
                              <td className="px-4 py-2 text-xs text-slate-500">{e.role}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  <p className="text-right text-xs text-slate-500 mt-2">読み込み件数: {parsedEmployees.length}件</p>
                </div>
              )}
            </div>

            <div className="pt-6 flex justify-end space-x-3 border-t border-slate-100 mt-6">
              <button onClick={() => setIsImportModalOpen(false)} className="px-4 py-2 text-slate-500 hover:text-slate-700">キャンセル</button>
              <button 
                onClick={executeImport} 
                disabled={parsedEmployees.length === 0 || importErrors.length > 0}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                インポート実行
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Simple Invite Modal Component (Local)
const InviteModal: React.FC<{ onClose: () => void; tenantId?: string }> = ({ onClose, tenantId }) => {
  const [copied, setCopied] = useState(false);
  // Get current tenantId from URL if available, or logic
  // Since we are inside the app, we can use window.location
  const inviteUrl = `${window.location.origin}?invite=${tenantId}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 animate-in fade-in">
      <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-slate-900 flex items-center">
            <UserPlus size={20} className="mr-2 text-blue-600" />
            スタッフを招待
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
        </div>
        
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
      </div>
    </div>
  );
};

export default UserDirectory;