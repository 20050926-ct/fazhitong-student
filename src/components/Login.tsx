import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { login, UserRole } from '../lib/auth';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('student');

  const from = (location.state as { from?: { pathname?: string } } | undefined)?.from?.pathname || '/';

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();
    login(account, password, role);
    const target = role === 'lawyer' ? '/lawyer-console' : from;
    navigate(target, { replace: true });
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-white flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md bg-white border border-outline-variant rounded-3xl p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-primary mb-2">登录</h1>
        <p className="text-on-surface-variant text-sm mb-8">请输入账号和密码登录系统</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-bold mb-2 text-on-surface">登录端口</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole('student')}
                className={`rounded-xl border px-4 py-3 text-sm font-bold transition-colors ${
                  role === 'student'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-outline-variant text-on-surface-variant hover:border-primary'
                }`}
              >
                学生端
              </button>
              <button
                type="button"
                onClick={() => setRole('lawyer')}
                className={`rounded-xl border px-4 py-3 text-sm font-bold transition-colors ${
                  role === 'lawyer'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-outline-variant text-on-surface-variant hover:border-primary'
                }`}
              >
                律师端
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold mb-2 text-on-surface">账号</label>
            <input
              value={account}
              onChange={(e) => setAccount(e.target.value)}
              placeholder="请输入账号"
              className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-2 text-on-surface">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
              className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            />
          </div>

          <button
            type="submit"
            className="w-full primary-gradient py-3 rounded-xl font-bold text-white hover:scale-[1.01] transition-transform shadow-lg shadow-primary/20"
          >
            登录进入
          </button>
          <p className="text-xs text-on-surface-variant text-center">
            登录密码十次错误将锁定系统
          </p>
        </form>
      </div>
    </div>
  );
}
