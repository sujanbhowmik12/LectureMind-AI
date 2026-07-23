import React, { useState, useRef, useEffect } from 'react';
import { Send, Clock, Sparkles } from 'lucide-react';
import { chatWithLecture } from '../utils/ai';

export default function ChatInterface({ lecture, onSeekTo }) {
  const [messages, setMessages] = useState([
    {
      role: 'ai',
      content: `Hello! I have fully processed "${lecture.title}". Ask me any questions about the concepts, terms, or deadlines mentioned in this lecture.`
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const submitQuestion = async (questionText) => {
    if (loading) return;
    setMessages(prev => [...prev, { role: 'user', content: questionText }]);
    setLoading(true);
    try {
      const response = await chatWithLecture(questionText, lecture.transcript, lecture.title);
      setMessages(prev => [
        ...prev, 
        { 
          role: 'ai', 
          content: response.answer, 
          reference: response.reference 
        }
      ]);
    } catch (e) {
      setMessages(prev => [
        ...prev, 
        { role: 'ai', content: "Sorry, I had trouble processing that question. Please try again." }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    await submitQuestion(userMessage);
  };

  const parseMessageContent = (content) => {
    // Look for timestamp matches like [01:23]
    const parts = content.split(/(\[\d{2}:\d{2}\])/g);
    return parts.map((part, index) => {
      const match = part.match(/^\[(\d{2}):(\d{2})\]$/);
      if (match) {
        const mins = parseInt(match[1], 10);
        const secs = parseInt(match[2], 10);
        const totalSecs = mins * 60 + secs;
        return (
          <button 
            key={index}
            className="timestamp-ref" 
            onClick={() => onSeekTo(totalSecs)}
            title={`Jump to ${part} in transcript`}
          >
            <Clock size={12} />
            {part}
          </button>
        );
      }
      return part;
    });
  };

  const suggestedQuestions = [
    { label: "🗣️ Verbal Spoken Notes", text: "What was verbally said in this video? (Spoken notes)" },
    { label: "❓ Expected Exam Questions", text: "What are the expected exam questions for this video?" },
    { label: "🎨 Notebook Diagram Guide", text: "Can you show me the diagram/sketch guide for this video?" },
    { label: "🧮 Exam Formulas & Cheat Sheet", text: "What are the formulas and cheat sheets for this video?" }
  ];

  return (
    <div className="chat-panel">
      <div className="chat-messages">
        {messages.map((msg, idx) => (
          <div key={idx} className={`message-bubble ${msg.role}`}>
            <div style={{ whiteSpace: 'pre-wrap' }}>
              {parseMessageContent(msg.content)}
            </div>
            {msg.reference !== null && msg.reference !== undefined && (
              <div style={{ marginTop: '0.5rem' }}>
                <button 
                  className="timestamp-ref" 
                  onClick={() => onSeekTo(msg.reference)}
                >
                  <Clock size={12} />
                  Jump to topic
                </button>
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="message-bubble ai" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={16} className="pulse-record" style={{ color: 'var(--accent-primary)' }} />
            Thinking...
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="suggested-questions" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.01)', borderTop: '1px solid var(--border-color)' }}>
        {suggestedQuestions.map((sq, i) => (
          <button
            key={i}
            onClick={() => submitQuestion(sq.text)}
            className="btn-secondary"
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', borderRadius: '99px', background: 'rgba(147, 51, 234, 0.08)', border: '1px solid var(--border-hover)', color: 'var(--text-primary)' }}
            disabled={loading}
          >
            {sq.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSend} className="chat-input-area">
        <input 
          type="text" 
          placeholder="Ask a question about this lecture..." 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
        />
        <button type="submit" className="btn-premium" style={{ padding: '0.75rem' }} disabled={loading}>
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
