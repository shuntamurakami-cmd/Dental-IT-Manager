import React, { useState } from 'react';
import { Check, Rocket, Server, ShieldCheck } from 'lucide-react';
import { SYSTEM_PRESETS } from '../constants';
import { SystemTool } from '../types';
import { db } from '../services/db';
import { useNotification } from '../contexts/NotificationContext';

interface OnboardingWizardProps {
  tenantId: string;
  onComplete: () => void;
}

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ tenantId, onComplete }) => {
  const [selectedSystems, setSelectedSystems] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { notify } = useNotification();

  const toggleSystem = (name: string) => {
    setSelectedSystems(prev => 
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    );
  };

  const handleFinish = async () => {
    setIsSubmitting(true);
    try {
      // Create selected systems
      for (const presetName of selectedSystems) {
        const preset = SYSTEM_PRESETS.find(p => p.name === presetName);
        if (preset) {
          const newSystem: SystemTool = {
            id: `s_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            name: preset.name,
            category: preset.category,
            url: preset.url,
            monthlyCostPerUser: preset.monthlyCostPerUser,
            baseMonthlyCost: preset.baseMonthlyCost,
            renewalDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
            adminOwner: '管理者',
            vendorContact: '',
            status: 'Active',
            issues: []
          };
          await db.upsertSystem(tenantId, newSystem);
        }
      }
      
      notify('success', '初期セットアップが完了しました！');
      onComplete();
    } catch (err) {
      console.error(err);
      notify('error', 'セットアップ中にエラーが発生しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/90 p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white text-center">
          <div className="bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
            <Rocket size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Dental IT Managerへようこそ</h1>
          <p className="text-blue-100">はじめに、現在ご利用中のシステムを選択してください。<br/>選択したシステムは自動的に台帳に登録され、すぐに管理を始められます。</p>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto flex-1 bg-slate-50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {SYSTEM_PRESETS.map((sys) => {
              const isSelected = selectedSystems.includes(sys.name);
              return (
                <div 
                  key={sys.name}
                  onClick={() => toggleSystem(sys.name)}
                  className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    isSelected 
                      ? 'border-blue-500 bg-blue-50 shadow-md' 
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className={`font-bold ${isSelected ? 'text-blue-800' : 'text-slate-900'}`}>{sys.name}</h3>
                      <p className="text-xs text-slate-500 mt-1">{sys.category}</p>
                    </div>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${
                      isSelected ? 'bg-blue-500 border-blue-500 text-white' : 'border-slate-300 bg-slate-100'
                    }`}>
                      {isSelected && <Check size={14} />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-white border-t border-slate-200 flex justify-between items-center">
          <div className="text-sm text-slate-500">
            {selectedSystems.length}個のシステムを選択中
          </div>
          <button 
            onClick={handleFinish}
            disabled={isSubmitting}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:shadow-xl transition-all disabled:opacity-50 flex items-center"
          >
            {isSubmitting ? '設定中...' : '利用を開始する'}
          </button>
        </div>
      </div>
    </div>
  );
};