import { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { user, profile, refreshProfile } = useAuth();
  const [form, setForm] = useState({
    name: profile?.name || '',
    bio: profile?.bio || '',
    avatar: profile?.avatar || '',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        name: form.name.trim(),
        bio: form.bio.trim(),
        avatar: form.avatar.trim(),
      });
      await refreshProfile();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const completedCount = profile?.completedStages?.length || 0;

  return (
    <div className="max-w-2xl mx-auto px-8 py-10">
      <h1 className="text-2xl font-black mb-8">Профиль</h1>

      {/* Аватар preview */}
      <div className="flex items-center gap-6 mb-8 p-6 bg-white/3 border border-white/8 rounded-2xl">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-3xl font-black flex-shrink-0 overflow-hidden">
          {form.avatar ? (
            <img src={form.avatar} alt="" className="w-full h-full object-cover" onError={e => e.target.style.display = 'none'} />
          ) : (
            form.name?.[0]?.toUpperCase() || '?'
          )}
        </div>
        <div>
          <div className="font-black text-lg">{form.name || 'Атыңыз'}</div>
          <div className="text-slate-500 text-sm mt-0.5">{profile?.email}</div>
          <div className="flex gap-3 mt-2">
            <span className="text-xs bg-indigo-500/15 text-indigo-300 px-2.5 py-1 rounded-lg">
              {completedCount} этап аяқталды
            </span>
          </div>
        </div>
      </div>

      {/* Форма */}
      <div className="space-y-4">
        <div>
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Атыңыз *</label>
          <input
            type="text"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500 transition"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
            Аватар URL <span className="text-slate-600 normal-case font-normal">(сурет сілтемесі)</span>
          </label>
          <input
            type="url"
            value={form.avatar}
            onChange={e => setForm({ ...form, avatar: e.target.value })}
            placeholder="https://..."
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500 transition placeholder:text-slate-600"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Өзіңіз туралы</label>
          <textarea
            value={form.bio}
            onChange={e => setForm({ ...form, bio: e.target.value })}
            rows={3}
            placeholder="Өзіңіз туралы бірнеше сөз..."
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500 transition resize-none placeholder:text-slate-600"
          />
        </div>

        <button onClick={handleSave} disabled={saving || !form.name.trim()}
          className={`w-full py-3.5 rounded-xl font-bold text-sm transition ${
            saved
              ? 'bg-green-500/20 text-green-300 border border-green-500/30'
              : 'bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50'
          }`}>
          {saved ? '✓ Сақталды!' : saving ? 'Сақталуда...' : 'Сақтау'}
        </button>
      </div>
    </div>
  );
}
