import { AppSettings } from "@/types/settings";

/**
 * Formats a date string (YYYY-MM-DD) according to user preferences
 */
export function formatDate(
  dateString: string,
  settings?: AppSettings | null
): string {
  const dateFormat = settings?.preferences?.dateFormat || "DD/MM/YYYY";
  const [year, month, day] = dateString.split("-");

  switch (dateFormat) {
    case "MM/DD/YYYY":
      return `${month}/${day}/${year}`;
    case "DD/MM/YYYY":
    default:
      return `${day}/${month}/${year}`;
  }
}

/**
 * Formats a time string (HH:MM) according to user preferences
 */
export function formatTime(
  timeString: string,
  settings?: AppSettings | null
): string {
  const timeFormat = settings?.preferences?.timeFormat || "24h";

  if (timeFormat === "12h") {
    const [hours, minutes] = timeString.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
  }

  return timeString; // 24h format
}

/**
 * Converts 12-hour time to 24-hour format for storage
 */
export function convertTo24Hour(timeString: string): string {
  const match = timeString.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return timeString;

  let [, hours, minutes, period] = match;
  let hour24 = parseInt(hours, 10);

  if (period.toUpperCase() === "AM" && hour24 === 12) {
    hour24 = 0;
  } else if (period.toUpperCase() === "PM" && hour24 !== 12) {
    hour24 += 12;
  }

  return `${hour24.toString().padStart(2, "0")}:${minutes}`;
}

/**
 * Converts 24-hour time to 12-hour format for display
 */
export function convertTo12Hour(timeString: string): string {
  const [hours, minutes] = timeString.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
}

/**
 * Gets currency symbol based on user preferences
 */
export function getCurrencySymbol(settings?: AppSettings | null): string {
  const currency = settings?.preferences?.currency || "GBP";

  switch (currency) {
    case "USD":
      return "$";
    case "EUR":
      return "€";
    case "GBP":
    default:
      return "£";
  }
}

/**
 * Formats currency amount with proper symbol
 */
export function formatCurrency(
  amount: number,
  settings?: AppSettings | null
): string {
  const symbol = getCurrencySymbol(settings);
  return `${symbol}${amount.toFixed(2)}`;
}
