import { format, formatDistanceToNow, parseISO } from "date-fns";
import { vi } from "date-fns/locale";

/**
 * Format a date string to relative time (e.g., "3 phút trước")
 */
export const formatRelative = (date) => {
  if (!date) return "N/A";
  const d = typeof date === "string" ? parseISO(date) : date;
  return formatDistanceToNow(d, { addSuffix: true, locale: vi });
};

/**
 * Format date for display in tables/logs
 */
export const formatDate = (date, pattern = "HH:mm:ss - dd/MM/yyyy") => {
  if (!date) return "N/A";
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, pattern, { locale: vi });
};

/**
 * Get simple time string
 */
export const formatTime = (date) => {
  if (!date) return "--:--";
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "HH:mm");
};
