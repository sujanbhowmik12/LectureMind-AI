import React, { useState } from 'react';
import { Check, X, Award, RotateCcw, AlertTriangle } from 'lucide-react';

export default function QuizGenerator({ quizzes }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState(null); // index of selected option
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [answered, setAnswered] = useState(false);

  if (!quizzes || quizzes.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <AlertTriangle size={48} style={{ color: 'var(--warning)', marginBottom: '1rem' }} />
        <h3>No Quiz Questions Available</h3>
        <p className="text-secondary">We couldn't extract any quiz questions from this lecture transcript.</p>
      </div>
    );
  }

  const handleOptionClick = (optIdx) => {
    if (answered) return;
    
    setSelectedOpt(optIdx);
    setAnswered(true);
    
    const isCorrect = optIdx === quizzes[currentIdx].answer;
    if (isCorrect) {
      setScore(prev => prev + 1);
    }
  };

  const handleNext = () => {
    setSelectedOpt(null);
    setAnswered(false);
    
    if (currentIdx + 1 < quizzes.length) {
      setCurrentIdx(currentIdx + 1);
    } else {
      setShowResult(true);
    }
  };

  const resetQuiz = () => {
    setCurrentIdx(0);
    setSelectedOpt(null);
    setScore(0);
    setShowResult(false);
    setAnswered(false);
  };

  if (showResult) {
    const percentage = Math.round((score / quizzes.length) * 100);
    return (
      <div className="quiz-container" style={{ textAlign: 'center' }}>
        <Award size={64} style={{ color: 'var(--warning)', marginBottom: '1.5rem' }} />
        <h2>Quiz Completed!</h2>
        <div style={{ fontSize: '3rem', fontWeight: '800', color: 'var(--accent-primary)', margin: '1.5rem 0' }}>
          {score} / {quizzes.length}
        </div>
        <p className="text-secondary" style={{ marginBottom: '2rem' }}>
          You scored {percentage}% on this quiz. Great job revising your lecture notes!
        </p>
        <button className="btn-premium" style={{ margin: '0 auto' }} onClick={resetQuiz}>
          <RotateCcw size={16} />
          Retake Quiz
        </button>
      </div>
    );
  }

  const currentQuestion = quizzes[currentIdx];

  return (
    <div className="quiz-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
        <span>Question {currentIdx + 1} of {quizzes.length}</span>
        <span>Score: {score}</span>
      </div>

      <h3 style={{ fontSize: '1.25rem', marginBottom: '2rem', lineHeight: '1.5' }}>
        {currentQuestion.question}
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {currentQuestion.options.map((opt, oIdx) => {
          let optClass = 'quiz-option';
          const isSelected = selectedOpt === oIdx;
          const isCorrectAnswer = oIdx === currentQuestion.answer;
          
          if (answered) {
            if (isCorrectAnswer) {
              optClass += ' correct';
            } else if (isSelected) {
              optClass += ' wrong';
            }
          }

          return (
            <div 
              key={oIdx} 
              className={optClass} 
              onClick={() => handleOptionClick(oIdx)}
            >
              <span>{opt}</span>
              {answered && isCorrectAnswer && <Check size={18} />}
              {answered && isSelected && !isCorrectAnswer && <X size={18} />}
            </div>
          );
        })}
      </div>

      {answered && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
          <button className="btn-premium" onClick={handleNext}>
            {currentIdx + 1 === quizzes.length ? 'Show Results' : 'Next Question'}
          </button>
        </div>
      )}
    </div>
  );
}
