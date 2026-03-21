import { useState, useEffect } from 'react';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';

export default function Community() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const q = query(collection(db, 'users'), orderBy('completedStages'));
        const snap = await getDocs(q);
        setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })).reverse());
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto px-8 py-10">
      <h1 className="text-2xl font-black mb-2">Қауымдастық</h1>
      <p className="text-slate-500 text-sm mb-8">{users.length} оқушы тіркелген</p>

      <div className="space-y-3">
        {users.map((u, i) => {
          const completed = u.completedStages?.length || 0;
          const isMe = u.id === user?.uid;

          return (
            <div key={u.id}
              className={`flex items-center gap-4 p-4 rounded-2xl border transition ${
                isMe ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-white/3 border-white/8 hover:bg-white/5'
              }`}>
              {/* Место */}
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0 ${
                i === 0 ? 'bg-amber-400/20 text-amber-300' :
                i === 1 ? 'bg-slate-400/20 text-slate-300' :
                i === 2 ? 'bg-orange-400/20 text-orange-300' :
                'bg-white/5 text-slate-500'
              }`}>
                {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
              </div>

              {/* Аватар */}
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm font-bold flex-shrink-0 overflow-hidden">
                {u.avatar ? <img src={u.avatar} alt="" className="w-full h-full object-cover" onError={e => e.target.style.display = 'none'} /> : u.name?.[0]?.toUpperCase()}
              </div>

              {/* Инфо */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm truncate">{u.name}</span>
                  {isMe && <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-md font-bold">СІЗ</span>}
                </div>
                {u.bio && <p className="text-slate-500 text-xs mt-0.5 truncate">{u.bio}</p>}
              </div>

              {/* Прогресс */}
              <div className="text-right flex-shrink-0">
                <div className="text-sm font-black text-indigo-300">{completed}</div>
                <div className="text-xs text-slate-600">этап</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
