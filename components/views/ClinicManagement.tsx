import React from 'react';
import { Building, MapPin, Phone, Armchair } from 'lucide-react';
import { CLINICS, EMPLOYEES } from '../../constants';

const ClinicManagement: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">医院・組織管理</h1>
          <p className="text-slate-500">法人内の全クリニックと組織構造の管理</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
          + 医院を追加
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {CLINICS.map((clinic) => {
          const staffCount = EMPLOYEES.filter(e => e.clinicId === clinic.id).length;
          
          return (
            <div key={clinic.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
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
                  <button className="text-sm text-blue-600 font-medium hover:text-blue-800">
                    詳細・編集
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ClinicManagement;