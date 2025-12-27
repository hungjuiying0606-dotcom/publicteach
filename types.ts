
export enum TeachingMode {
  LECTURE = '講述教學',
  DISCUSSION = '小組討論',
  PRACTICE = '實作/演算',
  DIGITAL = '數位運用',
  NONE = '無'
}

export enum TeachingAction {
  ENCOURAGE = '正向鼓勵',
  CORRECT = '糾正規範',
  OPEN_Q = '開放提問',
  CLOSED_Q = '封閉提問',
  WALK = '巡視走動'
}

export interface ObservationLog {
  id: string;
  timestamp: number;
  relativeTime: number; // Seconds since start
  type: 'MODE_CHANGE' | 'ACTION' | 'NOTE' | 'ENGAGEMENT';
  label: string;
  value?: string | number;
}

export type EngagementLevel = 'LOW' | 'MID' | 'HIGH';

export interface SessionData {
  startTime: number | null;
  endTime: number | null;
  subject: string;
  logs: ObservationLog[];
  modeDurations: Record<string, number>; // Seconds per mode
}
