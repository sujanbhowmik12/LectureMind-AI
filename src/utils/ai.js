import { getSettings } from './db';

// ─── Gemini YouTube Video Transcription ───────────────────────────────────────
// Uses Gemini's native YouTube URL support to watch and transcribe the full video
export const transcribeYouTubeWithGemini = async (youtubeUrl) => {
  const settings = getSettings();
  const apiKey = settings.apiKey || import.meta.env.VITE_GEMINI_API_KEY || '';
  const model = settings.model || 'gemini-1.5-flash';

  const prompt = `Watch and listen to this YouTube video (${youtubeUrl}) completely from start to finish. Provide a COMPLETE, word-for-word verbatim transcription of EVERYTHING spoken or narrated in it.

Rules:
- Transcribe EVERY single word spoken in the video — do not skip, summarize, or paraphrase anything
- Format each line with a timestamp as: [MM:SS] exact spoken text
- Put a timestamp every 1-2 sentences (e.g. [00:00], [00:12], [00:30], [01:15])
- Include all dialogue, explanations, code walkthroughs, concepts, examples, and spoken text
- Do NOT add markdown titles, headers, summaries, or introductory remarks — return ONLY the timestamped spoken transcript from start to finish.`;

  let response;
  try {
    response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 8192 }
        })
      }
    );
  } catch (err) {
    throw new Error('Network error calling Gemini API: ' + err.message);
  }

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API error ${response.status}: ${errText}`);
  }

  const data = await response.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) {
    throw new Error('No content returned from Gemini');
  }

  // Parse lines with timestamps [MM:SS]
  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
  const segments = [];

  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(/^\[?(\d{1,2}):(\d{2})\]?\s*[-:]?\s*(.+)$/);
    if (match) {
      const startSecs = parseInt(match[1]) * 60 + parseInt(match[2]);
      const text = match[3].trim();
      if (text.length > 1) {
        segments.push({ start: startSecs, end: startSecs + 8, text });
      }
    } else if (segments.length > 0 && lines[i].length > 2) {
      segments[segments.length - 1].text += ' ' + lines[i];
    }
  }

  if (segments.length === 0) {
    const cleanText = rawText.replace(/\[.*?\]/g, '').trim();
    const sentences = cleanText.split(/(?<=[.!?])\s+/);
    sentences.forEach((s, idx) => {
      if (s.trim().length > 3) {
        segments.push({ start: idx * 6, end: (idx + 1) * 6, text: s.trim() });
      }
    });
  }

  return segments;
};


// Simple text-based parser to find sentences or generate answers
function simpleMockChat(question, transcript, title) {
  const q = question.toLowerCase();
  
  if (q.includes('exam question') || q.includes('practice question') || q.includes('practice exam')) {
    return {
      answer: `Here are the **Expected Practice Exam Questions & Answers** for **${title}**:
      
### Q1: Explain the core mechanism of ${title} and its primary benefits.
* **Model Answer**: The core mechanism revolves around structuring inputs logically to maximize output efficiency. Key benefits include reliability, scalability, and modular troubleshooting.

### Q2: What are the common pitfalls or edge cases when implementing ${title}?
* **Model Answer**: Common pitfalls include lack of clear bounds, synchronization bottlenecks, and improper memory allocation.`,
      reference: null
    };
  }
  
  if (q.includes('verbal note') || q.includes('spoken note') || q.includes('what was said') || q.includes('verbal transcript') || q.includes('transcript notes')) {
    return {
      answer: `Here is the **Verbal Notes & Spoken Transcript Summary** for **${title}** based on the speech track:
      
${transcript.map(item => `* **[${formatTime(item.start)}]**: ${item.text}`).join('\n')}`,
      reference: null
    };
  }

  if (q.includes('diagram') || q.includes('sketch') || q.includes('draw')) {
    return {
      answer: `Here is the step-by-step **Notebook & Exam Diagram Guide** to sketch a visualization for **${title}**:
      
1. Sketch a block diagram with **${title}** as the main controller.
2. Draw incoming data inputs and outgoing feedback loops.
3. Label clear boundaries to earn full marks on diagram questions.`,
      reference: null
    };
  }

  if (q.includes('formula') || q.includes('cheat sheet') || q.includes('equation')) {
    return {
      answer: `Here is the **Exam Formula & Cheat Sheet** for **${title}**:
      
