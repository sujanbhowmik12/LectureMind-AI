import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, FileText, MessageSquare, HelpCircle, CheckSquare, Layers, FileAudio } from 'lucide-react';
import TranscriptView from './TranscriptView';
import NotesView from './NotesView';
import ChatInterface from './ChatInterface';
import QuizGenerator from './QuizGenerator';
import FlashcardDeck from './FlashcardDeck';
import TextModeView from './TextModeView';

export default function LectureViewer({ lecture, onBack, onUpdateLecture }) {
  const [activeTab, setActiveTab] = useState('textmode');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  const timerRef = useRef(null);
  const duration = lecture.transcript.length > 0 ? lecture.transcript[lecture.transcript.length - 1].end : 60;

  // Sync Timer for Simulated Playback
  useEffect(() => {
    if (lecture.mediaUrl) return; // Use real element event listeners instead of simulated timer
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setCurrentTime(prev => {
          if (prev >= duration) {
            setIsPlaying(false);
            clearInterval(timerRef.current);
            return duration;
          }
          return prev + 0.5; // Update every half second
        });
      }, 500);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, duration, lecture.mediaUrl]);

  const handleSeekAndSwitch = (secs) => {
    setCurrentTime(secs);
    setActiveTab('transcript');
    setIsPlaying(true);
  };

  const handleUpdateNotes = (newSummary) => {
    const updated = { ...lecture, summary: newSummary };
    onUpdateLecture(updated);
  };

  const handleToggleDeadline = (id) => {
    const updatedDeadlines = lecture.deadlines.map(d => 
      d.id === id ? { ...d, completed: !d.completed } : d
    );
    onUpdateLecture({ ...lecture, deadlines: updatedDeadlines });
  };

  const handleAddDeadline = (title, dueDate) => {
    const newD = {
      id: `dl_${Date.now()}`,
      title,
      dueDate,
      completed: false
    };
    onUpdateLecture({ ...lecture, deadlines: [...(lecture.deadlines || []), newD] });
  };

  const handleDeleteDeadline = (id) => {
    const filtered = lecture.deadlines.filter(d => d.id !== id);
    onUpdateLecture({ ...lecture, deadlines: filtered });
  };

  const formatDate = (isoStr) => {
    return new Date(isoStr).toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div className="viewer-container">
      <div className="viewer-header">
        <div>
          <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }} onClick={onBack}>
            <ArrowLeft size={16} />
            Back to Dashboard
          </button>
          <h2>{lecture.title}</h2>
          <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            <span>Recorded on {formatDate(lecture.date)}</span>
            <span>Duration: {lecture.duration}</span>
          </div>
        </div>

        <div className="viewer-tabs">
          <button 
            className={`tab-btn ${activeTab === 'textmode' ? 'active' : ''}`}
            onClick={() => setActiveTab('textmode')}
          >
            📄 Text Mode
          </button>
          <button 
            className={`tab-btn ${activeTab === 'notes' ? 'active' : ''}`}
            onClick={() => setActiveTab('notes')}
          >
            AI Notes
          </button>
          <button 
            className={`tab-btn ${activeTab === 'chat' ? 'active' : ''}`}
            onClick={() => setActiveTab('chat')}
          >
            Chat
          </button>
          <button 
            className={`tab-btn ${activeTab === 'transcript' ? 'active' : ''}`}
            onClick={() => setActiveTab('transcript')}
          >
            Transcript
          </button>
          <button 
            className={`tab-btn ${activeTab === 'quiz' ? 'active' : ''}`}
            onClick={() => setActiveTab('quiz')}
          >
            Quiz
          </button>
          <button 
            className={`tab-btn ${activeTab === 'flashcards' ? 'active' : ''}`}
            onClick={() => setActiveTab('flashcards')}
          >
            Flashcards
          </button>
        </div>
      </div>

      <div className="viewer-body">
        {activeTab === 'transcript' && (
          <TranscriptView 
            transcript={lecture.transcript}
            mediaUrl={lecture.mediaUrl}
            mediaType={lecture.mediaType}
            isPlaying={isPlaying}
            setIsPlaying={setIsPlaying}
            currentTime={currentTime}
            setCurrentTime={setCurrentTime}
          />
        )}
        {activeTab === 'notes' && (
          <NotesView 
            summary={lecture.summary}
            lectureTitle={lecture.title}
            onSave={handleUpdateNotes}
          />
        )}
        {activeTab === 'chat' && (
          <ChatInterface 
            lecture={lecture}
            onSeekTo={handleSeekAndSwitch}
          />
        )}
        {activeTab === 'quiz' && (
          <QuizGenerator 
            quizzes={lecture.quizzes}
          />
        )}
        {activeTab === 'flashcards' && (
          <FlashcardDeck 
            flashcards={lecture.flashcards}
          />
        )}
        {activeTab === 'textmode' && (
          <TextModeView lecture={lecture} />
        )}
      </div>
    </div>
  );
}
