export type Person = {
  id: string;
  name: string;
  linkedinUrl: string;
  profileImage: string;
  company: string;
  role: string;
  industry: string;
  strength: number;
  sameUniversity?: boolean;
  initialCount: number;
  howWeMet: string;
  reason: string;
  lastContact: string;
  followUp: string;
  nextConversation: string;
  notes: string;
  tags: string[];
  priority: string;
  position: { x: number; y: number };
  createdAt: string;
  updatedAt: string;
};
export type Conversation = {
  id: string;
  connectionId: string;
  date: string;
  type: string;
  topics: string[];
  summary: string;
  takeaways: string;
  actions: { id: string; text: string; completed: boolean }[];
  followUp: string;
  privateNotes: string;
  createdAt: string;
  updatedAt: string;
};
export type Relationship = {
  id: string;
  source: string;
  target: string;
  type: string;
  label: string;
  notes: string;
};
export type TextNode = {
  id: string;
  text: string;
  position: { x: number; y: number };
  width: number;
  height: number;
};
export type Network = {
  version: 1;
  people: Person[];
  conversations: Conversation[];
  relationships: Relationship[];
  texts: TextNode[];
  viewport: { x: number; y: number; zoom: number };
};
export const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
export const uid = () => crypto.randomUUID();
export const emptyNetwork = (): Network => ({
  version: 1,
  people: [],
  conversations: [],
  relationships: [],
  texts: [],
  viewport: { x: 0, y: 0, zoom: 1 },
});
export const blankPerson = (): Person => ({
  id: uid(),
  name: '',
  linkedinUrl: '',
  profileImage: '',
  company: '',
  role: '',
  industry: '',
  strength: 3,
  sameUniversity: false,
  initialCount: 0,
  howWeMet: '',
  reason: '',
  lastContact: '',
  followUp: '',
  nextConversation: '',
  notes: '',
  tags: [],
  priority: 'Normal',
  position: { x: 100, y: 100 },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});
export const canonicalUrl = (v: string) => {
  try {
    const u = new URL(v);
    if (
      u.protocol !== 'https:' ||
      !/(^|\.)linkedin\.com$/.test(u.hostname) ||
      !u.pathname.startsWith('/in/') ||
      u.pathname.length < 5
    )
      return '';
    return `https://www.linkedin.com${u.pathname.replace(/\/+$/, '').toLowerCase()}`;
  } catch {
    return '';
  }
};
export const conversationsFor = (d: Network, id: string) =>
  d.conversations
    .filter((c) => c.connectionId === id)
    .sort((a, b) => b.date.localeCompare(a.date));
export const lastContact = (d: Network, p: Person) =>
  [p.lastContact, ...conversationsFor(d, p.id).map((c) => c.date)]
    .filter(Boolean)
    .sort()
    .at(-1) || '';
export const daysSince = (date: string) =>
  date
    ? Math.floor(
        (new Date(today() + 'T12:00:00').getTime() -
          new Date(date + 'T12:00:00').getTime()) /
          86400000,
      )
    : Infinity;
export const fmt = (date: string) =>
  date
    ? new Date(date + 'T12:00:00').toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
    : 'Not recorded';
export function demoNetwork(): Network {
  const d = emptyNetwork();
  const rows = [
    [
      'Isaac Lee',
      'Goldman Sachs',
      'Investment Banking Analyst',
      'Finance',
      'UWIG',
      4,
      80,
      130,
    ],
    [
      'Sarah Kim',
      'Microsoft',
      'Product Manager',
      'Technology',
      'Mentor',
      5,
      460,
      60,
    ],
    [
      'Jason Chen',
      'J.P. Morgan',
      'Investment Banking Associate',
      'Finance',
      'UWIG',
      3,
      820,
      160,
    ],
    [
      'Emily Park',
      'University of Washington',
      'Finance Student',
      'Education',
      'Classmate',
      4,
      80,
      430,
    ],
    [
      'Alex Wang',
      'Deloitte',
      'Strategy Consultant',
      'Consulting',
      'Alumni',
      3,
      460,
      410,
    ],
    [
      'Daniel Brooks',
      'Morgan Stanley',
      'Campus Recruiter',
      'Finance',
      'Recruiting',
      2,
      820,
      460,
    ],
  ];
  d.people = rows.map((r, i) => ({
    ...blankPerson(),
    id: 'demo-' + i,
    name: r[0] as string,
    company: r[1] as string,
    role: r[2] as string,
    industry: r[3] as string,
    tags: [r[4] as string],
    strength: r[5] as number,
    position: { x: r[6] as number, y: r[7] as number },
    linkedinUrl: `https://www.linkedin.com/in/connectkon-example-${i}`,
    howWeMet: i === 0 ? 'UW Investment Group' : 'University alumni community',
    reason: 'Career advice and staying connected',
    lastContact: '2026-09-03',
    followUp: i === 0 ? '2026-09-05' : i === 2 ? '2026-09-12' : '',
    nextConversation: 'Ask about their current projects and recruiting advice.',
  }));
  d.relationships = [
    {
      id: 'e1',
      source: 'demo-0',
      target: 'demo-2',
      type: 'Introduced me to',
      label: 'Introduced me to',
      notes: '',
    },
    {
      id: 'e2',
      source: 'demo-0',
      target: 'demo-3',
      type: 'Same Club',
      label: 'UWIG',
      notes: '',
    },
    {
      id: 'e3',
      source: 'demo-1',
      target: 'demo-4',
      type: 'Mentor',
      label: 'Mentor',
      notes: '',
    },
    {
      id: 'e4',
      source: 'demo-4',
      target: 'demo-5',
      type: 'Professional Connection',
      label: 'Professional connection',
      notes: '',
    },
  ];
  d.texts = [
    {
      id: 't1',
      text: 'THE PEOPLE BEHIND THE POSSIBILITIES',
      position: { x: 80, y: 15 },
      width: 355,
      height: 45,
    },
    {
      id: 't2',
      text: 'A little follow-up goes a long way.\nKeep the conversation going ↗',
      position: { x: 830, y: 30 },
      width: 285,
      height: 85,
    },
  ];
  d.conversations = [
    {
      id: 'c1',
      connectionId: 'demo-0',
      date: '2026-09-03',
      type: 'Coffee Chat',
      topics: ['IB Recruiting', 'UWIG'],
      summary:
        'Isaac shared how he balanced investment club commitments and recruiting. We talked about the analyst experience and building a strong technical foundation.',
      takeaways:
        'Start technical preparation early and make time for genuine conversations.',
      actions: [
        { id: 'a1', text: 'Send a thank-you message', completed: false },
        { id: 'a2', text: 'Research the analyst program', completed: true },
      ],
      followUp: '2026-09-05',
      privateNotes: '',
      createdAt: today(),
      updatedAt: today(),
    },
  ];
  return d;
}
