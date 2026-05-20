export function formatMonthYear(month: number, year: number): string {
  const date = new Date(year, month - 1, 1);
  return date.toLocaleString("en-ZA", { month: "long", year: "numeric" });
}

export function formatBytes(n: number | null | undefined): string {
  if (!n) return "—";
  const units = ["B", "KB", "MB", "GB"];
  let value = n;
  let i = 0;
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i++;
  }
  return `${value.toFixed(value < 10 ? 1 : 0)} ${units[i]}`;
}
