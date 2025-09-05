export interface Shift {
  id: string;
  start: string; // HH:MM format
  end: string; // HH:MM format
  durationMinutes: number;
  durationText: string; // e.g., "1h 10m"
  createdAt: number; // timestamp
}

export interface Submission {
  id: string;
  shifts: Shift[];
  totalMinutes: number;
  totalText: string;
  submittedAt: number; // timestamp when this submission was created
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
