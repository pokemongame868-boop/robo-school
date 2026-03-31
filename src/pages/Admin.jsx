import { useState, useEffect, useRef } from 'react';
import {
  collection, addDoc, getDocs, deleteDoc, doc,
  orderBy, query, serverTimestamp, updateDoc
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../firebase/config';
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
  attachments: [],
};

const emptyQuestion = { question: '', options: ['', '', '', ''], correct: 0 };

export default function Admin() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [stages, setStages] = useState([]);
  const [form, setForm] = useState(emptyStage);
  const [quiz, setQuiz] = useState([]);
  const [attachments, setAttachments] = useState([]); // [{name, url, size, storagePath}]
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState('list'); // 'list' | 'add' | 'edit'
  const [editingId, setEditingId] = useState(null);
  const [uploads, setUploads] = useState({}); // {filename: progress 0-100}
  const [linkForm, setLinkForm] = useState({ name: '', url: '' });
  const [showLinkForm, setShowLinkForm] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!isAdmin) navigate('/courses');
    loadStages();
  }, [isAdmin]);

  const loadStages = async () => {
    const q = query(collection(db, 'stages'), orderBy('order'));
    const snap = await getDocs(q);
    setStages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  // ---- Открыть форму редактирования ----
  const openEdit = (stage) => {
    setEditingId(stage.id);
    setForm({
      title: stage.title || '',
      description: stage.description || '',
      videoUrl: stage.videoUrl || '',
      content: stage.content || '',
      duration: stage.duration || '',
      order: stage.order ?? 0,
    });
    setQuiz(stage.quiz ? stage.quiz.map(q => ({ ...q, options: [...q.options] })) : []);
    setAttachments(stage.attachments || []);
    setTab('edit');
  };

  // ---- Открыть форму добавления ----
  const openAdd = () => {
    setEditingId(null);
    setForm(emptyStage);
    setQuiz([]);
    setAttachments([]);
    setTab('add');
  };

  // ---- Вопросы ----
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

  // ---- Загрузка файлов ----
  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => uploadFile(file));
    e.target.value = '';
  };

  const uploadFile = (file) => {
    const safeName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const storageRef = ref(storage, `stages/${safeName}`);
    const task = uploadBytesResumable(storageRef, file);

    setUploads(prev => ({ ...prev, [file.name]: 0 }));

    task.on(
      'state_changed',
      (snap) => {
        const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
        setUploads(prev => ({ ...prev, [file.name]: pct }));
      },
      (err) => {
        console.error(err);
        alert(`Жүктеу қатесі: ${file.name}`);
        setUploads(prev => { const n = { ...prev }; delete n[file.name]; return n; });
      },
      async () => {
        const url = await getDownloadURL(task.snapshot.ref);
        const sizeLabel = file.size < 1024 * 1024
          ? `${(file.size / 1024).toFixed(1)} KB`
          : `${(file.size / 1024 / 1024).toFixed(1)} MB`;
        setAttachments(prev => [...prev, {
          name: file.name,
          url,
          size: sizeLabel,
          storagePath: `stages/${safeName}`,
        }]);
        setUploads(prev => { const n = { ...prev }; delete n[file.name]; return n; });
      }
    );
  };

  const removeAttachment = async (i) => {
    const att = attachments[i];
    // Удаляем из Storage если есть путь
    if (att.storagePath) {
      try {
        await deleteObject(ref(storage, att.storagePath));
      } catch (_) {}
    }
    setAttachments(prev => prev.filter((_, j) => j !== i));
  };

  const addLinkAttachment = () => {
    if (!linkForm.name.trim() || !linkForm.url.trim()) return alert('Атауы мен сілтемені енгізіңіз');
    let url = linkForm.url.trim();
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
    setAttachments(prev => [...prev, { name: linkForm.name.trim(), url, size: 'Сілтеме' }]);
    setLinkForm({ name: '', url: '' });
    setShowLinkForm(false);
  };

  // ---- Сохранение ----
  const handleSubmit = async () => {
    if (!form.title.trim()) return alert('Тақырыпты енгізіңіз');
    if (Object.keys(uploads).length > 0) return alert('Файлдар жүктелуде, күте тұрыңыз...');
    setSaving(true);
    try {
      const data = {
        ...form,
        quiz,
        attachments,
      };

      if (editingId) {
        // Редактирование
        await updateDoc(doc(db, 'stages', editingId), data);
      } else {
        // Добавление
        await addDoc(collection(db, 'stages'), {
          ...data,
          order: stages.length,
          createdAt: serverTimestamp(),
        });
      }

      setForm(emptyStage);
      setQuiz([]);
      setAttachments([]);
      setEditingId(null);
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

  const isEditing = tab === 'edit';
  const isFormTab = tab === 'add' || tab === 'edit';

  return (
    <div className="max-w-3xl mx-auto px-8 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black">Басқару панелі</h1>
          <p className="text-slate-500 text-sm mt-1">Тек Ерулан үшін</p>
        </div>
        <div className="flex bg-white/5 rounded-xl p-1">
          <button onClick={() => setTab('list')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition ${tab === 'list' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-white'}`}>
            Этаптар
          </button>
          <button onClick={openAdd}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition ${tab === 'add' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-white'}`}>
            Қосу
          </button>
          {isEditing && (
            <button className="px-4 py-2 rounded-lg text-sm font-bold bg-amber-500 text-white">
              Өңдеу
            </button>
          )}
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
                  {s.quiz?.length || 0} сұрақ · {s.attachments?.length || 0} файл · {s.duration || 'уақыт көрсетілмеген'}
                </div>
              </div>
              <button onClick={() => openEdit(s)}
                className="text-slate-400 hover:text-amber-400 transition text-sm px-3 py-1.5 rounded-lg hover:bg-amber-500/10 font-semibold">
                Өңдеу
              </button>
              <button onClick={() => handleDelete(s.id)}
                className="text-slate-600 hover:text-red-400 transition text-sm px-3 py-1.5 rounded-lg hover:bg-red-500/10">
                Өшіру
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Форма добавления/редактирования */}
      {isFormTab && (
        <div className="space-y-5">
          {isEditing && (
            <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-2.5">
              <span className="text-amber-400 text-sm">✎</span>
              <span className="text-amber-300 text-sm font-semibold">Өңдеу режимі: {form.title}</span>
            </div>
          )}

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

          {/* Файлы */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Файлдар (PDF, DOCX, ZIP...)</label>
              <div className="flex gap-2">
                <button onClick={() => { setShowLinkForm(v => !v); }}
                  className="text-xs bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 px-3 py-1.5 rounded-lg font-bold transition">
                  + Сілтеме
                </button>
                <button onClick={() => fileInputRef.current?.click()}
                  className="text-xs bg-sky-500/15 text-sky-300 hover:bg-sky-500/25 px-3 py-1.5 rounded-lg font-bold transition">
                  + Файл жүктеу
                </button>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileUpload}
            />

            {/* Форма добавления ссылки */}
            {showLinkForm && (
              <div className="mb-3 p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl space-y-2">
                <input
                  value={linkForm.name}
                  onChange={e => setLinkForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="Файл атауы (мыс: Нұсқаулық.pdf)"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-emerald-500 transition placeholder:text-slate-600"
                />
                <input
                  value={linkForm.url}
                  onChange={e => setLinkForm(p => ({ ...p, url: e.target.value }))}
                  placeholder="Сілтеме (Google Drive, Yandex Disk...)"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-emerald-500 transition placeholder:text-slate-600"
                />
                <div className="flex gap-2">
                  <button onClick={addLinkAttachment}
                    className="flex-1 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-lg text-sm font-bold transition">
                    Қосу
                  </button>
                  <button onClick={() => { setShowLinkForm(false); setLinkForm({ name: '', url: '' }); }}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-400 rounded-lg text-sm transition">
                    Бас тарту
                  </button>
                </div>
              </div>
            )}

            {/* Прогресс загрузок */}
            {Object.entries(uploads).map(([name, pct]) => (
              <div key={name} className="mb-2 bg-white/3 border border-white/8 rounded-xl p-3">
                <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                  <span className="truncate mr-2">{name}</span>
                  <span>{pct}%</span>
                </div>
                <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-sky-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
              </div>
            ))}

            {/* Загруженные файлы */}
            {attachments.length > 0 && (
              <div className="space-y-2 mt-2">
                {attachments.map((file, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-white/3 border border-white/8 rounded-xl">
                    <span className="text-lg flex-shrink-0">📎</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate text-slate-200">{file.name}</div>
                      {file.size && <div className="text-xs text-slate-500">{file.size}</div>}
                    </div>
                    <button onClick={() => removeAttachment(i)}
                      className="text-slate-600 hover:text-red-400 transition text-xs px-2 py-1 rounded-lg hover:bg-red-500/10">
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
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

          <div className="flex gap-3">
            <button onClick={() => { setTab('list'); setEditingId(null); }}
              className="px-6 py-3.5 bg-white/5 hover:bg-white/10 rounded-xl font-bold text-sm transition text-slate-300">
              Бас тарту
            </button>
            <button onClick={handleSubmit} disabled={saving}
              className="flex-1 py-3.5 bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 rounded-xl font-bold text-sm transition">
              {saving ? 'Сақталуда...' : isEditing ? '✓ Өзгерістерді сақтау' : 'Этапты қосу'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
