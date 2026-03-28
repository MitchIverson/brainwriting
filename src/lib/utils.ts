import { v4 as uuidv4 } from 'uuid';

// Characters excluding ambiguous ones: 0/O, 1/I/L
const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export function genId(): string {
  // Use crypto if available, fallback to uuid-style
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return uuidv4();
}

export function genCode(): string {
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return code;
}

export function getUserId(): string {
  if (typeof window === 'undefined') return '';
  let userId = localStorage.getItem('brainwriting_user_id');
  if (!userId) {
    userId = genId();
    localStorage.setItem('brainwriting_user_id', userId);
  }
  return userId;
}

export function getUserName(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('brainwriting_user_name') || '';
}

export function setUserName(name: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('brainwriting_user_name', name);
}

export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}
