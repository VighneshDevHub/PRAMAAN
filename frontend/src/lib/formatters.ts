/**
 * PRAMAAN - Centralized Indian Standard Time (IST) & Regional Formatters
 * Formats timestamps in en-IN locale with Asia/Kolkata timezone:
 * e.g., "12 Sep 2026, 07:06:41 PM IST" or "12/09/2026, 07:06 PM IST"
 */

export function formatIndianDateTime(
  dateInput: string | Date | number | null | undefined,
  opts?: { includeSeconds?: boolean; style?: "short" | "medium" | "full" }
): string {
  if (!dateInput) return "—";
  try {
    const d = typeof dateInput === "string" || typeof dateInput === "number" ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return "—";

    const style = opts?.style ?? "medium";

    if (style === "short") {
      // 12/09/2026, 07:06 PM IST
      const formatted = d.toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: opts?.includeSeconds ? "2-digit" : undefined,
        hour12: true,
      });
      return `${formatted} IST`;
    }

    // Default medium: "12 Sep 2026, 07:06:41 PM IST"
    const formatted = d.toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: opts?.includeSeconds !== false ? "2-digit" : undefined,
      hour12: true,
    });
    return `${formatted} IST`;
  } catch {
    return String(dateInput);
  }
}

export function formatIndianDate(dateInput: string | Date | number | null | undefined): string {
  if (!dateInput) return "—";
  try {
    const d = typeof dateInput === "string" || typeof dateInput === "number" ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return "—";

    return d.toLocaleDateString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return String(dateInput);
  }
}

export function formatIndianTime(dateInput: string | Date | number | null | undefined): string {
  if (!dateInput) return "—";
  try {
    const d = typeof dateInput === "string" || typeof dateInput === "number" ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return "—";

    const formatted = d.toLocaleTimeString("en-IN", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
    return `${formatted} IST`;
  } catch {
    return String(dateInput);
  }
}
