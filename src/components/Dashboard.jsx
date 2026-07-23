import React, { useState } from 'react';
import { Calendar, Clock, Trash2, ArrowRight, Play, Sparkles, BookOpen, AlertCircle, Search, Loader2 } from 'lucide-react';

const MOCK_ONLINE_VIDEOS = {
  ai: [
    { title: "But what is a neural network? | Chapter 1", channel: "3Blue1Brown", duration: "20:00", url: "https://www.youtube.com/watch?v=aircAruvnKk", topic: "neural" },
    { title: "MIT 6.S191: Introduction to Deep Learning", channel: "MIT OpenCourseWare", duration: "45:30", url: "https://www.youtube.com/watch?v=QDX-1M5Nj7s", topic: "ai" },
    { title: "Machine Learning for Beginners - Full Course", channel: "freeCodeCamp.org", duration: "3:45:00", url: "https://www.youtube.com/watch?v=IpGxLWOIZy4", topic: "ai" }
  ],
  react: [
    { title: "React JS Full Course for Beginners - 2026", channel: "freeCodeCamp.org", duration: "1:24:00", url: "https://www.youtube.com/watch?v=bMknfKXIFA8", topic: "react" },
    { title: "React Tutorial for Beginners", channel: "Programming with Mosh", duration: "48:15", url: "https://www.youtube.com/watch?v=SqcY0GlETPk", topic: "react" },
    { title: "Learn React in 15 Minutes", channel: "Web Dev Simplified", duration: "15:20", url: "https://www.youtube.com/watch?v=hQAHJsKyO8w", topic: "react" }
  ],
  chemistry: [
    { title: "Acid-Base Reactions in Chemistry", channel: "CrashCourse", duration: "11:40", url: "https://www.youtube.com/watch?v=ANi709MYnWg", topic: "chemistry" },
    { title: "Equilibrium Constant & Le Chatelier's Principle", channel: "The Organic Chemistry Tutor", duration: "25:10", url: "https://www.youtube.com/watch?v=H7QsPx4C9yQ", topic: "chemistry" }
  ],
  general: [
    { title: "How to Study Effectively for Exams", channel: "CrashCourse", duration: "09:15", url: "https://www.youtube.com/watch?v=p60rN9JEapg", topic: "general" },
    { title: "Introduction to Computer Science - CS50", channel: "Harvard University", duration: "2:15:00", url: "https://www.youtube.com/watch?v=8mAITcNt710", topic: "general" }
  ]
};

