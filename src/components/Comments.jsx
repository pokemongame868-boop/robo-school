import { useState, useEffect } from 'react';
import { collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';

export default function Comments({ stageId }) {
  const { user, profile } = useAuth();
  const [comments, setComments] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const q = query(
      collection(db, 'comments'),
      where('stageId', '==', stageId),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, snap => {
      setComments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [stageId]);

  const send = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      await addDoc(collection(db, 'comments'), {
        stageId,
        uid: user.uid,
        name: profile?.name || 'Аноним',
        avatar: profile?.avatar || '',
        text: text.trim(),
        createdAt: serverTimestamp(),
      });
      setText('');
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  };

  const formatDate = (ts) => {
    if (!ts) return '';
    const d = ts.toDate?.() || new Date(ts);
    return d.toLocaleDateString('kk-KZ', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="mt-8 border-t border-white/5 pt-8">
      <h3 className="font-bold text-sm text-slate-300 mb-4">Пікірлер ({comments.length})</h3>

      {/* Форма */}
      <div className="flex gap-3 mb-6">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
          {profile?.name?.[0]?.toUpperCase() || '?'}
        </div>
        <div className="flex-1 flex gap-2">
          <input
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
            placeholder="Пікір қалдыру..."
            className="flex-1 bg-white/5 border border-white/8 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-500 transition placeholder:text-slate-600"
          />
          <button onClick={send} disabled={!text.trim() || sending}
            className="px-4 py-2.5 bg-indigo-500 hover:bg-indigo-400 disabled:opacity-40 rounded-xl text-sm font-bold transition">
            →
          </button>
        </div>
      </div>

      {/* Список */}
      <div className="space-y-4">
        {comments.map(c => (
          <div key={c.id} className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
              {c.avatar ? <img src={c.avatar} className="w-full h-full rounded-lg object-cover" alt="" /> : c.name?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-sm font-semibold">{c.name}</span>
                <span className="text-xs text-slate-600">{formatDate(c.createdAt)}</span>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">{c.text}</p>
            </div>
          </div>
        ))}
        {comments.length === 0 && (
          <p className="text-slate-600 text-sm">Бірінші пікір қалдырыңыз!</p>
        )}
      </div>
    </div>
  );
}
