import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getAuthUser, logout } from '../lib/auth';

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const authUser = getAuthUser();
  const isLawyer = authUser?.role === 'lawyer';

  const navLinks = [
    { path: '/', label: '首页' },
    { path: '/interactive-column', label: '互动普法' },
    { path: '/ai-services', label: '智能咨询' },
    { path: '/legal-exam', label: '法考服务' },
    { path: '/lawyer-services', label: '找律师' },
    { path: '/campus', label: '工具与校园' },
    { path: '/community', label: '社区' },
  ];

  return (
    <header className="bg-primary shadow-md fixed top-0 w-full z-50">
      <div className="flex justify-between items-center w-full px-12 py-4 max-w-[1920px] mx-auto">
        <Link to="/" className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
          律境智联 <span className="text-sm font-normal text-white/80 ml-2">| 校园法律服务</span>
        </Link>
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`font-headline font-bold text-sm tracking-wide transition-colors duration-300 ${
                  isActive
                    ? 'text-white border-b-2 border-white pb-1'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-4">
          {authUser ? (
            <>
              <Link to="/settings" className="text-white/70 hover:text-white flex items-center">
                <span className="material-symbols-outlined">settings</span>
              </Link>
              <Link to="/profile" className="block">
                <img
                  alt="User Avatar"
                  className="w-10 h-10 rounded-full border-2 border-white/30 object-cover hover:border-white transition-colors"
                  src={isLawyer ? '/lawyer/chenjianguo.jpg' : '/yonghu.jpg'}
                  onError={(event) => {
                    event.currentTarget.src = '/touxiang1.jpg';
                  }}
                />
              </Link>
              <button
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                className="text-white/80 hover:text-white text-sm font-bold"
              >
                退出
              </button>
            </>
          ) : (
            <Link to="/login" className="text-white font-bold text-sm hover:text-white/80 transition-colors">
              登录
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
