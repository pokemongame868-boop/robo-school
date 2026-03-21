import { useState, useEffect } from 'react';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import StagePlayer from '../components/StagePlayer';

export default function Courses() {
  const { profile } = useAuth();
  const [stages, setStages] = useState([]);
  const [activeStage, setActiveStage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStages = async () => {
      try {
        const q = query(collection(db, 'stages'), orderBy('order'));
        const snap = await getDocs(q);
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setStages(data);

        // Открываем последний этап где остановился или первый
        const lastStage = profile?.currentStage || 0;
        const target = data[lastStage] || data[0];
        if (target) setActiveStage(target);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchStages();
  }, []);

  const completedSet = new Set(profile?.completedStages || []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Список этапов */}
      <aside className="w-72 border-r border-white/5 flex flex-col overflow-hidden">
        <div className="px-6 py-5 border-b border-white/5">
          <h1 className="font-black text-lg">Курс</h1>
          <div className="text-slate-500 text-xs mt-1">
            {completedSet.size} / {stages.length} аяқталды
          </div>
          {/* Прогресс бар */}
          <div className="mt-3 h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-sky-400 rounded-full transition-all"
              style={{ width: stages.length ? `${(completedSet.size / stages.length) * 100}%` : '0%' }}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
          {stages.length === 0 ? (
            <div className="text-center text-slate-500 text-sm py-12">
              <div className="text-3xl mb-3">📭</div>
              Материалдар әзірленуде...
            </div>
          ) : (
            stages.map((stage, i) => {
              const isCompleted = completedSet.has(stage.id);
              const isActive = activeStage?.id === stage.id;
              const isLocked = i > 0 && !completedSet.has(stages[i - 1]?.id);

              return (
                <button
                  key={stage.id}
                  onClick={() => !isLocked && setActiveStage(stage)}
                  disabled={isLocked}
                  className={`w-full text-left flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${
                    isActive
                      ? 'bg-indigo-500/15 border border-indigo-500/20'
                      : isLocked
                      ? 'opacity-40 cursor-not-allowed'
                      : 'hover:bg-white/5 cursor-pointer'
                  }`}
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    isCompleted ? 'bg-green-500/20 text-green-400' :
                    isActive ? 'bg-indigo-500 text-white' :
                    'bg-white/5 text-slate-400'
                  }`}>
                    {isCompleted ? '✓' : isLocked ? '🔒' : i + 1}
                  </div>
                  <div className="min-w-0">
                    <div className={`text-sm font-semibold truncate ${isActive ? 'text-white' : 'text-slate-300'}`}>
                      {stage.title}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {stage.duration || '—'}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </aside>

      {/* Контент этапа */}
      <div className="flex-1 overflow-y-auto">
        {activeStage ? (
          <StagePlayer
            stage={activeStage}
            stageIndex={stages.findIndex(s => s.id === activeStage.id)}
            totalStages={stages.length}
            isCompleted={completedSet.has(activeStage?.id)}
            nextStage={stages[stages.findIndex(s => s.id === activeStage.id) + 1]}
            onComplete={(nextStage) => {
              if (nextStage) setActiveStage(nextStage);
            }}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-slate-500">
            <div className="text-center">
              <div className="text-5xl mb-4">🤖</div>
              <p>Этапты таңдаңыз</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