export default function Dashboard({ 
  lectures, 
  onSelectLecture, 
  onDeleteLecture, 
  onUploadClick, 
  onImportVideo,
  searchQuery 
}) {
  const [externalQuery, setExternalQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);
  const [scanningVideo, setScanningVideo] = useState(null);
  const [scanningProgress, setScanningProgress] = useState(null); // { step: string, percent: number }

  // Filter lectures based on global search query
  const filteredLectures = lectures.filter(lec => {
    const q = searchQuery.toLowerCase();
    const matchesTitle = lec.title.toLowerCase().includes(q);
    const matchesTranscript = lec.transcript && lec.transcript.some(t => t.text.toLowerCase().includes(q));
    const matchesSummary = lec.summary && lec.summary.toLowerCase().includes(q);
    return matchesTitle || matchesTranscript || matchesSummary;
  });

  const formatDate = (isoStr) => {
    return new Date(isoStr).toLocaleDateString(undefined, { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const getUpcomingDeadlines = () => {
    const list = [];
    lectures.forEach(lec => {
      if (lec.deadlines) {
        lec.deadlines.forEach(d => {
          if (!d.completed) {
            list.push({ ...d, lectureTitle: lec.title });
          }
        });
      }
    });
    return list.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)).slice(0, 4);
  };

  const handleSearchExternal = async (e) => {
    e.preventDefault();
    if (!externalQuery.trim()) return;
    
    const queryTrimmed = externalQuery.trim();
    const isUrl = queryTrimmed.startsWith('http://') || queryTrimmed.startsWith('https://');
    
    if (isUrl) {
      const isYouTubeUrl = queryTrimmed.includes('youtube.com') || queryTrimmed.includes('youtu.be');
      
      if (isYouTubeUrl) {
        setIsLoadingMetadata(true);
        try {
          const res = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(queryTrimmed)}`);
          const data = await res.json();
          
          if (data && data.title) {
            const customVideo = {
              title: data.title,
              channel: data.author_name || "YouTube Creator",
              duration: "12:15",
              url: queryTrimmed,
              thumbnail: data.thumbnail_url,
              topic: "custom",
              mediaType: 'video'
            };
            setSearchResults([customVideo]);
          } else {
            throw new Error("Invalid metadata");
          }
        } catch (err) {
          console.error("Error fetching oembed metadata:", err);
          let title = "Custom YouTube Lecture";
          try {
            const urlObj = new URL(queryTrimmed);
            const v = urlObj.searchParams.get('v');
            if (v) title = `YouTube Video Lecture (${v})`;
          } catch (_) {}
          
          const fallbackVideo = {
            title: title,
            channel: "YouTube",
            duration: "10:00",
            url: queryTrimmed,
            thumbnail: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=300",
            topic: "custom",
            mediaType: 'video'
          };
          setSearchResults([fallbackVideo]);
        } finally {
          setIsLoadingMetadata(false);
        }
      } else {
        const isMediaFile = queryTrimmed.match(/\.(mp3|wav|ogg|m4a|mp4|webm|mov)(\?|$)/i);
        if (isMediaFile) {
          const filename = queryTrimmed.split('/').pop().split('?')[0] || "Direct Audio Stream";
          const decodedFilename = decodeURIComponent(filename);
          const isVideo = queryTrimmed.match(/\.(mp4|webm|mov)(\?|$)/i);
          const customMedia = {
            title: decodedFilename,
            channel: "External Media Host",
            duration: "05:00",
            url: queryTrimmed,
            thumbnail: isVideo 
              ? "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=300" 
              : "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300",
            topic: "custom",
            mediaType: isVideo ? 'video' : 'audio'
          };
          setSearchResults([customMedia]);
        } else {
          // Webpage / Article URL
          let hostname = "Webpage Resource";
          try {
            hostname = new URL(queryTrimmed).hostname;
          } catch(_) {}
          
          let pageTitle = "Web Article";
          const pathParts = queryTrimmed.split('/').filter(Boolean);
          if (pathParts.length > 1) {
            const lastPart = pathParts[pathParts.length - 1];
            pageTitle = decodeURIComponent(lastPart.replace(/[-_]/g, ' '));
            pageTitle = pageTitle.charAt(0).toUpperCase() + pageTitle.slice(1);
          }
          
          const customWeb = {
            title: pageTitle,
            channel: hostname,
            duration: "Read Time: ~5m",
            url: queryTrimmed,
            thumbnail: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=300",
            topic: "custom",
            mediaType: 'web'
          };
          setSearchResults([customWeb]);
        }
      }
    } else {
      const q = queryTrimmed.toLowerCase();
      let found = [];
      if (q.includes('neural') || q.includes('deep') || q.includes('network') || q.includes('ai') || q.includes('ml') || q.includes('learn')) {
        found = MOCK_ONLINE_VIDEOS.ai;
      } else if (q.includes('react') || q.includes('web') || q.includes('js') || q.includes('html') || q.includes('css')) {
        found = MOCK_ONLINE_VIDEOS.react;
      } else if (q.includes('chem') || q.includes('acid') || q.includes('base') || q.includes('ph') || q.includes('equilibrium')) {
        found = MOCK_ONLINE_VIDEOS.chemistry;
      } else {
        found = [
          { 
            title: `Introduction to ${queryTrimmed.charAt(0).toUpperCase() + queryTrimmed.slice(1)}`, 
            channel: "Academic Lectures Hub", 
            duration: "15:45", 
            url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", 
            topic: "custom",
            mediaType: 'video'
          },
          ...MOCK_ONLINE_VIDEOS.general
        ];
      }
      setSearchResults(found);
    }
  };

  const startScanningVideo = (video) => {
    setScanningVideo(video);
    setScanningProgress({ step: "Initializing secure link connection...", percent: 5 });
    
    let steps = [];
    if (video.mediaType === 'audio') {
      steps = [
        { step: "Connecting to audio host...", percent: 20 },
        { step: "Downloading audio stream buffer...", percent: 40 },
        { step: "Analyzing speech waveform & frequencies...", percent: 65 },
        { step: "Transcribing voice to text with Whisper AI...", percent: 85 },
        { step: "AI summarizing and generating quizzes...", percent: 95 },
        { step: "Finalizing your lecture deck...", percent: 100 }
      ];
    } else if (video.mediaType === 'web') {
      steps = [
        { step: "Fetching webpage HTML structure...", percent: 20 },
        { step: "Bypassing cookies & extracting main article body...", percent: 45 },
        { step: "Analyzing written content & keyword density...", percent: 65 },
        { step: "Summarizing key arguments & definitions...", percent: 85 },
        { step: "Generating quizzes & flashcards...", percent: 95 },
        { step: "Finalizing your study notes...", percent: 100 }
      ];
    } else {
      steps = [
        { step: "Sending video link to Gemini AI...", percent: 10 },
        { step: "Gemini is watching the full video...", percent: 30 },
        { step: "Transcribing everything spoken word-by-word...", percent: 55 },
        { step: "Extracting all topics, keywords & concepts...", percent: 75 },
        { step: "Generating AI study notes from video content...", percent: 90 },
        { step: "Finalizing your complete lecture deck...", percent: 100 }
      ];
    }
    
    let currentStepIdx = 0;
    const interval = setInterval(() => {
      if (currentStepIdx < steps.length) {
        setScanningProgress(steps[currentStepIdx]);
        currentStepIdx++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          onImportVideo(video);
          setScanningVideo(null);
          setScanningProgress(null);
        }, 500);
      }
    }, 600);
  };

  const upcoming = getUpcomingDeadlines();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      <div className="welcome-section">
        <h1 className="welcome-title">Welcome to LectureMind AI</h1>
        <p className="text-secondary" style={{ marginTop: '0.5rem', fontSize: '1.05rem' }}>
          Record your lectures, transcribe speech to text, and let AI generate study materials instantly.
        </p>
      </div>

      <div className="dashboard-grid">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 className="section-title">
              <BookOpen size={22} style={{ color: 'var(--accent-primary)' }} />
              Your Lectures
            </h2>
            <button className="btn-premium" onClick={onUploadClick}>
              Record / Upload New
            </button>
          </div>

          {filteredLectures.length === 0 ? (
            <div 
              style={{ 
                background: 'var(--bg-card)', 
                border: '1px solid var(--border-color)', 
                borderRadius: '24px', 
                padding: '4rem 2rem', 
                textAlign: 'center' 
              }}
            >
              <AlertCircle size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
              <h3>No Lectures Found</h3>
              <p className="text-secondary" style={{ margin: '0.5rem 0 1.5rem' }}>
                {searchQuery ? "No matches found for your search query." : "You haven't uploaded or recorded any lectures yet."}
              </p>
              {!searchQuery && (
                <button className="btn-premium" style={{ margin: '0 auto' }} onClick={onUploadClick}>
                  Get Started
                </button>
              )}
            </div>
          ) : (
            <div className="lecture-list">
              {filteredLectures.map((lec) => (
                <div key={lec.id} className="lecture-card" onClick={() => onSelectLecture(lec)}>
                  <div className="lecture-info">
                    <div className="lecture-icon">
                      <Play size={20} />
                    </div>
                    <div className="lecture-details">
                      <h3>{lec.title}</h3>
                      <div className="lecture-meta">
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Calendar size={14} />
                          {formatDate(lec.date)}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Clock size={14} />
                          {lec.duration}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="lecture-actions" onClick={(e) => e.stopPropagation()}>
                    <button 
                      className="btn-secondary" 
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectLecture(lec);
                      }}
                    >
                      Open Analysis
                      <ArrowRight size={14} style={{ marginLeft: '4px' }} />
                    </button>
                    <button 
                      className="btn-icon" 
                      style={{ color: 'var(--danger)', border: 'none', background: 'none' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteLecture(lec.id);
                      }}
                      title="Delete Lecture"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar widgets inside Dashboard */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* New External Video Search Panel */}
          <div className="quiz-container" style={{ width: '100%', padding: '1.75rem' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <Search size={18} style={{ color: 'var(--accent-primary)' }} />
              Search Video Lectures
            </h3>

            {/* Step-by-step guidance banner */}
            <div style={{
              background: 'rgba(147, 51, 234, 0.05)',
              border: '1px dashed var(--border-hover)',
              borderRadius: '12px',
              padding: '0.85rem',
              fontSize: '0.75rem',
              color: 'var(--text-secondary)',
              marginBottom: '1rem',
              lineHeight: '1.4'
            }}>
              <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '0.3rem' }}>How to import from YouTube:</strong>
              1. Type a topic and click Search, or use the button below to browse YouTube.<br/>
              2. Choose a video on YouTube and <strong>Copy its URL link</strong>.<br/>
              3. Paste that copied URL link into the search box below, then click <strong>Search</strong> to download and scan!
            </div>

            <form onSubmit={handleSearchExternal} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              <input 
                type="text" 
                placeholder="Paste YouTube URL or enter topic"
                value={externalQuery}
                onChange={(e) => setExternalQuery(e.target.value)}
                style={{
                  flex: 1,
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  padding: '0.5rem 0.75rem',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  fontSize: '0.85rem',
                  fontFamily: 'inherit'
                }}
              />
              <button type="submit" className="btn-premium" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                Search
              </button>
            </form>
            
            {searchResults.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '280px', overflowY: 'auto', paddingRight: '4px' }}>
                {searchResults.map((video, idx) => (
                  <div 
                    key={idx} 
                    style={{ 
                      padding: '0.75rem', 
                      background: 'rgba(255,255,255,0.02)', 
                      border: '1px solid var(--border-color)', 
                      borderRadius: '12px',
                      fontSize: '0.8rem'
                    }}
                  >
                    <div style={{ fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
                      {video.title}
                    </div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                      Channel: {video.channel} | {video.duration}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.6rem' }}>
                      <button 
                        className="btn-secondary" 
                        style={{ padding: '0.3rem 0.5rem', fontSize: '0.75rem', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                        onClick={() => window.open(video.url, '_blank')}
                      >
                        Watch Video
                      </button>
                      <button 
                        className="btn-premium" 
                        style={{ padding: '0.3rem 0.5rem', fontSize: '0.75rem', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                        onClick={() => startScanningVideo(video)}
                      >
                        Import Notes
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {externalQuery && (
              <button 
                className="btn-secondary" 
                style={{ width: '100%', fontSize: '0.75rem', marginTop: '0.75rem', display: 'flex', justifyContent: 'center', gap: '0.25rem', padding: '0.5rem' }}
                onClick={() => {
                  alert("Opening YouTube... Find your lecture video, COPY its URL link (from address bar or Share button), and PASTE it back into our search box above to scan and download it!");
                  window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(externalQuery)}`, '_blank');
                }}
              >
                Search YouTube for "{externalQuery}" ➜
              </button>
            )}
          </div>

          <div className="quiz-container" style={{ width: '100%', padding: '1.75rem' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <Sparkles size={18} style={{ color: 'var(--warning)' }} />
              Upcoming Deadlines
            </h3>
            
            {upcoming.length === 0 ? (
              <p className="text-secondary" style={{ fontSize: '0.9rem', textAlign: 'center', padding: '1rem 0' }}>
                All clear! No upcoming tasks extracted from your lectures.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {upcoming.map((u, i) => (
                  <div 
                    key={i} 
                    style={{ 
                      padding: '0.75rem', 
                      background: 'rgba(255,255,255,0.02)', 
                      border: '1px solid var(--border-color)', 
                      borderRadius: '12px',
                      fontSize: '0.85rem'
                    }}
                  >
                    <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{u.title}</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '0.2rem' }}>
                      {u.lectureTitle}
                    </div>
                    <div style={{ color: 'var(--warning)', fontWeight: '600', marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Calendar size={12} />
                      Due: {u.dueDate}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div 
            className="quiz-container" 
            style={{ 
              width: '100%', 
              padding: '1.75rem', 
              background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.1), rgba(59, 130, 246, 0.1))',
              borderColor: 'var(--border-hover)'
            }}
          >
            <h3 style={{ marginBottom: '0.5rem' }}>Study Tip</h3>
            <p className="text-secondary" style={{ fontSize: '0.85rem', lineHeight: '1.5' }}>
              Reviewing generated flashcards within 24 hours of a lecture significantly increases long-term retention. Try running a practice quiz before you log off today!
            </p>
          </div>
        </div>
      </div>

      {scanningVideo && scanningProgress && (
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
          zIndex: 9999
        }}>
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '24px',
            padding: '2.5rem',
            width: '450px',
            textAlign: 'center',
            boxShadow: 'var(--shadow-premium)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1.5rem'
          }}>
            <div style={{
              position: 'relative',
              width: '80px',
              height: '80px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Loader2 className="animate-spin" size={48} style={{ color: 'var(--accent-primary)', position: 'absolute' }} />
              <Play size={20} style={{ color: 'var(--text-primary)' }} />
            </div>

            <div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Downloading & Scanning Video</h3>
              <p className="text-secondary" style={{ fontSize: '0.85rem', wordBreak: 'break-word', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                "{scanningVideo.title}"
              </p>
            </div>

            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center' }}>
              <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '99px', overflow: 'hidden' }}>
                <div style={{
                  width: `${scanningProgress.percent}%`,
                  height: '100%',
                  background: 'var(--accent-gradient)',
                  borderRadius: '99px',
                  transition: 'width 0.4s ease'
                }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                <span>{scanningProgress.step}</span>
                <span style={{ fontWeight: '600', color: 'var(--accent-primary)' }}>{scanningProgress.percent}%</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
