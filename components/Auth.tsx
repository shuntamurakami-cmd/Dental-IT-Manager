import React, { useState } from 'react';
import { Database, Check, AlertCircle, Loader2 } from 'lucide-react';

interface AuthProps {
  onLogin: (email: string, pass: string) => Promise<boolean>;
  onSignup: (company: string, email: string, pass: string) => Promise<boolean>;
}

const Auth: React.FC<AuthProps> = ({ onLogin, onSignup }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isLogin) {
        const success = await onLogin(email, password);
        if (!success) setError('ログインに失敗しました。メールアドレスとパスワードを確認してください。');
      } else {
        if (!companyName) {
           setError('法人名は必須です');
           setIsLoading(false);
           return;
        }
        const success = await onSignup(companyName, email, password);
        if (!success) setError('アカウント作成に失敗しました。パスワードは6文字以上必要です。');
      }
    } catch (err: any) {
      setError(err.message || '予期せぬエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemoCreds = () => {
    setEmail('demo@whitedental.jp');
    setPassword('demo1234'); // Updated to meet standard complexity
    setIsLogin(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center items-center gap-2">
           <div className="p-2 bg-blue-600 rounded-lg shadow-blue-200 shadow-lg">
             <Database className="text-white h-8 w-8" />
           </div>
           <h2 className="text-center text-3xl font-extrabold text-slate-900 tracking-tight">
             Dental IT Manager
           </h2>
        </div>
        <h2 className="mt-8 text-center text-2xl font-bold text-slate-900">
          {isLogin ? 'アカウントにログイン' : '新規アカウント作成'}
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          {isLogin ? (
            <>
              または{' '}
              <button onClick={() => setIsLogin(false)} className="font-medium text-blue-600 hover:text-blue-500 transition-colors">
                無料でアカウント作成
              </button>
            </>
          ) : (
            <>
              すでにアカウントをお持ちですか？{' '}
              <button onClick={() => setIsLogin(true)} className="font-medium text-blue-600 hover:text-blue-500 transition-colors">
                ログイン
              </button>
            </>
          )}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-4 shadow-xl shadow-slate-200/50 sm:rounded-2xl sm:px-10 border border-slate-200">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {!isLogin && (
              <div>
                <label htmlFor="company" className="block text-sm font-medium text-slate-700">
                  法人・医院名
                </label>
                <div className="mt-1">
                  <input
                    id="company"
                    type="text"
                    required={!isLogin}
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="appearance-none block w-full px-3 py-2.5 border border-slate-300 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all sm:text-sm"
                    placeholder="例: 医療法人社団〇〇会"
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                メールアドレス
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2.5 border border-slate-300 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all sm:text-sm"
                  placeholder="admin@example.jp"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                パスワード
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2.5 border border-slate-300 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all sm:text-sm"
                />
              </div>
            </div>

            {error && (
              <div className="text-red-600 text-sm bg-red-50 p-4 rounded-xl border border-red-100 flex items-start animate-in fade-in slide-in-from-top-1">
                <AlertCircle size={18} className="mr-2 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={18} className="animate-spin mr-2" />
                    処理中...
                  </>
                ) : (isLogin ? 'ログイン' : 'アカウント作成')}
              </button>
            </div>
          </form>

          {isLogin && (
            <div className="mt-8">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-3 bg-white text-slate-400 font-medium">
                    デモ利用はこちら
                  </span>
                </div>
              </div>

              <div className="mt-6">
                <button
                  onClick={fillDemoCreds}
                  className="w-full inline-flex justify-center items-center px-4 py-3 border border-slate-200 shadow-sm text-sm font-bold rounded-xl text-slate-700 bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                  <Check size={18} className="mr-2 text-emerald-500 font-bold" />
                  デモ環境を試す (White Dental)
                </button>
              </div>
            </div>
          )}
        </div>
        
        <p className="mt-8 text-center text-xs text-slate-400">
          &copy; {new Date().getFullYear()} Dental IT Manager. All rights reserved.<br/>
          Securely powered by Supabase Auth.
        </p>
      </div>
    </div>
  );
};

export default Auth;