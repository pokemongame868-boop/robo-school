import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/courses', icon: '🎓', label: 'Курстар' },
  { to: '/profile', icon: '👤', label: 'Профиль' },
  { to: '/community', icon: '👥', label: 'Қауымдастық' },
];

export default function Layout({ children }) {
  const { profile, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#080c14] text-white flex">
      {/* Боковая панель */}
      <aside className="w-60 flex-shrink-0 border-r border-white/5 flex flex-col fixed h-full">
        {/* Лого */}
        <div className="px-6 py-5 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-sky-400 flex items-center justify-center font-black text-xs">R</div>
            <span className="font-bold text-sm tracking-tight">ROBO SCHOOL</span>
          </div>
        </div>

        {/* Навигация */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ to, icon, label }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`
              }>
              <span className="text-base">{icon}</span>
              {label}
            </NavLink>
          ))}

          {/* Только для админа */}
          {isAdmin && (
            <NavLink to="/admin"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all mt-4 ${
                  isActive
                    ? 'bg-amber-500/15 text-amber-300 border border-amber-500/20'
                    : 'text-amber-500/70 hover:text-amber-400 hover:bg-amber-500/5'
                }`
              }>
              <span className="text-base">⚙️</span>
              Басқару
            </NavLink>
          )}
        </nav>

        {/* Профиль внизу */}
        <div className="px-3 py-4 border-t border-white/5">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm flex-shrink-0">
              {profile?.avatar ? (
                <img src={profile.avatar} alt="" className="w-full h-full rounded-lg object-cover" />
              ) : (
                profile?.name?.[0]?.toUpperCase() || '?'
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold truncate">{profile?.name}</div>
              {isAdmin && <div className="text-[10px] text-amber-400 font-bold">ADMIN</div>}
            </div>
            <button onClick={handleLogout} title="Шығу"
              className="text-slate-600 hover:text-red-400 transition text-lg">
              →
            </button>
          </div>
        </div>
      </aside>

      {/* Контент */}
      <main className="ml-60 flex-1 min-h-screen">
        {children}
      </main>
    </div>
  );
}