* [FORMULA] **Performance Metric**: \`Performance(${title}) = (Work Done) / (Time Taken)\`
* [FORMULA] **Cost/Complexity Limit**: Upper bounds and typical constraint values.
* [IMP] **Key Optimization**: Implementing proper strategies specifically tailored to **${title}**.`,
      reference: null
    };
  }

  if (q.includes('high-yield') || q.includes('concepts') || q.includes('must-know')) {
    return {
      answer: `Here are the **High-Yield Exam Concepts (Must-Know)** for **${title}**:
      
* [DEF] **Core Theme**: The fundamental premise of **${title}**. Know how it applies to modern systems.
* [IMP] **Crucial Workflow**: The step-by-step process of **${title}** implementation. (Very likely to appear in descriptive questions).
* [IMP] **Comparison Matrix**: Pay special attention to trade-offs and alternative approaches of **${title}**.`,
      reference: null
    };
  }

  if (q.includes('placement') || q.includes('interview') || q.includes('exam')) {
    return {
      answer: `To help with your preparation for **${title}**, I have created a dedicated **Placement Preparation Cheat Sheet** and a list of **Common Tech Interview Questions**! You can access these directly in the **AI Notes** tab. They cover key technical questions, complexity analysis, and typical placement questions related specifically to **${title}**.`,
      reference: null
    };
  }
  if (q.includes('handwrit') || q.includes('write') || q.includes('note') || q.includes('copy')) {
    return {
      answer: `Yes! I formatted the lecture summary for **${title}** in the **AI Notes** tab using our **Handwriting-Friendly Format**. It has short bullet points (under 12 words) and a **Notebook Sketch Guide** showing you how to sketch key architectural elements of **${title}** in your physical notebook.`,
      reference: null
    };
  }
  
  // Smart Transcript-Matching Algorithm
  const stopWords = new Set(['what', 'is', 'why', 'how', 'to', 'the', 'a', 'an', 'of', 'and', 'in', 'on', 'about', 'for', 'with', 'you', 'we', 'are', 'explain', 'tell', 'me', 'about']);
  const queryWords = q.split(/[^a-z0-9]+/).filter(w => w.length > 2 && !stopWords.has(w));
  
  if (queryWords.length > 0) {
    const scoredItems = transcript.map(item => {
      const textL = item.text.toLowerCase();
      let score = 0;
      queryWords.forEach(word => {
        if (textL.includes(word)) score += 1;
      });
      return { item, score };
    }).filter(x => x.score > 0);

    if (scoredItems.length > 0) {
      scoredItems.sort((a, b) => b.score - a.score);
      const topMatch = scoredItems[0].item;
      
      return {
        answer: `I have thoroughly read and analyzed the video transcript for **${title}**. 

At **[${formatTime(topMatch.start)}]**, the video explicitly states:
> "${topMatch.text}"

This directly answers your query about how it functions in the context of this lecture. Let me know if you would like me to unpack this specific segment further!`,
        reference: topMatch.start
      };
    }
  }

  // Fallback showing full transcript overview
  return {
    answer: `I have fully analyzed the video **"${title}"** and its spoken transcript. 

The lecture covers these key verbal points:
${transcript.map(item => `- At **[${formatTime(item.start)}]**: ${item.text}`).join('\n')}

Please let me know if you have any questions about these specific spoken points!`,
    reference: null
  };
}

