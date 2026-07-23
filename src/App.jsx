import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import AudioRecorder from './components/AudioRecorder';
import LectureViewer from './components/LectureViewer';
import SettingsModal from './components/SettingsModal';
import AuthView from './components/AuthView';
import BottomNav from './components/BottomNav';
import { getLectures, saveLectures, addLecture, deleteLecture, getSettings, saveSettings } from './utils/db';
import { generateAIContent, transcribeYouTubeWithGemini } from './utils/ai';
import { auth } from './utils/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { Loader2, Trash2 } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'record'
  const [selectedLecture, setSelectedLecture] = useState(null);
  const [lectures, setLectures] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [theme, setTheme] = useState('dark');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [lectureToDelete, setLectureToDelete] = useState(null);

  // Listen to Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Load lectures and settings
  useEffect(() => {
    setLectures(getLectures());
    const config = getSettings();
    setTheme(config.theme || 'dark');
    document.documentElement.setAttribute('data-theme', config.theme || 'dark');
  }, []);

  // Theme switcher helper
  const handleToggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    const config = getSettings();
    saveSettings({ ...config, theme: nextTheme });
  };

  const handleSelectLecture = (lecture) => {
    setSelectedLecture(lecture);
  };

  const handleDeleteLecture = (id) => {
    setLectureToDelete(id);
  };

  const confirmDeleteLecture = () => {
    if (lectureToDelete) {
      deleteLecture(lectureToDelete);
      setLectures(getLectures());
      if (selectedLecture && selectedLecture.id === lectureToDelete) {
        setSelectedLecture(null);
      }
      setLectureToDelete(null);
    }
  };

  const handleAddLecture = (newLec) => {
    const saved = addLecture(newLec);
    setLectures(getLectures());
    setSelectedLecture(saved);
    setActiveTab('dashboard'); // Redirect to dashboard or view it
  };

  const handleUpdateLecture = (updatedLec) => {
    const list = lectures.map(l => l.id === updatedLec.id ? updatedLec : l);
    saveLectures(list);
    setLectures(list);
    setSelectedLecture(updatedLec);
  };

  const handleImportVideo = async (video) => {
    let transcript = [];
    const isYouTube = video.url && (video.url.includes('youtube.com') || video.url.includes('youtu.be'));

    // ── STEP 1: Try Gemini AI video analysis (primary — watches the full video) ──
    if (isYouTube) {
      try {
        console.log('[LectureMind] Sending video to Gemini for full transcription...');
        transcript = await transcribeYouTubeWithGemini(video.url);
        console.log(`[LectureMind] Gemini transcribed ${transcript.length} segments from the video`);
      } catch (geminiErr) {
        console.warn('[LectureMind] Gemini transcription failed, trying YouTube captions:', geminiErr.message);
      }
    }

    // ── STEP 2: Fallback — try YouTube's captions/subtitle API ──
    if (transcript.length === 0 && isYouTube) {
      try {
        let videoId = null;
        try {
          const urlObj = new URL(video.url);
          videoId = urlObj.searchParams.get('v') || urlObj.pathname.split('/').pop();
        } catch (_) {}

        if (videoId) {
          const langs = ['en', 'en-US', 'en-GB', 'hi', 'a.en'];
          let captionData = null;
          for (const lang of langs) {
            try {
              const captionUrl = `https://www.youtube.com/api/timedtext?v=${videoId}&lang=${lang}&fmt=json3`;
              const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(captionUrl)}`;
              const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(8000) });
              if (res.ok) {
                const data = await res.json();
                if (data?.events?.length > 0) { captionData = data; break; }
              }
            } catch (_) {}
          }
          if (captionData) {
            const raw = captionData.events
              .filter(e => e.segs?.length > 0)
              .map(e => ({
                start: Math.floor(e.tStartMs / 1000),
                end: Math.floor((e.tStartMs + (e.dDurationMs || 3000)) / 1000),
                text: e.segs.map(s => (s.utf8 || '').replace(/\n/g, ' ')).join('').trim()
              }))
              .filter(t => t.text.length > 1);
            // Merge short segments
            const merged = [];
            for (const seg of raw) {
              if (merged.length > 0 && merged[merged.length-1].end >= seg.start && merged[merged.length-1].text.length < 90) {
                merged[merged.length-1].text += ' ' + seg.text;
                merged[merged.length-1].end = seg.end;
              } else { merged.push({...seg}); }
            }
            transcript = merged;
            console.log(`[LectureMind] YouTube captions fetched: ${transcript.length} segments`);
          }
        }
      } catch (capErr) {
        console.warn('[LectureMind] YouTube caption fetch failed:', capErr.message);
      }
    }

    // ── STEP 3: Last resort — minimal placeholder transcript ──
    if (transcript.length === 0) {
      const topicName = video.title.replace(/chapter:\s*\d+|hindi|tutorial|course|basics|lecture/gi, '').trim();
      transcript = [
        { start: 0, end: 10, text: `This is a lecture on "${topicName}". No transcript could be automatically extracted.` },
        { start: 10, end: 20, text: `To get a full transcript, please add a Gemini API key in Settings and re-import this video.` }
      ];
    }

    try {
      const aiData = await generateAIContent(transcript, video.title);
      const newLec = {
        title: video.title,
        duration: video.duration,
        mediaUrl: video.url,
        mediaType: video.mediaType || 'video',
        transcript,
        summary: aiData.summary,
        quizzes: aiData.quizzes,
        flashcards: aiData.flashcards,
        deadlines: aiData.deadlines.map((d, index) => ({
          ...d,
          id: `dl_${Date.now()}_${index}`,
          completed: false
        }))
      };
      handleAddLecture(newLec);
    } catch (e) {
      console.error(e);
      alert('Failed to import notes for this video. Please check your API key in Settings.');
    }
  };


  const handleResetDb = () => {
    if (confirm("This will clear all lecture entries and reset back to defaults. Continue?")) {
      localStorage.removeItem('lecturemind_data');
      localStorage.removeItem('lecturemind_settings');
      setLectures(getLectures());
      setSelectedLecture(null);
      setIsSettingsOpen(false);
      alert("Database reset successfully.");
    }
  };

  if (authLoading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        width: '100vw',
        background: 'var(--bg-primary)',
        color: 'var(--text-primary)'
      }}>
        <Loader2 className="animate-spin" size={48} style={{ color: 'var(--accent-primary)' }} />
      </div>
    );
  }

  if (!user) {
    return <AuthView />;
  }

  return (
    <div className="app-container">
      {/* Mobile Drawer Overlay Backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="sidebar-overlay" 
          onClick={() => setIsMobileMenuOpen(false)} 
        />
      )}

      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setSelectedLecture(null); // Clear selected lecture when navigating
          setIsMobileMenuOpen(false); // Close mobile drawer on navigation
        }}
        lectures={lectures}
        onOpenSettings={() => {
          setIsSettingsOpen(true);
          setIsMobileMenuOpen(false);
        }}
        user={user}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      <div className="main-content">
        <Header 
          searchQuery={searchQuery} 
          setSearchQuery={setSearchQuery} 
          theme={theme}
          toggleTheme={handleToggleTheme}
          user={user}
          onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        />

        <main className="scroll-area">
          {selectedLecture ? (
            <LectureViewer 
              lecture={selectedLecture}
              onBack={() => setSelectedLecture(null)}
              onUpdateLecture={handleUpdateLecture}
            />
          ) : activeTab === 'dashboard' ? (
            <Dashboard 
              lectures={lectures}
              searchQuery={searchQuery}
              onSelectLecture={handleSelectLecture}
              onDeleteLecture={handleDeleteLecture}
              onUploadClick={() => setActiveTab('record')}
              onImportVideo={handleImportVideo}
            />
          ) : (
            <AudioRecorder 
              onLectureAdded={handleAddLecture}
            />
          )}
        </main>
      </div>

      <BottomNav 
        activeTab={activeTab} 
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setSelectedLecture(null);
        }} 
        onOpenSettings={() => setIsSettingsOpen(true)} 
      />

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)}
        onResetDb={handleResetDb}
      />

      {lectureToDelete && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(10, 6, 22, 0.8)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999
        }}>
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '24px',
            padding: '2.5rem',
            width: '420px',
            textAlign: 'center',
            boxShadow: 'var(--shadow-premium)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
            alignItems: 'center'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'rgba(239, 68, 68, 0.1)',
              color: 'var(--danger)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Trash2 size={28} />
            </div>

            <div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Delete Lecture?</h3>
              <p className="text-secondary" style={{ fontSize: '0.85rem', lineHeight: '1.4' }}>
                Are you sure you want to delete this lecture? This action will permanently remove all generated transcripts, summaries, flashcards, and quizzes.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', width: '100%', marginTop: '0.5rem' }}>
              <button 
                className="btn-secondary" 
                onClick={() => setLectureToDelete(null)}
                style={{ flex: 1, padding: '0.75rem', fontSize: '0.9rem', display: 'flex', justifyContent: 'center' }}
              >
                Cancel
              </button>
              <button 
                className="btn-premium" 
                onClick={confirmDeleteLecture}
                style={{ 
                  flex: 1, 
                  padding: '0.75rem', 
                  fontSize: '0.9rem', 
                  background: 'var(--danger)', 
                  boxShadow: '0 4px 15px rgba(239, 68, 68, 0.2)',
                  color: '#fff',
                  border: 'none',
                  display: 'flex', 
                  justifyContent: 'center'
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
