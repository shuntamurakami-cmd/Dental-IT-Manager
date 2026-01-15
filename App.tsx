import React, { useState } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/views/Dashboard';
import ClinicManagement from './components/views/ClinicManagement';
import SystemCatalog from './components/views/SystemCatalog';
import UserDirectory from './components/views/UserDirectory';
import CostAnalysis from './components/views/CostAnalysis';
import Governance from './components/views/Governance';
import { Upload } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showImportModal, setShowImportModal] = useState(false);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'clinics':
        return <ClinicManagement />;
      case 'systems':
        return <SystemCatalog />;
      case 'users':
        return <UserDirectory />;
      case 'costs':
        return <CostAnalysis />;
      case 'governance':
        return <Governance />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab}>
      <div className="mb-4 flex justify-end">
         <button 
           onClick={() => setShowImportModal(true)}
           className="flex items-center text-xs text-slate-500 hover:text-blue-600 transition-colors"
         >
           <Upload size={14} className="mr-1" />
           既存データ(CSV)をインポート
         </button>
      </div>

      {renderContent()}

      {/* Import Modal Simulation */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 mb-2">データインポート</h3>
            <p className="text-sm text-slate-600 mb-6">
              現在管理しているスプレッドシートやCSVファイルをアップロードして、
              初期データを構築します。
            </p>
            
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer">
              <Upload className="mx-auto h-10 w-10 text-slate-400" />
              <p className="mt-2 text-sm text-slate-500">クリックしてファイルを選択</p>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button 
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium"
              >
                キャンセル
              </button>
              <button 
                onClick={() => {
                  alert('デモ環境のため、実際のインポートはスキップされました。');
                  setShowImportModal(false);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                インポート実行
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default App;