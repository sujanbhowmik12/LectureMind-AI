import React, { useState } from 'react';
import { Edit2, Save, Eye, Download } from 'lucide-react';

// Simple regex-based markdown renderer
function renderMarkdown(mdText) {
  if (!mdText) return '';
  
  let html = mdText
    // Escaping simple HTML entities
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    
    // Headers
    .replace(/^# (.*?)$/gm, '<h1 class="md-h1">$1</h1>')
    .replace(/^## (.*?)$/gm, '<h2 class="md-h2">$1</h2>')
    .replace(/^### (.*?)$/gm, '<h3 class="md-h3">$1</h3>')
    
    // Bold
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    
    // Code blocks
    .replace(/`([^`]+)`/g, '<code class="md-code">$1</code>')
    
    // Lists
    .replace(/^\* (.*?)$/gm, '<li class="md-li">$1</li>')
    .replace(/^- (.*?)$/gm, '<li class="md-li">$1</li>')
    
    // Paragraphs (if not containing tag already)
    .replace(/^(?!\s*<h|li|ul|ol|p|div|hr|blockquote)(.*?)$/gm, '<p class="md-p">$1</p>')
    
    // Cleanup list wrapping
    .replace(/(<li.*<\/li>)/gs, '<ul class="md-ul">$1</ul>')
    
    // Horizontal rules
    .replace(/^---$/gm, '<hr class="md-hr" />');
    
  return html;
}

export default function NotesView({ summary, lectureTitle, onSave }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(summary);

  const handleSave = () => {
    onSave(editedText);
    setIsEditing(false);
  };

  const handleDownload = () => {
    const blob = new Blob([summary], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const sanitizedTitle = (lectureTitle || 'Lecture').replace(/[^a-z0-9]/gi, '_').toLowerCase();
    link.setAttribute('download', `${sanitizedTitle}_notes.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Please allow popups to download files in PDF mode.");
      return;
    }
    const htmlContent = `
      <html>
        <head>
          <title>${lectureTitle || 'Lecture Notes'}</title>
          <style>
            body {
              font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
              padding: 40px;
              color: #1e1b4b;
              background-color: #ffffff;
              line-height: 1.6;
              max-width: 800px;
              margin: 0 auto;
            }
            h1 { 
              font-size: 2.25rem; 
              color: #4f46e5; 
              border-bottom: 2px solid #e0e7ff; 
              padding-bottom: 12px; 
              margin-bottom: 24px;
            }
            h2 { 
              font-size: 1.5rem; 
              color: #312e81; 
              margin-top: 32px; 
              border-bottom: 1px dashed #e0e7ff; 
              padding-bottom: 6px;
            }
            h3 { 
              font-size: 1.2rem; 
              color: #4338ca; 
              margin-top: 24px; 
            }
            p, li { 
              color: #374151; 
              font-size: 1rem;
              margin-bottom: 10px;
            }
            li { 
              margin-left: 20px; 
            }
            pre, code {
              background: #f3f4f6;
              padding: 4px 8px;
              border-radius: 6px;
              font-family: Consolas, Monaco, monospace;
              font-size: 0.9rem;
            }
            blockquote {
              border-left: 4px solid #6366f1;
              background: #f8fafc;
              padding: 12px 20px;
              margin: 20px 0;
              border-radius: 0 8px 8px 0;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
            }
            th, td {
              border: 1px solid #e5e7eb;
              padding: 10px 12px;
              text-align: left;
            }
            th {
              background-color: #f9fafb;
              color: #1e1b4b;
            }
            @media print {
              body {
                padding: 20px;
              }
              button {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <h1>${lectureTitle || 'Lecture Notes'}</h1>
          <div>${renderMarkdown(summary)}</div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
        {isEditing ? (
          <>
            <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={() => setIsEditing(false)}>
              <Eye size={16} />
              Cancel
            </button>
            <button className="btn-premium" onClick={handleSave}>
              <Save size={16} />
              Save Notes
            </button>
          </>
        ) : (
          <>
            <button 
              className="btn-premium" 
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--accent-gradient)', color: '#fff', border: 'none' }} 
              onClick={handleDownloadPDF}
            >
              <Download size={16} />
              Download PDF
            </button>
            <button className="btn-premium" onClick={() => { setEditedText(summary); setIsEditing(true); }}>
              <Edit2 size={16} />
              Edit Notes
            </button>
          </>
        )}
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '300px' }}>
        {isEditing ? (
          <textarea
            style={{
              width: '100%',
              flex: 1,
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: '16px',
              padding: '1.5rem',
              fontFamily: 'Consolas, Monaco, monospace',
              fontSize: '1rem',
              lineHeight: '1.6',
              outline: 'none',
              resize: 'none'
            }}
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
          />
        ) : (
          <div 
            className="markdown-body scroll-area" 
            style={{ 
              background: 'var(--bg-card)', 
              border: '1px solid var(--border-color)', 
              borderRadius: '16px', 
              padding: '2rem',
              height: '100%',
              overflowY: 'auto'
            }}
            dangerouslySetInnerHTML={{ __html: renderMarkdown(summary) }}
          />
        )}
      </div>
    </div>
  );
}

