const STORAGE_KEY = 'lecturemind_data';
const SETTINGS_KEY = 'lecturemind_settings';

const defaultLectures = [
  {
    id: 'l1',
    title: 'Intro to Deep Learning & Neural Networks',
    date: '2026-07-20T10:00:00Z',
    duration: '02:15',
    audioUrl: '', // Mock audio
    transcript: [
      { start: 0, end: 4, text: 'Hello everyone, welcome to CS224n.' },
      { start: 4, end: 9, text: 'Today we will begin our journey into deep learning and neural networks.' },
      { start: 9, end: 16, text: 'Let us start by asking: what is a neural network? Conceptually, it is inspired by the human brain.' },
      { start: 16, end: 21, text: 'It consists of layers of interconnected nodes, which we call artificial neurons.' },
      { start: 21, end: 27, text: 'Each connection has a weight, and each node has a bias and an activation function.' },
      { start: 27, end: 32, text: 'The activation function introduces non-linearity into the network.' },
      { start: 32, end: 37, text: 'Without non-linearity, no matter how many layers you add, it behaves like a single linear model.' },
      { start: 37, end: 43, text: 'Remember, your first assignment on implementing a simple feedforward neural network is due next Friday, August 7th.' },
      { start: 43, end: 49, text: 'Please submit your code and report through the portal by midnight.' },
      { start: 49, end: 54, text: 'In the next segment, we will discuss backpropagation.' }
    ],
    summary: `# Introduction to Neural Networks

This lecture introduces the core foundations of Deep Learning, focusing on neural network architecture, the importance of non-linearity, and backpropagation.

## Key Takeaways
* **Biological Inspiration**: Neural networks mimic the brain's neuron pathways using nodes, weights, and biases.
* **Non-Linearity**: Without non-linear activation functions (like ReLU, Sigmoid), multi-layer networks collapse mathematically into a simple single-layer linear model.
* **Structure**: Consists of an input layer, one or more hidden layers, and an output layer.

---

## Technical Concept: Activation Functions
Activation functions decide whether a neuron should be activated or not. They introduce non-linear properties to our network.
1. **Sigmoid**: Curves values between \`0\` and \`1\`. Often used in output layers for binary classification.
2. **ReLU (Rectified Linear Unit)**: Returns \`0\` if input is negative, else returns input. Very popular due to computational efficiency and combating vanishing gradient problems.
`,
    quizzes: [
      {
        question: 'Why do neural networks require non-linear activation functions?',
        options: [
          'To speed up execution during training.',
          'To prevent the network from collapsing mathematically into a single-layer linear model.',
          'To normalize inputs to standard ranges.',
          'To automatically calculate gradients.'
        ],
        answer: 1
      },
      {
        question: 'Which activation function returns 0 for any negative inputs and the input value itself for positive inputs?',
        options: ['Sigmoid', 'Tanh', 'ReLU', 'Softmax'],
        answer: 2
      }
    ],
    flashcards: [
      {
        front: 'What is the role of an Activation Function?',
        back: 'To introduce non-linearity into the neural network, allowing it to learn complex, non-linear patterns.'
      },
      {
        front: 'What is ReLU?',
        back: 'Rectified Linear Unit. A popular activation function defined as f(x) = max(0, x).'
      },
      {
        front: 'Why are hidden layers important?',
        back: 'They extract and learn hierarchical feature representations from the input data.'
      }
    ],
    deadlines: [
      {
        id: 'd1',
        title: 'Submit Neural Network Assignment 1',
        dueDate: '2026-08-07',
        completed: false
      }
    ]
  },
  {
    id: 'l2',
    title: 'Software Engineering Best Practices & Architecture',
    date: '2026-07-22T14:30:00Z',
    duration: '01:45',
    audioUrl: '',
    transcript: [
      { start: 0, end: 4, text: 'Okay, let us get started with today\'s guest lecture.' },
      { start: 4, end: 9, text: 'We are discussing software design principles, specifically SOLID principles.' },
      { start: 9, end: 14, text: 'The letter S in SOLID stands for Single Responsibility Principle.' },
      { start: 14, end: 19, text: 'A class should have one, and only one, reason to change.' },
      { start: 19, end: 24, text: 'Next is the Open-Closed Principle. Software entities should be open for extension but closed for modification.' },
      { start: 24, end: 30, text: 'Also, reminder that our project milestone 1 review is scheduled for August 12th.' },
      { start: 30, end: 35, text: 'Make sure your repositories are updated and documentation is ready.' }
    ],
    summary: `# Software Engineering Design Principles

A deep dive into building maintainable, scalable software architectures using standard SOLID design principles.

## SOLID Principles Covered
* **Single Responsibility (S)**: Every module, class, or function should have responsibility over a single part of the functionality.
* **Open-Closed (O)**: Classes should be open for extension (inheritance, polymorphism) but closed for modification (directly modifying existing production code).

## Next Deliverables
* **Milestone 1 Review**: Ensure Git commits are clean, readme documentation is updated, and core test cases are passing before August 12th.
`,
    quizzes: [
      {
        question: 'What does the Single Responsibility Principle state?',
        options: [
          'A program should have only one single file.',
          'A class should have one, and only one, reason to change.',
          'A developer is solely responsible for one code module.',
          'A function must return only a single value.'
        ],
        answer: 1
      },
      {
        question: 'What does "Open-Closed Principle" mean?',
        options: [
          'Code should be open to public viewing but closed to forks.',
          'Files should remain open during execution and closed immediately after.',
          'Software entities should be open for extension but closed for modification.',
          'APIs should be open during daytime and closed during maintenance.'
        ],
        answer: 2
      }
    ],
    flashcards: [
      {
        front: 'What does SOLID stand for?',
        back: 'Five design principles: Single Responsibility, Open-Closed, Liskov Substitution, Interface Segregation, and Dependency Inversion.'
      },
      {
        front: 'Explain Single Responsibility Principle.',
        back: 'A module/class should have only one reason to change, meaning it should perform only one distinct job.'
      }
    ],
    deadlines: [
      {
        id: 'd2',
        title: 'Project Milestone 1 Review Preparation',
        dueDate: '2026-08-12',
        completed: false
      }
    ]
  }
];

