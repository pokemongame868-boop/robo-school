import { useState } from 'react';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import Comments from './Comments';

export default function StagePlayer({ stage, stageIndex, totalStages, isCompleted, nextStage, onComplete }) {
  const { user, refreshProfile } = useAuth();
  const [quizMode, setQuizMode] = useState(false);
  const [answers, setAnswers] = useState({});
  const [quizResult, setQuizResult] = useState(null); // null | 'pass' | 'fail'
  const [submitting, setSubmitting] = useState(false);

  const handleAnswer = (qIdx, aIdx) => {
    if (quizResult) return;
    setAnswers(prev => ({ ...prev, [qIdx]: aIdx }));
  };

  const submitQuiz = async () => {
    if (!stage.quiz?.length) return;
    const allAnswered = stage.quiz.every((_, i) => answers[i] !== undefined);
    if (!allAnswered) return alert('Барлық сұрақтарға жауап беріңіз');

    const correct = stage.quiz.filter((q, i) => answers[i] === q.correct).length;
    const passed = correct >= Math.ceil(stage.quiz.length * 0.7); // 70% to pass

    setQuizResult(passed ? 'pass' : 'fail');

    if (passed) {
      setSubmitting(true);
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          completedStages: arrayUnion(stage.id),
          currentStage: stageIndex + 1,
        });
        await refreshProfile();
      } catch (e) {
        console.error(e);
      } finally {
        setSubmitting(false);
      }
    }
  };

  const retryQuiz = () => {
    setAnswers({});
    setQuizResult(null);
  };

  // Получаем YouTube embed URL
  const getEmbedUrl = (url) => {
    if (!url) return null;
    const match = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return match ? `https://www.youtube.com/embed/${match[1]}` : url;
  };

  return (
    <div className="max-w-3xl mx-auto px-8 py-8">
      {/* Шапка */}
      <div className="mb-6">
        <div className="text-indigo-400 text-xs font-bold uppercase tracking-widest mb-2">
          Этап {stageIndex + 1} / {totalStages}
        </div>
        <h1 className="text-2xl font-black">{stage.title}</h1>
        {stage.description && (
          <p className="text-slate-400 text-sm mt-2 leading-relaxed">{stage.description}</p>
        )}
      </div>

      {/* Видео */}
      {stage.videoUrl && !quizMode && (
        <div className="aspect-video rounded-2xl overflow-hidden bg-black mb-6">
          <iframe
            src={getEmbedUrl(stage.videoUrl)}
            className="w-full h-full"
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          />
        </div>
      )}

      {/* Материал */}
      {stage.content && !quizMode && (
        <div className="bg-white/3 border border-white/8 rounded-2xl p-6 mb-6 prose prose-invert prose-sm max-w-none">
          <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{stage.content}</p>
        </div>
      )}

      {/* Кнопка перехода к тесту */}
      {!quizMode && !isCompleted && stage.quiz?.length > 0 && (
        <button onClick={() => setQuizMode(true)}
          className="w-full py-3.5 bg-indigo-500 hover:bg-indigo-400 rounded-xl font-bold text-sm transition mb-8">
          Тестке өту →
        </button>
      )}

      {/* Уже пройдено */}
      {isCompleted && !quizMode && (
        <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 rounded-xl px-5 py-3.5 mb-8">
          <span className="text-green-400 text-lg">✓</span>
          <span className="text-green-300 font-semibold text-sm">Этап аяқталды!</span>
          {nextStage && (
            <button onClick={() => onComplete(nextStage)}
              className="ml-auto text-xs bg-green-500/20 hover:bg-green-500/30 text-green-300 px-3 py-1.5 rounded-lg font-bold transition">
              Келесі →
            </button>
          )}
        </div>
      )}

      {/* Тест */}
      {quizMode && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-black">Тест</h2>
            <button onClick={() => setQuizMode(false)} className="text-slate-500 hover:text-white text-sm transition">
              ← Оралу
            </button>
          </div>

          {quizResult === 'pass' && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-6 text-center mb-6">
              <div className="text-4xl mb-2">🎉</div>
              <div className="text-green-300 font-black text-lg">Сіз өттіңіз!</div>
              <p className="text-slate-400 text-sm mt-1">Этап сәтті аяқталды</p>
              {nextStage && (
                <button onClick={() => { setQuizMode(false); onComplete(nextStage); }}
                  className="mt-4 px-6 py-2.5 bg-green-500 hover:bg-green-400 rounded-xl font-bold text-sm transition">
                  Келесі этапқа →
                </button>
              )}
            </div>
          )}

          {quizResult === 'fail' && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-center mb-6">
              <div className="text-4xl mb-2">😔</div>
              <div className="text-red-300 font-black text-lg">Өтпедіңіз</div>
              <p className="text-slate-400 text-sm mt-1">70% дұрыс жауап керек. Қайта көріңіз.</p>
              <button onClick={retryQuiz}
                className="mt-4 px-6 py-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-xl font-bold text-sm transition">
                Қайталау
              </button>
            </div>
          )}

          {!quizResult && stage.quiz?.map((q, qi) => (
            <div key={qi} className="mb-6">
              <p className="font-semibold text-sm mb-3 text-slate-200">
                {qi + 1}. {q.question}
              </p>
              <div className="space-y-2">
                {q.options.map((opt, oi) => (
                  <button key={oi} onClick={() => handleAnswer(qi, oi)}
                    className={`w-full text-left px-4 py-3 rounded-xl text-sm border transition ${
                      answers[qi] === oi
                        ? 'bg-indigo-500/20 border-indigo-500/50 text-white'
                        : 'bg-white/3 border-white/8 text-slate-300 hover:bg-white/8'
                    }`}>
                    <span className="font-bold text-slate-500 mr-2">{String.fromCharCode(65 + oi)}.</span>
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {!quizResult && stage.quiz?.length > 0 && (
            <button onClick={submitQuiz} disabled={submitting}
              className="w-full py-3.5 bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 rounded-xl font-bold text-sm transition">
              {submitting ? 'Тексерілуде...' : 'Жіберу'}
            </button>
          )}
        </div>
      )}

      {/* Комментарии */}
      <Comments stageId={stage.id} />
    </div>
  );
}