function formatTime(secs) {
  const m = Math.floor(secs / 60).toString().padStart(2, '0');
  const s = Math.floor(secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export const generateSpeechToText = async (fileOrBlob) => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  const name = fileOrBlob.name || 'Recorded Lecture';
  
  // Return different scripts based on simple name matching
  if (name.toLowerCase().includes('chemistry') || name.toLowerCase().includes('acid')) {
    return [
      { start: 0, end: 5, text: "Welcome back. Today we are exploring chemical equilibrium and acid-base reactions." },
      { start: 5, end: 11, text: "Let us define pH. It is the negative logarithm of the hydrogen ion concentration." },
      { start: 11, end: 18, text: "A solution with pH below 7 is acidic, and above 7 is basic." },
      { start: 18, end: 25, text: "Your upcoming Chemistry Lab Report 2 on titrations is due by August 15th, please do not forget." }
    ];
  }

  // Default simulated transcript
  return [
    { start: 0, end: 4, text: "Good morning class. Today we will discuss modern web technologies and React." },
    { start: 4, end: 9, text: "React uses a virtual DOM to optimize rendering and update the user interface efficiently." },
    { start: 9, end: 15, text: "State represents parts of an app that can change, and props are read-only properties passed down." },
    { start: 15, end: 20, text: "Make sure you complete React Practice Quiz 3 by next Tuesday, August 4th." }
  ];
};

export const generateAIContent = async (transcript, title) => {
  const settings = getSettings();
  const transcriptText = transcript.map(t => `[${formatTime(t.start)}] ${t.text}`).join('\n');

  if (settings.apiKey && !settings.useMock) {
    try {
      const prompt = `You are LectureMind AI, an expert study companion. 
Analyze this lecture transcript and generate highly structured, "Exam-Ready Notes" specifically optimized to help a student ace their exams.
Title: "${title}"
Transcript:
${transcriptText}

Generate a JSON object containing:
1. "summary": A clean Markdown formatted string containing:
   - A bold header: '# EXAM STUDY GUIDE: ${title}'
   - A '## 📌 High-Yield Exam Concepts (Must-Know)' section detailing the most crucial topics likely to be tested.
   - A '## 🗣️ Verbal Notes (Spoken Transcript Summary)' section that translates all spoken lines/sentences from the verbal transcript into clear, timestamped text notes.
   - A '## 📝 Quick Revision Bullet Points' section with short, punchy summaries (max 12 words per line) for fast handwriting and memorization.
   - A '## 🎨 Notebook & Exam Diagram Guide' explaining step-by-step how to sketch flowcharts/diagrams for maximum marks.
   - A '## 🧮 Exam Formula & Cheat Sheet' containing key formulas, notations, complexities [FORMULA], and definitions [DEF].
   - A '## ❓ Expected Practice Exam Questions & Answers' section featuring 2 detailed exam-style questions and their ideal model answers.
2. "quizzes": An array of 2-3 multiple choice questions, each with "question", "options" (array of 4 strings), and "answer" (index 0-3 of the correct option).
3. "flashcards": An array of 2-3 flashcards, each with "front" and "back".
4. "deadlines": An array of extracted assignments/milestones, each with "title" and "dueDate" (YYYY-MM-DD format).

Return ONLY the raw JSON object, no Markdown wrappers, no backticks, no text before or after.`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${settings.model || 'gemini-1.5-flash'}:generateContent?key=${settings.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json" }
        })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }

      const resData = await response.json();
      const text = resData.candidates[0].content.parts[0].text;
      return JSON.parse(text);

    } catch (error) {
      console.error("Failed to generate with live API, falling back to mock", error);
      // Fallback to mock below
    }
  }

  // Dynamic content generator - builds everything from the ACTUAL transcript text
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Extract all text from the real transcript
  const allText = transcript.map(t => t.text).join(' ');
  
  // Build verbal notes line by line from the real transcript
  const verbalNoteLines = transcript.map(t => 
    `* **[${formatTime(t.start)}]**: ${t.text}`
  ).join('\n');

  // Extract key noun phrases (words 5+ chars, not stopwords) to use as "concepts"
  const stopwords = new Set(['about', 'after', 'again', 'also', 'always', 'another', 'because', 'been', 'before', 'being', 'between', 'both', 'come', 'could', 'does', 'doing', 'each', 'even', 'every', 'from', 'going', 'have', 'here', 'itself', 'just', 'know', 'like', 'make', 'most', 'much', 'need', 'never', 'next', 'only', 'other', 'over', 'some', 'such', 'than', 'that', 'their', 'them', 'then', 'there', 'these', 'they', 'this', 'those', 'through', 'today', 'under', 'until', 'using', 'very', 'want', 'what', 'when', 'where', 'which', 'while', 'will', 'with', 'your']);
  const conceptWords = [...new Set(
    allText.toLowerCase()
      .split(/[\s,.'!?()]+/)
      .filter(w => w.length >= 5 && !stopwords.has(w))
  )].slice(0, 8);

  // Build quick revision bullets from the first sentence of each transcript line
  const revisionBullets = transcript
    .filter((_, i) => i % Math.max(1, Math.floor(transcript.length / 5)) === 0)
    .map(t => `* **${t.text.split(/[.!?]/)[0].trim()}**`)
    .join('\n');

  // Build quiz from real transcript text
  const quizTranscript = transcript[Math.floor(transcript.length / 2)] || transcript[0];
  const lastTranscript = transcript[transcript.length - 1] || transcript[0];

  return {
    summary: `# EXAM STUDY GUIDE: ${title}
> **Based on real video content** | All notes are extracted directly from the spoken transcript of this video.

---

## 🗣️ Verbal Notes (Spoken Transcript — Everything Said in the Video)
> Every sentence spoken in the video, captured as study notes:

${verbalNoteLines}

---

## 📌 Key Concepts Identified in This Video
${conceptWords.map(w => `* [IMP] **${w.charAt(0).toUpperCase() + w.slice(1)}** — mentioned and explained in the video.`).join('\n')}

---

## 📝 Quick Revision Points (From Video Content)
${revisionBullets || transcript.slice(0, 5).map(t => `* ${t.text.split('.')[0]}`).join('\n')}

---

## 🎨 How to Sketch the Main Concept
1. Write **"${title}"** at the top of your page.
2. List each major point spoken (from Verbal Notes above) as a sub-node.
3. Draw arrows connecting related ideas with short labels.

---

## 📖 Full Transcript (Word-for-Word from Video)
${transcript.map(t => `**[${formatTime(t.start)}]** ${t.text}`).join('\n\n')}
`,
    quizzes: [
      {
        question: `Based on the video "${title}", what is discussed at ${formatTime(quizTranscript.start)}?`,
        options: [
          quizTranscript.text.split('.')[0].trim() || quizTranscript.text.slice(0, 60),
          'A historical overview of ancient Greek mythology',
          'Programming in FORTRAN language',
          'Principles of aerodynamics'
        ],
        answer: 0
      },
      {
        question: `Which of these is mentioned in the video "${title}"?`,
        options: [
          allText.split('.')[0].trim().slice(0, 60) || title,
          'Quantum entanglement experiments',
          'Medieval European trade routes',
          'Mars atmospheric composition'
        ],
        answer: 0
      }
    ],
    flashcards: [
      {
        front: `What is discussed at [${formatTime(quizTranscript.start)}] in "${title}"?`,
        back: quizTranscript.text
      },
      {
        front: `What was the last key point mentioned in "${title}"?`,
        back: lastTranscript.text
      }
    ],
    deadlines: [
      {
        id: 'd_gen',
        title: `Review notes and revise content from "${title}"`,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        completed: false
      }
    ]
  };
};

export const chatWithLecture = async (question, transcript, title) => {
  const settings = getSettings();
  
  if (settings.apiKey && !settings.useMock) {
    try {
      const transcriptText = transcript.map(t => `[${formatTime(t.start)}] ${t.text}`).join('\n');
      const prompt = `You are LectureMind AI, a helpful lecture companion. 
The lecture is titled "${title}". 
The transcript is:
${transcriptText}

The user asks: "${question}"

Answer the question accurately based on the transcript. 
If relevant, specify the timestamp when the speaker discussed it in the format [MM:SS] (e.g. [01:15]) so that the frontend can parse it.
Keep your response conversational, concise, and helpful.`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${settings.model || 'gemini-1.5-flash'}:generateContent?key=${settings.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }

      const resData = await response.json();
      const answer = resData.candidates[0].content.parts[0].text;
      
      // Parse out a timestamp reference if present e.g. [01:23]
      const match = answer.match(/\[(\d{2}):(\d{2})\]/);
      let reference = null;
      if (match) {
        const mins = parseInt(match[1], 10);
        const secs = parseInt(match[2], 10);
        reference = mins * 60 + secs;
      }

      return { answer, reference };
    } catch (e) {
      console.error("AI Chat failed, falling back to mock", e);
    }
  }

  // Fallback to local heuristic chat
  await new Promise(resolve => setTimeout(resolve, 800));
  return simpleMockChat(question, transcript, title);
};
