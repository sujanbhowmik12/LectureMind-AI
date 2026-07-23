import React, { useState, useMemo } from 'react';
import { Download, FileText, Copy, Check, Printer } from 'lucide-react';

function formatTime(secs) {
  const m = Math.floor(secs / 60).toString().padStart(2, '0');
  const s = Math.floor(secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function extractKeywords(transcript, title) {
  const stopwords = new Set([
    'the','a','an','is','it','in','on','of','and','or','to','for','with',
    'you','we','are','was','were','be','been','this','that','they','them',
    'have','has','had','will','would','can','could','do','does','did',
    'from','at','by','as','so','but','if','then','when','what','how',
    'not','all','just','like','also','more','very','too','any','its',
    'into','about','over','after','before','between','through','during',
    'these','those','their','there','here','where','which','while','your',
    'said','says','going','okay','right','yeah','well','know','think',
    'want','make','come','take','look','good','time','need','work','way'
  ]);
  const freq = {};
  const allWords = (title + ' ' + transcript.map(t => t.text).join(' '))
    .toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/);
  for (const w of allWords) {
    if (w.length >= 4 && !stopwords.has(w)) freq[w] = (freq[w] || 0) + 1;
  }
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([word, count]) => ({ word, count }));
}

export default function TextModeView({ lecture }) {
  const [copied, setCopied] = useState(false);

  const keywords = useMemo(() => extractKeywords(lecture.transcript, lecture.title), [lecture]);
  const totalWords = useMemo(
    () => lecture.transcript.map(t => t.text.trim().split(/\s+/).length).reduce((a, b) => a + b, 0),
    [lecture]
  );

  const fullText = useMemo(() => {
    const lines = [
      lecture.title.toUpperCase(),
      '='.repeat(lecture.title.length),
      `Duration: ${lecture.duration}  |  Words: ${totalWords}  |  Date: ${new Date(lecture.date).toLocaleDateString()}`,
      '',
      'FULL VIDEO TRANSCRIPT',
      '---------------------',
      ...lecture.transcript.map(t => `[${formatTime(t.start)}]  ${t.text}`),
      '',
      'KEY TOPICS & KEYWORDS',
      '---------------------',
      keywords.map(k => k.word).join('  -  '),
      '',
    ];
    if (lecture.summary) {
      lines.push(
        'AI STUDY NOTES',
        '--------------',
        lecture.summary.replace(/[#*>`\[\]]/g, '').replace(/\n\n+/g, '\n').trim()
      );
    }
    return lines.join('\n');
  }, [lecture, keywords, totalWords]);

  const handleCopy = () => {
    navigator.clipboard.writeText(fullText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handleDownloadPDF = () => {
    const transcriptHTML = lecture.transcript.map(t =>
      `<div class="segment"><span class="ts">[${formatTime(t.start)}]</span><span class="txt">${t.text.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</span></div>`
    ).join('');

    const keywordsHTML = keywords.map(k =>
      `<span class="kw">${k.word} <small>x${k.count}</small></span>`
    ).join('');

    const summaryHTML = lecture.summary
      ? `<h2>AI Study Notes</h2><div class="summary">${
          lecture.summary.replace(/[#*>`\[\]]/g,'').replace(/\n\n+/g,'\n\n').trim().replace(/\n/g,'<br/>')
        }</div>`
      : '';

    const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/>
<title>${lecture.title.replace(/</g,'&lt;')} - Lecture Notes</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Georgia,'Times New Roman',serif;font-size:12pt;line-height:1.8;color:#111;background:#fff;padding:40px 52px;max-width:800px;margin:0 auto}
h1{font-size:22pt;font-weight:700;color:#111;margin-bottom:6px;border-bottom:3px solid #111;padding-bottom:10px}
.meta{font-size:9pt;color:#777;margin-bottom:28px;margin-top:6px}
h2{font-size:11pt;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:#444;margin:28px 0 10px;padding-bottom:5px;border-bottom:1px solid #ccc}
.segment{display:flex;gap:14px;margin-bottom:6px;page-break-inside:avoid}
.ts{font-family:'Courier New',monospace;font-size:8.5pt;color:#22aa77;flex-shrink:0;min-width:46px;padding-top:3px;font-weight:600}
.txt{font-size:11pt;color:#222;line-height:1.75}
.keywords{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px}
.kw{background:#f3f3f3;border:1px solid #ccc;border-radius:20px;padding:3px 12px;font-size:9pt;color:#333;font-weight:600;font-family:sans-serif}
.kw small{color:#aaa;font-size:8pt}
.summary{font-size:10.5pt;color:#222;line-height:1.85;white-space:pre-wrap;margin-top:6px}
.footer{margin-top:44px;padding-top:12px;border-top:1px solid #ddd;font-size:8pt;color:#bbb;text-align:center}
@media print{body{padding:20px 30px}@page{margin:18mm 14mm}}
</style></head><body>
<h1>${lecture.title.replace(/</g,'&lt;')}</h1>
<div class="meta">Duration: ${lecture.duration} &nbsp;|&nbsp; Total Words: ${totalWords} &nbsp;|&nbsp; Segments: ${lecture.transcript.length} &nbsp;|&nbsp; Date: ${new Date(lecture.date).toLocaleDateString()}</div>
<h2>Full Video Transcript</h2>
${transcriptHTML}
<h2>Key Topics &amp; Keywords</h2>
<div class="keywords">${keywordsHTML}</div>
${summaryHTML}
<div class="footer">Generated by LectureMind AI &nbsp;·&nbsp; ${new Date().toLocaleString()}</div>
<script>window.onload=function(){window.print();}</script>
</body></html>`;

    const win = window.open('', '_blank');
    if (win) { win.document.write(html); win.document.close(); }
  };

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
        borderRadius: '20px', padding: '1.25rem 1.75rem',
        border: '1px solid #4338ca55', flexWrap: 'wrap', gap: '1rem',
        boxShadow: '0 8px 32px #6366f122'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
            <FileText size={20} style={{ color: '#818cf8' }} />
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#e0e7ff' }}>Text Mode</h3>
          </div>
          <p style={{ margin: 0, fontSize: '0.82rem', color: '#a5b4fc' }}>
            Everything spoken in the video — transcript, keywords &amp; notes
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.6rem' }}>
          <button onClick={handleCopy} style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            background: '#ffffff15', border: '1px solid #ffffff30',
            color: '#e0e7ff', borderRadius: '10px', padding: '0.55rem 1.1rem',
            fontSize: '0.83rem', fontWeight: 600, cursor: 'pointer'
          }}>
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Copied!' : 'Copy Text'}
          </button>
          <button onClick={handleDownloadPDF} style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            border: 'none', color: '#fff', borderRadius: '10px',
            padding: '0.55rem 1.25rem', fontSize: '0.83rem', fontWeight: 700,
            cursor: 'pointer', boxShadow: '0 4px 14px #6366f155'
          }}>
            <Printer size={14} />
            Download PDF
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        {[
          { label: 'Segments', val: lecture.transcript.length, color: '#10b981', icon: '🔢' },
          { label: 'Words Spoken', val: totalWords, color: '#6366f1', icon: '💬' },
          { label: 'Duration', val: lecture.duration, color: '#f59e0b', icon: '⏱️' },
          { label: 'Keywords', val: keywords.length, color: '#ec4899', icon: '🔑' },
        ].map(s => (
          <div key={s.label} style={{
            flex: 1, minWidth: '130px',
            background: 'var(--bg-card)', borderRadius: '14px',
            padding: '0.85rem 1rem', border: `1px solid ${s.color}33`, textAlign: 'center'
          }}>
            <div style={{ fontSize: '1.1rem' }}>{s.icon}</div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: s.color, margin: '0.2rem 0 0.1rem' }}>{s.val}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Full Transcript */}
      <div style={{ background: 'var(--bg-card)', borderRadius: '18px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
        <div style={{
          padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-color)',
          display: 'flex', alignItems: 'center', gap: '0.6rem',
          background: 'linear-gradient(90deg, #10b98112, transparent)'
        }}>
          <span>📝</span>
          <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Full Video Transcript</span>
          <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {lecture.transcript.length} segments · {totalWords} words
          </span>
        </div>
        <div style={{ padding: '1.25rem 1.5rem', maxHeight: '520px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          {lecture.transcript.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem', fontSize: '0.9rem' }}>
              No transcript yet — import a YouTube video to see everything spoken here.
            </p>
          ) : (
            lecture.transcript.map((t, i) => (
              <div key={i} style={{
                display: 'flex', gap: '1rem', alignItems: 'flex-start',
                padding: '0.42rem 0.65rem', borderRadius: '8px',
                background: i % 2 === 0 ? 'var(--bg-base)' : 'transparent'
              }}>
                <span style={{ fontFamily: 'monospace', fontSize: '0.76rem', color: '#10b981', flexShrink: 0, paddingTop: '2px', minWidth: '48px', fontWeight: 600 }}>
                  [{formatTime(t.start)}]
                </span>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.72 }}>
                  {t.text}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Keywords */}
      {keywords.length > 0 && (
        <div style={{ background: 'var(--bg-card)', borderRadius: '18px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
          <div style={{
            padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-color)',
            display: 'flex', alignItems: 'center', gap: '0.6rem',
            background: 'linear-gradient(90deg, #ec489912, transparent)'
          }}>
            <span>🔑</span>
            <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Key Topics &amp; Keywords</span>
          </div>
          <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {keywords.map((k, i) => (
              <span key={i} style={{
                background: `hsl(${(i * 24) % 360}, 60%, 13%)`,
                border: `1px solid hsl(${(i * 24) % 360}, 65%, 30%)`,
                color: `hsl(${(i * 24) % 360}, 80%, 72%)`,
                borderRadius: '20px', padding: '0.3rem 1rem',
                fontSize: '0.84rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem'
              }}>
                {k.word}
                <span style={{ opacity: 0.5, fontSize: '0.72rem' }}>×{k.count}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* AI Notes */}
      {lecture.summary && (
        <div style={{ background: 'var(--bg-card)', borderRadius: '18px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
          <div style={{
            padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-color)',
            display: 'flex', alignItems: 'center', gap: '0.6rem',
            background: 'linear-gradient(90deg, #6366f112, transparent)'
          }}>
            <span>📌</span>
            <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>AI Study Notes</span>
            <span style={{ marginLeft: 'auto', fontSize: '0.73rem', color: 'var(--text-muted)' }}>From video content</span>
          </div>
          <div style={{
            padding: '1.25rem 1.5rem', maxHeight: '440px', overflowY: 'auto',
            fontSize: '0.88rem', lineHeight: 1.85, color: 'var(--text-primary)',
            whiteSpace: 'pre-wrap', wordBreak: 'break-word'
          }}>
            {lecture.summary.replace(/[#*>`\[\]]/g, '').replace(/\n\n\n+/g, '\n\n').trim()}
          </div>
        </div>
      )}

      {/* Bottom PDF button */}
      <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: '1.5rem' }}>
        <button onClick={handleDownloadPDF}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 32px #6366f166'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 6px 22px #6366f155'; }}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.6rem',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            border: 'none', color: '#fff', borderRadius: '14px',
            padding: '0.9rem 2.5rem', fontSize: '0.95rem', fontWeight: 700,
            cursor: 'pointer', boxShadow: '0 6px 22px #6366f155',
            transition: 'transform 0.15s, box-shadow 0.15s'
          }}>
          <Download size={18} />
          Download Full Report as PDF
        </button>
      </div>
    </div>
  );
}
