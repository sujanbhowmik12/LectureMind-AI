import React, { useState } from 'react';
import { Calendar, CheckCircle2, Circle, AlertTriangle, Plus, Trash2 } from 'lucide-react';

export default function DeadlinesView({ deadlines, onToggleComplete, onAddDeadline, onDeleteDeadline }) {
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDate) return;
    onAddDeadline(newTitle.trim(), newDate);
    setNewTitle('');
    setNewDate('');
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div className="quiz-container" style={{ padding: '1.5rem', width: '100%' }}>
        <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Extract / Add Assignment</h3>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <input 
              type="text" 
              placeholder="Assignment Title (e.g. Read Chapters 3-4)"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              required
            />
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div className="form-group" style={{ margin: 0, flex: 1 }}>
              <input 
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn-premium" style={{ whiteSpace: 'nowrap' }}>
              <Plus size={16} />
              Add Task
            </button>
          </div>
        </form>
      </div>

      <div className="deadlines-grid">
        <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Calendar size={20} style={{ color: 'var(--accent-primary)' }} />
          Extracted Tasks & Deadlines
        </h3>
        
        {(!deadlines || deadlines.length === 0) ? (
          <div style={{ textAlign: 'center', padding: '2rem', background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
            <AlertTriangle size={36} style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }} />
            <p className="text-secondary">No deadlines extracted for this lecture.</p>
          </div>
        ) : (
          deadlines.map((dl) => (
            <div key={dl.id} className={`deadline-item ${dl.completed ? 'completed' : ''}`}>
              <div className="deadline-main">
                <button 
                  onClick={() => onToggleComplete(dl.id)} 
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: dl.completed ? 'var(--success)' : 'var(--text-secondary)' }}
                >
                  {dl.completed ? <CheckCircle2 size={22} /> : <Circle size={22} />}
                </button>
                <div>
                  <span style={{ 
                    fontWeight: '600', 
                    fontSize: '1rem', 
                    textDecoration: dl.completed ? 'line-through' : 'none',
                    color: dl.completed ? 'var(--text-muted)' : 'var(--text-primary)' 
                  }}>
                    {dl.title}
                  </span>
                  <div className="deadline-date" style={{ marginTop: '0.25rem' }}>
                    Due: {dl.dueDate}
                  </div>
                </div>
              </div>
              <button 
                className="btn-icon" 
                style={{ width: '32px', height: '32px', border: 'none', color: 'var(--danger)', background: 'none' }}
                onClick={() => onDeleteDeadline(dl.id)}
                title="Delete Deadline"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
