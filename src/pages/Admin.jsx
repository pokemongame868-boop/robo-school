import { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, deleteDoc, doc, orderBy, query, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const emptyStage = {
  title: '',
  description: '',
  videoUrl: '',
  content: '',
  duration: '',
  order: 0,
  quiz: [],
};

const emptyQuestion = { question: '', options: ['', '', '', ''], correct: 0 };

export default function Admin() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [stages, setStages] = useState([]);
  const [form, setForm] = useState(emptyStage);
  const [quiz, setQuiz] = useState([]);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState('list'); // 'list' | 'add'

  useEffect(() => {
    if (!isAdmin) navigate('/courses');
    loadStages();
  }, [isAdmin]);

  const loadStages = async () => {
    const q = query(collection(db, 'stages'), orderBy('order'));
    const snap = await getDocs(q);
    setStages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  const addQuestion = () => setQuiz([...quiz, { ...emptyQuestion, options: ['', '', '', ''] }]);

  const updateQuestion = (qi, field, value) => {
    setQuiz(prev => prev.map((q, i) => i === qi ? { ...q, [field]: value } : q));
  };

  const updateOption = (qi, oi, value) => {
    setQuiz(prev => prev.map((q, i) => i === qi
      ? { ...q, options: q.options.map((o, j) => j === oi ? value : o) }
      : q
    ));
  };

  const removeQuestion = (qi) => setQuiz(prev => prev.filter((_, i) => i !== qi));

  const handleSubmit = async () => {
    if (!form.title.trim()) return alert('Тақырыпты енгізіңіз');
    setSaving(true);
    try {
      await addDoc(collection(db, 'stages'), {
        ...form,
        order: stages.length,
        quiz,
        createdAt: serverTimestamp(),
      });
      setForm(emptyStage);
      setQuiz([]);
      await loadStages();
      setTab('list');
    } catch (e) {
      console.error(e);
      alert('Қате орын алды');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Өшіруге сенімдісіз бе?')) return;
    await deleteDoc(doc(db, 'stages', id));
    await loadStages();
  };

  if (!isAdmin) return null;

  return (
    <div className="max-w-3xl mx-auto px-8 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black">Басқару панелі</h1>
          <p className="text-slate-500 text-sm mt-1">Тек Ерулан үшін</p>
        </div>
        <div className="flex bg-white/5 rounded-xl p-1">
          {[['list', 'Этаптар'], ['add', 'Қосу']].map(([t, l]) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition ${tab === t ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-white'}`}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Список этапов */}
      {tab === 'list' && (
        <div className="space-y-3">
          {stages.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              <div className="text-4xl mb-3">📭</div>
              <p className="text-sm">Этаптар жоқ. Бірінші этапты қосыңыз!</p>
            </div>
          )}
          {stages.map((s, i) => (
            <div key={s.id} className="flex items-center gap-4 p-4 bg-white/3 border border-white/8 rounded-2xl">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center text-sm font-black flex-shrink-0">
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm">{s.title}</div>
                <div className="text-slate-500 text-xs mt-0.5">
                  {s.quiz?.length || 0} сұрақ · {s.duration || 'уақыт көрсетілмеген'}
                </div>
              </div>
              <button onClick={() => handleDelete(s.id)}
                className="text-slate-600 hover:text-red-400 transition text-sm px-3 py-1.5 rounded-lg hover:bg-red-500/10">
                Өшіру
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Форма добавления */}
      {tab === 'add' && (
        <div className="space-y-5">
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Тақырып *</label>
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500 transition" />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Сипаттама</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              rows={2} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500 transition resize-none" />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">YouTube сілтемесі</label>
            <input type="url" value={form.videoUrl} onChange={e => setForm({ ...form, videoUrl: e.target.value })}
              placeholder="https://youtube.com/watch?v=..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500 transition placeholder:text-slate-600" />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Материал (мәтін)</label>
            <textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })}
              rows={4} placeholder="Сабақ мазмұны..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500 transition resize-none placeholder:text-slate-600" />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Ұзақтығы</label>
            <input value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })}
              placeholder="мыс: 15 мин"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500 transition placeholder:text-slate-600" />
          </div>

          {/* Тест */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Тест сұрақтары</label>
              <button onClick={addQuestion}
                className="text-xs bg-indigo-500/15 text-indigo-300 hover:bg-indigo-500/25 px-3 py-1.5 rounded-lg font-bold transition">
                + Сұрақ қосу
              </button>
            </div>

            <div className="space-y-4">
              {quiz.map((q, qi) => (
                <div key={qi} className="bg-white/3 border border-white/8 rounded-2xl p-4">
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-xs font-bold text-slate-400">{qi + 1}-сұрақ</span>
                    <button onClick={() => removeQuestion(qi)} className="text-slate-600 hover:text-red-400 text-xs transition">өшіру</button>
                  </div>
                  <input
                    value={q.question}
                    onChange={e => updateQuestion(qi, 'question', e.target.value)}
                    placeholder="Сұрақ мәтіні..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-indigo-500 transition mb-3 placeholder:text-slate-600"
                  />
                  <div className="space-y-2">
                    {q.options.map((opt, oi) => (
                      <div key={oi} className="flex items-center gap-2">
                        <button onClick={() => updateQuestion(qi, 'correct', oi)}
                          className={`w-6 h-6 rounded-full border-2 flex-shrink-0 transition ${
                            q.correct === oi ? 'bg-green-500 border-green-500' : 'border-white/20 hover:border-green-500/50'
                          }`} />
                        <input
                          value={opt}
                          onChange={e => updateOption(qi, oi, e.target.value)}
                          placeholder={`${String.fromCharCode(65 + oi)} нұсқасы`}
                          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 transition placeholder:text-slate-600"
                        />
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-slate-600 mt-2">● дұрыс жауапты таңдаңыз</p>
                </div>
              ))}
            </div>
          </div>

          <button onClick={handleSubmit} disabled={saving}
            className="w-full py-3.5 bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 rounded-xl font-bold text-sm transition">
            {saving ? 'Сақталуда...' : 'Этапты қосу'}
          </button>
        </div>
      )}
    </div>
  );
}
