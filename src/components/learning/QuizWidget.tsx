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
      className="learn-quiz my-6 p-5 sm:p-6 bg-surface-1 border border-separator rounded-xl shadow-card"
    >
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-separator">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 text-xs font-semibold rounded bg-accent-subtle text-accent border border-accent/25">
            Self-Check
          </span>
          <h3 className="text-base sm:text-lg font-semibold text-text">
            {quiz.title}
          </h3>
        </div>
        {submitted && (
          <span
            className={`text-sm font-medium px-2.5 py-0.5 rounded-full ${
              score === quiz.questions.length
                ? 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/25'
                : 'bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/25'
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
              <legend className="text-sm sm:text-base font-medium text-text mb-3">
                <span className="font-semibold text-text-muted mr-1.5">
                  {qIdx + 1}.
                </span>
                {question.prompt}
              </legend>

              <div className="space-y-2.5">
                {question.options.map((option) => {
                  const isSelected = selectedOptionId === option.id;
                  let optionClass =
                    'border-separator bg-surface-1 hover:border-text-secondary/40 text-text-secondary';

                  if (submitted) {
                    if (option.isCorrect) {
                      optionClass =
                        'border-emerald-500 bg-emerald-500/10 text-emerald-950 dark:text-emerald-200';
                    } else if (isSelected && !option.isCorrect) {
                      optionClass =
                        'border-red-400 bg-red-500/10 text-red-950 dark:text-red-200';
                    } else {
                      optionClass = 'opacity-60 border-separator';
                    }
                  } else if (isSelected) {
                    optionClass =
                      'border-accent bg-accent-subtle ring-1 ring-accent text-text';
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
                        className="mt-0.5 text-accent accent-accent focus-ring w-4 h-4 cursor-pointer"
                      />
                      <span className="flex-1 text-text leading-snug">
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
                      ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-950 dark:text-emerald-100'
                      : 'bg-amber-500/10 border-amber-500/25 text-amber-950 dark:text-amber-100'
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

      <div className="mt-6 pt-4 border-t border-separator flex items-center justify-between gap-3">
        {!submitted ? (
          <button
            type="button"
            disabled={!allAnswered}
            onClick={handleCheckAnswers}
            className="px-4 py-2 text-sm font-medium rounded-lg text-white bg-accent hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[40px] focus-ring"
          >
            Check Answers
          </button>
        ) : (
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2 text-sm font-medium rounded-lg text-text-secondary bg-surface-1 border border-separator hover:bg-surface-2 transition-colors min-h-[40px] focus-ring"
          >
            Retry Quiz
          </button>
        )}
      </div>
    </div>
  );
};
