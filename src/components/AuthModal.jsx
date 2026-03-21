import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function AuthModal({ initialMode = 'login', onClose }) {
  const [mode, setMode] = useState(initialMode);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register, login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'register') {
        if (!form.name.trim()) return setError('Атыңызды енгізіңіз');
        if (form.password.length < 6) return setError('Пароль кемінде 6 символ');
        await register(form);
      } else {
        await login(form);
      }
      onClose();
    } catch (err) {
      const msgs = {
        'auth/email-already-in-use': 'Бұл email тіркелген',
        'auth/user-not-found': 'Пайдаланушы табылмады',
        'auth/wrong-password': 'Қате пароль',
        'auth/invalid-email': 'Email форматы қате',
        'auth/invalid-credential': 'Email немесе пароль қате',
        'auth/too-many-requests': 'Тым көп әрекет. Кейінірек көріңіз',
      };
      setError(msgs[err.code] || 'Қате орын алды');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-[#0d1220] border border-white/10 rounded-2xl p-8 w-full max-w-sm shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-black">{mode === 'login' ? 'Кіру' : 'Тіркелу'}</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition text-xl">✕</button>
        </div>

        {/* Toggle */}
        <div className="flex bg-white/5 rounded-xl p-1 mb-6">
          {['login', 'register'].map((m) => (
            <button key={m} onClick={() => { setMode(m); setError(''); }}
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${mode === m ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-white'}`}>
              {m === 'login' ? 'Кіру' : 'Тіркелу'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === 'register' && (
            <input
              type="text" placeholder="Атыңыз *"
              value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500 transition placeholder:text-slate-600"
            />
          )}
          <input
            type="email" placeholder="Email *"
            value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500 transition placeholder:text-slate-600"
          />
          <input
            type="password" placeholder="Пароль *"
            value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500 transition placeholder:text-slate-600"
          />

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5 text-red-400 text-xs">
              {error}
            </div>
          )}

          <button type="submit" disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-indigo-500 to-sky-500 rounded-xl font-bold text-sm disabled:opacity-50 transition hover:opacity-90">
            {loading ? 'Жүктелуде...' : mode === 'login' ? 'Кіру' : 'Тіркелу'}
          </button>
        </form>
      </div>
    </div>
  );
}
