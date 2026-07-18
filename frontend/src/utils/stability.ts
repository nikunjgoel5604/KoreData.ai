/**
 * stability.ts — Stability and defensive programming helper utilities.
 * Ensures zero undefined property access crashes, safe sorting, and data normalization.
 */

/**
 * Safe String Comparison helper.
 * Handles null, undefined, different types, and performs case-insensitive comparisons.
 */
export function safeCompareString(a: any, b: any, desc = false): number {
  const strA = String(a ?? "").trim().toLowerCase();
  const strB = String(b ?? "").trim().toLowerCase();
  const res = strA.localeCompare(strB);
  return desc ? -res : res;
}

/**
 * Safe Date parser.
 * Supports ISO strings, timestamps, and invalid fallbacks.
 */
export function parseDateToMs(val: any): number {
  if (!val) return 0;
  try {
    const time = Date.parse(String(val).trim());
    return isNaN(time) ? 0 : time;
  } catch (e) {
    return 0;
  }
}

/**
 * Safe Date Comparison helper.
 * Invalid dates are sorted at the end.
 */
export function safeCompareDate(a: any, b: any, desc = false): number {
  const timeA = parseDateToMs(a);
  const timeB = parseDateToMs(b);

  if (timeA === 0 && timeB > 0) return 1;
  if (timeB === 0 && timeA > 0) return -1;
  if (timeA === timeB) return 0;

  const res = timeA - timeB;
  return desc ? -res : res;
}

/**
 * Safe numeric parsers.
 */
export function safeParseFloat(val: any, fallback = 0): number {
  if (typeof val === "number") return isNaN(val) ? fallback : val;
  if (!val) return fallback;
  const num = parseFloat(String(val).trim());
  return isNaN(num) ? fallback : num;
}

export function safeParseInt(val: any, fallback = 0): number {
  if (typeof val === "number") return isNaN(val) ? fallback : Math.floor(val);
  if (!val) return fallback;
  const num = parseInt(String(val).trim(), 10);
  return isNaN(num) ? fallback : num;
}

/**
 * Safe Storage parsing and comparison helper.
 * Converts KB, MB, GB, TB to bytes for correct numerical sorting.
 */
export function parseStorageToBytes(storageStr: any): number {
  if (!storageStr) return 0;
  const str = String(storageStr).trim().toLowerCase();
  const match = str.match(/^([\d.]+)\s*(kb|mb|gb|tb|b)?$/);
  if (!match) return 0;
  
  const num = parseFloat(match[1]);
  if (isNaN(num)) return 0;
  
  const unit = match[2] || "kb";
  const multipliers: Record<string, number> = {
    b: 1,
    kb: 1024,
    mb: 1024 * 1024,
    gb: 1024 * 1024 * 1024,
    tb: 1024 * 1024 * 1024 * 1024
  };
  return num * (multipliers[unit] || 1);
}

export function safeCompareStorageSize(a: any, b: any, desc = false): number {
  const bytesA = parseStorageToBytes(a);
  const bytesB = parseStorageToBytes(b);
  const res = bytesA - bytesB;
  return desc ? -res : res;
}

/**
 * Safe array sorter utility.
 */
export function safeSortArray<T>(
  arr: T[] | null | undefined,
  keyExtractor: (item: T) => any,
  compareType: "string" | "date" | "number" | "storage" = "string",
  desc = false
): T[] {
  if (!arr || !Array.isArray(arr)) return [];
  return [...arr].sort((a, b) => {
    const valA = keyExtractor(a);
    const valB = keyExtractor(b);

    switch (compareType) {
      case "number": {
        const numA = safeParseFloat(valA);
        const numB = safeParseFloat(valB);
        return desc ? numB - numA : numA - numB;
      }
      case "date":
        return safeCompareDate(valA, valB, desc);
      case "storage":
        return safeCompareStorageSize(valA, valB, desc);
      case "string":
      default:
        return safeCompareString(valA, valB, desc);
    }
  });
}