export const getLectures = () => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultLectures));
    return defaultLectures;
  }
  try {
    return JSON.parse(data);
  } catch (e) {
    console.error('Error parsing stored lectures', e);
    return defaultLectures;
  }
};

export const saveLectures = (lectures) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(lectures));
};

export const addLecture = (lecture) => {
  const lectures = getLectures();
  const newLecture = {
    ...lecture,
    id: 'l_' + Date.now(),
    date: new Date().toISOString()
  };
  lectures.unshift(newLecture);
  saveLectures(lectures);
  return newLecture;
};

export const deleteLecture = (id) => {
  const lectures = getLectures();
  const filtered = lectures.filter((l) => l.id !== id);
  saveLectures(filtered);
};

export const getSettings = () => {
  const settings = localStorage.getItem(SETTINGS_KEY);
  const defaultKey = import.meta.env.VITE_GEMINI_API_KEY || '';
  
  if (!settings) {
    const defaultSettings = { apiKey: defaultKey, model: 'gemini-1.5-flash', theme: 'dark', useMock: false };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(defaultSettings));
    return defaultSettings;
  }
  try {
    const parsed = JSON.parse(settings);
    if (!parsed.apiKey && defaultKey) {
      parsed.apiKey = defaultKey;
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(parsed));
    }
    return parsed;
  } catch (e) {
    return { apiKey: defaultKey, model: 'gemini-1.5-flash', theme: 'dark', useMock: false };
  }
};

export const saveSettings = (settings) => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};
