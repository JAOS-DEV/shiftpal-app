export interface Shift {
  id: string;
  start: string; // HH:MM format
  end: string; // HH:MM format
  durationMinutes: number;
  durationText: string; // e.g., "1h 10m"
  createdAt: number; // timestamp
  note?: string; // optional note for the shift
  // Optional break tracking for timer-based shifts
  breakMinutes?: number; // total break minutes (not counted when includeBreaks=false)
  breakCount?: number; // number of break intervals
  includeBreaks?: boolean; // whether breaks were counted into duration
  // Detailed breaks captured from timer (if created via timer)
  breaks?: Array<{
    start: number; // epoch ms
    end: number; // epoch ms
    durationMinutes: number;
    note?: string;
  }>;
}

export interface Submission {
  id: string;
  shifts: Shift[];
  totalMinutes: number;
  totalText: string;
  submittedAt: number; // timestamp when this submission was created
}

export type TimerStatus = "idle" | "running" | "paused";

export interface RunningTimer {
  id: string; // unique session id
  date: string; // YYYY-MM-DD (based on local start date)
  startedAt: number; // epoch ms
  status: TimerStatus;
  pauses: Array<{ start: number; end?: number; note?: string }>; // open interval when paused
  lastUpdatedAt: number;
}

export interface Day {
  id: string;
  date: string; // YYYY-MM-DD format
  submissions: Submission[];
  totalMinutes: number;
  totalText: string; // e.g., "7h 35m"
  submittedAt?: number; // timestamp of latest submission
}

export interface HistoryFilter {
  type: "week" | "month" | "all" | "custom";
  startDate?: string;
  endDate?: string;
}
