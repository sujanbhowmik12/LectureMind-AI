import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, RefreshCw, AlertTriangle } from 'lucide-react';

export default function FlashcardDeck({ flashcards }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  if (!flashcards || flashcards.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <AlertTriangle size={48} style={{ color: 'var(--warning)', marginBottom: '1rem' }} />
        <h3>No Flashcards Available</h3>
        <p className="text-secondary">We couldn't generate any flashcards for this lecture.</p>
      </div>
    );
  }

  const handleNext = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIdx(prev => (prev + 1) % flashcards.length);
    }, 150); // slight delay to allow flip animation to reset first
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIdx(prev => (prev - 1 + flashcards.length) % flashcards.length);
    }, 150);
  };

  const currentCard = flashcards[currentIdx];

  return (
    <div className="flashcards-container">
      <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
        Card {currentIdx + 1} of {flashcards.length}
      </div>

      <div className="flashcard-scene" onClick={() => setIsFlipped(!isFlipped)}>
        <div className={`flashcard ${isFlipped ? 'flipped' : ''}`}>
          <div className="card-face front">
            <h3>{currentCard.front}</h3>
            <span className="card-hint">
              <RefreshCw size={12} style={{ marginRight: '4px' }} />
              Click to Reveal
            </span>
          </div>
          <div className="card-face back">
            <p style={{ fontSize: '1.1rem', lineHeight: '1.6' }}>{currentCard.back}</p>
            <span className="card-hint">
              <RefreshCw size={12} style={{ marginRight: '4px' }} />
              Click to Flip Back
            </span>
          </div>
        </div>
      </div>

      <div className="card-controls">
        <button className="btn-icon" onClick={handlePrev}>
          <ArrowLeft size={18} />
        </button>
        <button className="btn-icon" onClick={handleNext}>
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
