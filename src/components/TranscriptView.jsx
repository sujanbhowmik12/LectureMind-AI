import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Search, FileAudio, Globe } from 'lucide-react';

export default function TranscriptView({ 
  transcript, 
  mediaUrl,
  mediaType,
  isPlaying, 
  setIsPlaying, 
  currentTime, 
  setCurrentTime 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const mediaRef = useRef(null);
  const duration = transcript.length > 0 ? transcript[transcript.length - 1].end : 60;

  const getYouTubeId = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const ytId = getYouTubeId(mediaUrl);

  // Sync isPlaying state down to DOM media node / iframe
  useEffect(() => {
    if (ytId && mediaRef.current) {
      const iframe = mediaRef.current;
      if (isPlaying) {
        iframe.contentWindow?.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
      } else {
        iframe.contentWindow?.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
      }
    } else if (mediaRef.current && mediaUrl) {
      if (isPlaying) {
        mediaRef.current.play().catch(() => {});
      } else {
        mediaRef.current.pause();
      }
    }
  }, [isPlaying, mediaUrl, ytId]);

  // Sync currentTime down to DOM media node / iframe
  useEffect(() => {
    if (ytId && mediaRef.current) {
      const iframe = mediaRef.current;
      iframe.contentWindow?.postMessage(JSON.stringify({
        event: 'command',
        func: 'seekTo',
        args: [currentTime, true]
      }), '*');
    } else if (mediaRef.current && mediaUrl) {
      if (Math.abs(mediaRef.current.currentTime - currentTime) > 1.2) {
        mediaRef.current.currentTime = currentTime;
      }
    }
  }, [currentTime, mediaUrl, ytId]);

  // YouTube bidirectional message listener
  useEffect(() => {
    if (!ytId) return;
    const handleYTMessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.event === 'infoDelivery' && data.info) {
          if (typeof data.info.currentTime === 'number') {
            setCurrentTime(data.info.currentTime);
          }
          if (typeof data.info.playerState === 'number') {
            if (data.info.playerState === 1) setIsPlaying(true);
            if (data.info.playerState === 2) setIsPlaying(false);
          }
        }
      } catch (e) {}
    };
    window.addEventListener('message', handleYTMessage);
    return () => window.removeEventListener('message', handleYTMessage);
  }, [ytId, setCurrentTime, setIsPlaying]);

  const handleWordClick = (start) => {
    setCurrentTime(start);
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = Math.floor(secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = (e) => {
    setCurrentTime(e.target.currentTime);
  };

  const handlePlay = () => setIsPlaying(true);
  const handlePause = () => setIsPlaying(false);

  return (
    <div className="transcript-wrapper">
      {/* Hidden/visible media element synchronization (only for standard hidden audio) */}
      {mediaType === 'audio' && mediaUrl && !mediaUrl.startsWith('http') && (
        <audio 
          ref={mediaRef}
          src={mediaUrl}
          onTimeUpdate={handleTimeUpdate}
          onPlay={handlePlay}
          onPause={handlePause}
          style={{ display: 'none' }}
        />
      )}

      <div 
        className={`transcript-split-layout ${((mediaType === 'video' || mediaType === 'audio' || mediaType === 'web') && mediaUrl) ? 'has-media' : ''}`}
      >
        {mediaType === 'audio' && mediaUrl && mediaUrl.startsWith('http') && (
          <div 
            style={{ 
              background: 'var(--bg-card)', 
              borderRadius: '16px', 
              padding: '2rem', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center',
              border: '1px solid var(--border-color)',
              position: 'relative',
              height: 'fit-content',
              gap: '1.5rem',
              textAlign: 'center'
            }}
          >
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '20px',
              background: 'var(--accent-gradient)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 15px var(--accent-glow)'
            }}>
              <FileAudio size={32} />
            </div>
            <div>
              <h4 style={{ fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>Audio Lecture Player</h4>
              <p className="text-secondary" style={{ fontSize: '0.8rem' }}>Interactive read-along sync enabled</p>
            </div>
            <audio 
              ref={mediaRef}
              src={mediaUrl}
              controls
              onTimeUpdate={handleTimeUpdate}
              onPlay={handlePlay}
              onPause={handlePause}
              style={{ width: '100%', borderRadius: '12px' }}
            />
          </div>
        )}

        {mediaType === 'web' && mediaUrl && (
          <div 
            style={{ 
              background: 'var(--bg-card)', 
              borderRadius: '16px', 
              padding: '2rem', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center',
              border: '1px solid var(--border-color)',
              position: 'relative',
              height: 'fit-content',
              gap: '1.5rem',
              textAlign: 'center'
            }}
          >
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 15px rgba(16, 185, 129, 0.2)'
            }}>
              <Globe size={32} />
            </div>
            <div>
              <h4 style={{ fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>Parsed Web Article</h4>
              <p className="text-secondary" style={{ fontSize: '0.8rem', wordBreak: 'break-word', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                {mediaUrl}
              </p>
            </div>
            <button
              className="btn-premium"
              style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
              onClick={() => window.open(mediaUrl, '_blank')}
            >
              Open Original Link
            </button>
          </div>
        )}

        {mediaType === 'video' && mediaUrl && (
          <div 
            style={{ 
              background: '#000', 
              borderRadius: '16px', 
              overflow: 'hidden', 
              display: 'flex', 
              alignItems: 'center', 
              border: '1px solid var(--border-color)',
              position: 'relative',
              height: 'fit-content',
              aspectRatio: '16/9'
            }}
          >
            {ytId ? (
              <iframe
                ref={mediaRef}
                src={`https://www.youtube.com/embed/${ytId}?enablejsapi=1&origin=${window.location.origin}`}
                style={{ width: '100%', height: '100%', border: 'none', aspectRatio: '16/9' }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <video 
                ref={mediaRef}
                src={mediaUrl}
                style={{ width: '100%', height: 'auto', display: 'block' }}
                onTimeUpdate={handleTimeUpdate}
                onPlay={handlePlay}
                onPause={handlePause}
                controls
              />
            )}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflow: 'hidden' }}>
          <div className="header-search" style={{ width: '100%', maxWidth: '400px' }}>
            <Search size={16} className="text-muted" />
            <input 
              type="text" 
              placeholder="Search transcript..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="transcript-content">
            {transcript.map((seg, idx) => {
              const isActive = currentTime >= seg.start && currentTime <= seg.end;
              const matchesSearch = searchTerm && seg.text.toLowerCase().includes(searchTerm.toLowerCase());
              
              return (
                <span 
                  key={idx}
                  className={`word-segment ${isActive ? 'active' : ''}`}
                  style={{ 
                    backgroundColor: matchesSearch ? 'rgba(245, 158, 11, 0.3)' : '',
                    borderBottom: matchesSearch ? '2px solid var(--warning)' : ''
                  }}
                  onClick={() => handleWordClick(seg.start)}
                  title={`Jump to ${formatTime(seg.start)}`}
                >
                  {seg.text}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      <div className="audio-bar">
        <button className="btn-icon" onClick={togglePlay} title={isPlaying ? "Pause" : "Play"}>
          {isPlaying ? <Pause size={18} /> : <Play size={18} />}
        </button>

        <div className="text-secondary" style={{ fontVariantNumeric: 'tabular-nums', minWidth: '100px' }}>
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>

        <div 
          style={{ 
            flex: 1, 
            height: '6px', 
            background: 'var(--border-color)', 
            borderRadius: '99px',
            position: 'relative',
            cursor: 'pointer'
          }}
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const percentage = clickX / rect.width;
            setCurrentTime(percentage * duration);
          }}
        >
          <div 
            style={{ 
              width: `${(currentTime / duration) * 100}%`, 
              height: '100%', 
              background: 'var(--accent-gradient)', 
              borderRadius: '99px' 
            }}
          ></div>
        </div>
      </div>
    </div>
  );
}
