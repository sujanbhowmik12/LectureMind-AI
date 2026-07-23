import React, { useState, useRef, useEffect } from 'react';
import { Upload, Mic, Square, Sparkles, Loader2, FileAudio } from 'lucide-react';
import { generateSpeechToText, generateAIContent } from '../utils/ai';

export default function AudioRecorder({ onLectureAdded }) {
  const [isRecording, setIsRecording] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [status, setStatus] = useState(''); // 'recording', 'transcribing', 'generating-ai', ''
  const [progressText, setProgressText] = useState('');
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);

  // Clean up canvas animations on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Visualizer drawing logic
  const startVisualizer = (stream) => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = audioCtx.createAnalyser();
      const source = audioCtx.createMediaStreamSource(stream);
      
      source.connect(analyser);
      analyser.fftSize = 256;
      
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      audioContextRef.current = audioCtx;
      analyserRef.current = analyser;
      
      const draw = () => {
        if (!canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        
        analyser.getByteFrequencyData(dataArray);
        
        ctx.fillStyle = 'rgba(10, 6, 22, 0.4)';
        ctx.fillRect(0, 0, width, height);
        
        const barWidth = (width / bufferLength) * 2.5;
        let barHeight;
        let x = 0;
        
        for (let i = 0; i < bufferLength; i++) {
          barHeight = dataArray[i] / 2;
          
          // Premium purple-blue gradient visualizer
          const grad = ctx.createLinearGradient(0, height, 0, 0);
          grad.addColorStop(0, '#3b82f6');
          grad.addColorStop(1, '#a855f7');
          
          ctx.fillStyle = grad;
          ctx.fillRect(x, height - barHeight, barWidth - 2, barHeight);
          
          x += barWidth;
        }
        
        animationFrameRef.current = requestAnimationFrame(draw);
      };
      
      draw();
    } catch (e) {
      console.warn("Visualizer error: ", e);
    }
  };

  const startRecording = async () => {
    try {
      audioChunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        stream.getTracks().forEach(track => track.stop());
        await processAudio(audioBlob, "Recorded Lecture");
      };

      mediaRecorder.start();
      setIsRecording(true);
      setStatus('recording');
      startVisualizer(stream);
    } catch (e) {
      alert("Microphone access is required to record lectures.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    }
  };

  const processAudio = async (blob, name) => {
    try {
      setStatus('transcribing');
      setProgressText('Converting speech to text via Whisper Engine...');
      const transcript = await generateSpeechToText({ name, blob });

      setStatus('generating-ai');
      setProgressText('Generating notes, quizzes, and extracting milestones...');
      const aiData = await generateAIContent(transcript, name);

      const durationMins = Math.floor(Math.random() * 5) + 1;
      const durationSecs = Math.floor(Math.random() * 60);
      const durationFormatted = `${durationMins.toString().padStart(2, '0')}:${durationSecs.toString().padStart(2, '0')}`;

      const mediaType = blob.type?.startsWith('video/') ? 'video' : 'audio';
      const mediaUrl = URL.createObjectURL(blob);

      // Assemble full lecture
      const newLec = {
        title: name,
        duration: durationFormatted,
        mediaUrl,
        mediaType,
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

      onLectureAdded(newLec);
      setStatus('');
    } catch (e) {
      console.error(e);
      alert("Failed to process audio content. Make sure API key is correct or fallback mode is enabled.");
      setStatus('');
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('audio/') || file.type.startsWith('video/')) {
        await processAudio(file, file.name.split('.')[0]);
      } else {
        alert("Please upload valid audio or video files only.");
      }
    }
  };

  const handleFileChange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      await processAudio(file, file.name.split('.')[0]);
    }
  };

  if (status === 'transcribing' || status === 'generating-ai') {
    return (
      <div className="audio-recorder-container" style={{ minHeight: '300px', justifyContent: 'center' }}>
        <Loader2 className="pulse-record" size={48} style={{ color: 'var(--accent-primary)' }} />
        <h3 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Sparkles size={20} style={{ color: 'var(--warning)' }} />
          Processing Lecture...
        </h3>
        <p className="text-secondary">{progressText}</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div className="audio-recorder-container">
        <h2>Live Audio Recording</h2>
        <p className="text-secondary" style={{ textAlign: 'center', maxWidth: '400px' }}>
          Record your in-person lecture or meeting directly. We will convert it to notes and quizzes instantly.
        </p>

        {isRecording && (
          <canvas ref={canvasRef} className="visualizer-canvas" width={400} height={80}></canvas>
        )}

        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
          {!isRecording ? (
            <button className="btn-premium" onClick={startRecording}>
              <Mic size={18} />
              Start Recording
            </button>
          ) : (
            <button className="btn-premium" style={{ background: 'var(--danger)', boxShadow: '0 4px 15px rgba(239,68,68,0.3)' }} onClick={stopRecording}>
              <Square size={18} />
              Stop & Process
            </button>
          )}
        </div>
      </div>

      <div 
        className={`upload-panel ${dragActive ? 'dragging' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input 
          type="file" 
          id="audio-upload-input" 
          accept="audio/*,video/*" 
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
        <label htmlFor="audio-upload-input" style={{ cursor: 'pointer' }}>
          <div className="upload-icon">
            <Upload size={48} />
          </div>
          <h3>Upload Lecture Files</h3>
          <p className="text-secondary" style={{ margin: '0.75rem 0' }}>
            Drag and drop your audio or video file here, or click to browse
          </p>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Supports MP3, WAV, M4A, MP4 (Max 50MB)
          </span>
        </label>
      </div>
    </div>
  );
}
