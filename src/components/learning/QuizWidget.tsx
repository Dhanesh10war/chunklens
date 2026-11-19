import React, { useState } from 'react';
import { QUIZZES, QuizQuestion } from '../../data/learning/quizzes';
import { recordQuizScore } from '../../utils/learningProgress';

interface QuizWidgetProps {
  quizId: string;
}

export const QuizWidget: React.FC<QuizWidgetProps> = ({ quizId }) => {
  const quiz = QUIZZES[quizId];
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [liveAnnouncement, setLiveAnnouncement] = useState('');

  if (!quiz) {
    return (
      <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-sm">
        Quiz "{quizId}" is not yet available.
      </div>
    );
  }

  const handleSelectOption = (questionId: string, optionId: string) => {
    if (submitted) return;
    const newAnswers = { ...selectedAnswers, [questionId]: optionId };
    setSelectedAnswers(newAnswers);

    // Announce choice
    const question = quiz.questions.find((q) => q.id === questionId);
    const option = question?.options.find((o) => o.id === optionId);
    if (option) {
      setLiveAnnouncement(`Selected option: ${option.text}`);
    }
  };

  const handleCheckAnswers = () => {
    setSubmitted(true);
    let correctCount = 0;
    quiz.questions.forEach((q) => {
      const selected = selectedAnswers[q.id];
      const opt = q.options.find((o) => o.id === selected);
      if (opt?.isCorrect) {
        correctCount++;
      }
    });

    recordQuizScore(quizId, correctCount, quiz.questions.length);
    const passed = correctCount === quiz.questions.length;
    setLiveAnnouncement(
      `Quiz completed. You scored ${correctCount} out of ${quiz.questions.length}. ${
        passed ? 'Great job!' : 'Review the rationales below and try again.'
      }`
    );
  };

  const handleReset = () => {
    setSelectedAnswers({});
    setSubmitted(false);
    setLiveAnnouncement('Quiz reset. You may choose new answers.');
  };

  const allAnswered = quiz.questions.every((q) => selectedAnswers[q.id]);
  const score = quiz.questions.filter(
    (q) => q.options.find((o) => o.id === selectedAnswers[q.id])?.isCorrect
  ).length;

  return (
    <div
      role="region"
      aria-label={quiz.title}
      className="learn-quiz my-6 p-5 sm:p-6 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl"
    >
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 text-xs font-semibold rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
            Self-Check
          </span>
          <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-100">
            {quiz.title}
          </h3>
        </div>
        {submitted && (
          <span
            className={`text-sm font-medium px-2.5 py-0.5 rounded-full ${
              score === quiz.questions.length
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
            }`}
          >
            Score: {score}/{quiz.questions.length}
          </span>
        )}
      </div>

      <div aria-live="polite" className="sr-only">
        {liveAnnouncement}
      </div>

      <div className="space-y-6">
        {quiz.questions.map((question: QuizQuestion, qIdx: number) => {
          const selectedOptionId = selectedAnswers[question.id];
          const selectedOption = question.options.find((o) => o.id === selectedOptionId);

          return (
            <fieldset key={question.id} className="border-0 p-0 m-0">
              <legend className="text-sm sm:text-base font-medium text-slate-900 dark:text-slate-100 mb-3">
                <span className="font-semibold text-slate-500 dark:text-slate-400 mr-1.5">
                  {qIdx + 1}.
                </span>
                {question.prompt}
              </legend>

              <div className="space-y-2.5">
                {question.options.map((option) => {
                  const isSelected = selectedOptionId === option.id;
                  let optionClass =
                    'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700';

                  if (submitted) {
                    if (option.isCorrect) {
                      optionClass =
                        'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200';
                    } else if (isSelected && !option.isCorrect) {
                      optionClass =
                        'border-red-400 bg-red-50/50 dark:bg-red-950/30 text-red-900 dark:text-red-200';
                    } else {
                      optionClass = 'opacity-60 border-slate-200 dark:border-slate-800';
                    }
                  } else if (isSelected) {
                    optionClass =
                      'border-indigo-600 dark:border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/30 ring-1 ring-indigo-500';
                  }

                  return (
                    <label
                      key={option.id}
                      className={`flex items-start gap-3 p-3 rounded-lg border text-sm transition-all cursor-pointer min-h-[44px] ${optionClass}`}
                    >
                      <input
                        type="radio"
                        name={question.id}
                        value={option.id}
                        checked={isSelected}
                        disabled={submitted}
                        onChange={() => handleSelectOption(question.id, option.id)}
                        className="mt-0.5 text-indigo-600 focus:ring-indigo-500 focus:ring-2 w-4 h-4 cursor-pointer"
                      />
                      <span className="flex-1 text-slate-800 dark:text-slate-200 leading-snug">
                        {option.text}
                      </span>
                    </label>
                  );
                })}
              </div>

              {submitted && selectedOption && (
                <div
                  className={`mt-2.5 p-3 rounded-lg text-xs sm:text-sm leading-relaxed border ${
                    selectedOption.isCorrect
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100'
                      : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-100'
                  }`}
                >
                  <span className="font-semibold block mb-0.5">
                    {selectedOption.isCorrect ? '✓ Correct Rationale' : '✗ Incorrect Rationale'}
                  </span>
                  {selectedOption.rationale}
                </div>
              )}
            </fieldset>
          );
        })}
      </div>

      <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
        {!submitted ? (
          <button
            type="button"
            disabled={!allAnswered}
            onClick={handleCheckAnswers}
            className="px-4 py-2 text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[40px] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Check Answers
          </button>
        ) : (
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2 text-sm font-medium rounded-lg text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors min-h-[40px] focus:outline-none focus:ring-2 focus:ring-slate-500"
          >
            Retry Quiz
          </button>
        )}
      </div>
    </div>
  );
};
