/**
 * Converts time string (HH:MM) to minutes since midnight
 */
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

/**
 * Converts minutes since midnight to time string (HH:MM)
 */
export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, "0")}:${mins
    .toString()
    .padStart(2, "0")}`;
}

/**
 * Calculates duration between start and end times in minutes
 */
export function calculateDuration(startTime: string, endTime: string): number {
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);

  // Handle overnight shifts (end time is next day)
  if (endMinutes < startMinutes) {
    return 24 * 60 - startMinutes + endMinutes;
  }

  return endMinutes - startMinutes;
}

/**
 * Formats duration in minutes to human-readable text (e.g., "1h 10m")
 */
export function formatDurationText(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours === 0) {
    return `${mins}m`;
  }

  if (mins === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${mins}m`;
}

/**
 * Validates time string format (HH:MM)
 */
export function isValidTimeFormat(time: string): boolean {
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
}

/**
 * Validates that end time is after start time (or next day)
 */
export function isValidTimeRange(startTime: string, endTime: string): boolean {
  if (!isValidTimeFormat(startTime) || !isValidTimeFormat(endTime)) {
    return false;
  }

  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);

  // Allow same time (0 duration) or end time after start time
  // Also allow overnight shifts (end time before start time)
  return startMinutes <= endMinutes || endMinutes < startMinutes;
}

/**
 * Gets current date in YYYY-MM-DD format (local timezone)
 */
export function getCurrentDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Formats date string to display format with relative dates (e.g., "Today", "Yesterday", "Mon, Jan 15")
 */
export function formatDateDisplay(dateString: string): string {
  const date = new Date(dateString + "T00:00:00");
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const todayString = getCurrentDateString();
  const yesterdayString = `${yesterday.getFullYear()}-${String(
    yesterday.getMonth() + 1
  ).padStart(2, "0")}-${String(yesterday.getDate()).padStart(2, "0")}`;

  if (dateString === todayString) {
    return "Today";
  }

  if (dateString === yesterdayString) {
    return "Yesterday";
  }

  // Check if it's within the last week
  const daysDiff = Math.floor(
    (today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (daysDiff <= 7 && daysDiff > 0) {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
    });
  }

  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

/**
 * Validates if a date string is in correct YYYY-MM-DD format
 */
export function isValidDateString(dateString: string): boolean {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString)) {
    return false;
  }

  const date = new Date(dateString + "T00:00:00");
  return date.toISOString().split("T")[0] === dateString;
}

/**
 * Checks if a date is in the past (before today)
 */
export function isPastDate(dateString: string): boolean {
  const date = new Date(dateString + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
}

/**
 * Checks if a date is too far in the future (more than 1 year from today)
 */
export function isFutureDate(dateString: string): boolean {
  const date = new Date(dateString + "T00:00:00");
  const today = new Date();
  const oneYearFromNow = new Date(today);
  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
  return date > oneYearFromNow;
}

/**
 * Gets a list of dates for the current week (Monday to Sunday)
 */
export function getCurrentWeekDates(): string[] {
  const today = new Date();
  const monday = new Date(today);
  const dayOfWeek = today.getDay();
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  monday.setDate(today.getDate() - daysToMonday);

  const weekDates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    weekDates.push(date.toISOString().split("T")[0]);
  }

  return weekDates;
}
