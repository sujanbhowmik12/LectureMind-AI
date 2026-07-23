import React, { useState, useEffect } from 'react';
import { X, Save, Trash2 } from 'lucide-react';
import { getSettings, saveSettings } from '../utils/db';

export default function SettingsModal({ isOpen, onClose, onResetDb }) {
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('gemini-1.5-flash');
  const [useMock, setUseMock] = useState(true);

  useEffect(() => {
    if (isOpen) {
      const config = getSettings();
      setApiKey(config.apiKey || '');
      setModel(config.model || 'gemini-1.5-flash');
      setUseMock(config.useMock !== false);
    }
  }, [isOpen]);

  const handleSave = () => {
    saveSettings({ apiKey, model, useMock });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2>Settings & Configuration</h2>
          <button className="btn-icon" onClick={onClose} style={{ width: '32px', height: '32px' }}>
            <X size={16} />
          </button>
        </div>

        <div className="form-group">
          <div className="switch-container" style={{ margin: '1rem 0' }}>
            <span style={{ fontWeight: '500' }}>Enable Mock Data AI Mode</span>
            <label className="switch">
              <input 
                type="checkbox" 
                checked={useMock} 
                onChange={(e) => setUseMock(e.target.checked)} 
              />
              <span className="slider"></span>
            </label>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '-0.5rem' }}>
            When active, simulations run locally without requiring API keys. Turn off to connect with Gemini API.
          </p>
        </div>

        <div className="form-group" style={{ opacity: useMock ? 0.5 : 1 }}>
          <label>Gemini API Key</label>
          <input 
            type="password" 
            placeholder="AIzaSy..." 
            value={apiKey}
            disabled={useMock}
            onChange={(e) => setApiKey(e.target.value)}
          />
        </div>

        <div className="form-group" style={{ opacity: useMock ? 0.5 : 1 }}>
          <label>Preferred Gemini Model</label>
          <select 
            value={model} 
            disabled={useMock}
            onChange={(e) => setModel(e.target.value)}
          >
            <option value="gemini-1.5-flash">Gemini 1.5 Flash (Fastest)</option>
            <option value="gemini-1.5-pro">Gemini 1.5 Pro (Thorough)</option>
          </select>
        </div>

        <hr style={{ border: '0', borderTop: '1px solid var(--border-color)', margin: '1.5rem 0' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--danger)' }} onClick={onResetDb}>
            <Trash2 size={16} />
            Reset Data
          </button>
          <button className="btn-premium" onClick={handleSave}>
            <Save size={16} />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
