import React, { useState } from 'react';
import { Database, ArrowRight, Check } from 'lucide-react';

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
        if (!success) setError('メールアドレスまたはパスワードが正しくありません。');
      } else {
        if (!companyName) {
           setError('法人名は必須です');
           setIsLoading(false);
           return;
        }
        const success = await onSignup(companyName, email, password);
        if (!success) setError('アカウント作成に失敗しました。');
      }
    } catch (err) {
      setError('エラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemoCreds = () => {
    setEmail('demo@whitedental.jp');
    setPassword('demo');
    setIsLogin(true);
  };

  const fillAdminCreds = () => {
    setEmail('admin@saas-provider.com');
    setPassword('admin');
    setIsLogin(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center items-center gap-2">
           <Database className="text-blue-600 h-10 w-10" />
           <h2 className="text-center text-3xl font-extrabold text-slate-900">
             Dental IT Manager
           </h2>
        </div>
        <h2 className="mt-6 text-center text-2xl font-bold text-slate-900">
          {isLogin ? 'アカウントにログイン' : '新規アカウント作成'}
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          {isLogin ? (
            <>
              または{' '}
              <button onClick={() => setIsLogin(false)} className="font-medium text-blue-600 hover:text-blue-500">
                無料でアカウント作成
              </button>
            </>
          ) : (
            <>
              すでにアカウントをお持ちですか？{' '}
              <button onClick={() => setIsLogin(true)} className="font-medium text-blue-600 hover:text-blue-500">
                ログイン
              </button>
            </>
          )}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-slate-200">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {!isLogin && (
              <div>
                <label htmlFor="company" className="block text-sm font-medium text-slate-700">
                  法人・医院名
                </label>
                <div className="mt-1">
                  <input
                    id="company"
                    name="company"
                    type="text"
                    required={!isLogin}
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
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
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
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
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>

            {error && (
              <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
                {error}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isLoading ? '処理中...' : (isLogin ? 'ログイン' : 'アカウント登録')}
              </button>
            </div>
          </form>

          {isLogin && (
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-slate-500">
                    デモ環境用ショートカット
                  </span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-3">
                <button
                  onClick={fillDemoCreds}
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50"
                >
                  <Check size={16} className="mr-2 text-green-500" />
                  デモユーザーで入力
                </button>
                <button
                  onClick={fillAdminCreds}
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50"
                >
                  <Check size={16} className="mr-2 text-purple-500" />
                  運営管理者(SaaS Admin)で入力
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;