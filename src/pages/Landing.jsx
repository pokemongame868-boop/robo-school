import { useState } from 'react';
import AuthModal from '../components/AuthModal';

export default function Landing() {
  const [modal, setModal] = useState(null); // 'login' | 'register' | null

  return (
    <div className="min-h-screen bg-[#080c14] text-white overflow-x-hidden">

      {/* Фон */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_20%_-10%,rgba(99,102,241,0.18)_0%,transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_85%_70%,rgba(14,165,233,0.12)_0%,transparent_55%)]" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />
      </div>

      {/* Навбар */}
      <header className="relative z-10 flex items-center justify-between px-8 py-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-sky-400 flex items-center justify-center font-black text-sm">R</div>
          <span className="font-bold tracking-tight text-lg">ROBO SCHOOL</span>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setModal('login')} className="px-5 py-2 text-sm font-semibold text-slate-300 hover:text-white transition">
            Кіру
          </button>
          <button onClick={() => setModal('register')} className="px-5 py-2 text-sm font-bold bg-indigo-500 hover:bg-indigo-400 rounded-lg transition">
            Тіркелу
          </button>
        </div>
      </header>

      {/* Hero */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-[85vh] px-6 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-semibold uppercase tracking-widest mb-8">
          🤖 Робототехника мектебі
        </div>
        <h1 className="text-6xl md:text-8xl font-black leading-[0.9] mb-6 tracking-tighter">
          БОЛАШАҚ<br />
          <span className="bg-gradient-to-r from-indigo-400 via-sky-400 to-cyan-300 bg-clip-text text-transparent">
            ИНЖЕНЕРЛЕР
          </span>
        </h1>
        <p className="text-slate-400 text-lg max-w-xl mb-10 leading-relaxed">
          Заманауи робототехника курстары. Видео сабақтар, тесттер және прогресс бақылау — барлығы бір жерде.
        </p>
        <div className="flex gap-4 flex-wrap justify-center">
          <button onClick={() => setModal('register')}
            className="px-8 py-3.5 bg-gradient-to-r from-indigo-500 to-sky-500 rounded-xl font-bold text-sm hover:opacity-90 transition shadow-lg shadow-indigo-500/25">
            Тегін бастау →
          </button>
          <button onClick={() => setModal('login')}
            className="px-8 py-3.5 bg-white/5 border border-white/10 rounded-xl font-bold text-sm hover:bg-white/10 transition">
            Кіру
          </button>
        </div>

        {/* Stats */}
        <div className="mt-20 grid grid-cols-3 gap-12 text-center">
          {[['15+', 'жыл тәжірибе'], ['100+', 'оқушы'], ['10+', 'модуль']].map(([n, l]) => (
            <div key={l}>
              <div className="text-3xl font-black text-white">{n}</div>
              <div className="text-slate-500 text-sm mt-1">{l}</div>
            </div>
          ))}
        </div>
      </main>

      {/* Автор */}
      <section className="relative z-10 py-24 px-6 max-w-4xl mx-auto">
        <div className="p-px bg-gradient-to-r from-indigo-500/30 via-sky-500/30 to-transparent rounded-3xl">
          <div className="bg-[#0d1220] rounded-3xl p-10 flex flex-col md:flex-row items-center gap-8">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-4xl flex-shrink-0">
              👨‍🏫
            </div>
            <div>
              <div className="text-indigo-400 text-xs font-bold uppercase tracking-widest mb-1">Сайт авторы</div>
              <h3 className="text-2xl font-black mb-2">Бабагулов Ерулан Ескендірұлы</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Қарағандағы №5 мектептің робототехника мұғалімі. 15 жылдан астам тәжірибе. ГОРОНО-мен бірлесе жұмыс істейді.
              </p>
              <div className="flex gap-3 mt-4">
                <span className="px-3 py-1 bg-white/5 rounded-lg text-xs border border-white/10">Instagram: erakrg2014</span>
                <span className="px-3 py-1 bg-white/5 rounded-lg text-xs border border-white/10">+7 (700) 917-59-61</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {modal && <AuthModal initialMode={modal} onClose={() => setModal(null)} />}
    </div>
  );
}
