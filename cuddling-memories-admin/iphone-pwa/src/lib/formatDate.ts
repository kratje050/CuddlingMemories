const pad = (value: number) => String(value).padStart(2, "0");

function parseDate(value: string | Date) {
  if (value instanceof Date) return value;
  const dateOnly = String(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnly) return new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]), 12, 0, 0);
  return new Date(value);
}

export function formatMobileDate(value: string | Date) {
  const date = parseDate(value);
  if (Number.isNaN(date.getTime())) return "-";
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${String(date.getFullYear()).slice(-2)}`;
}

export function formatMobileDateTime(value: string | Date) {
  const date = parseDate(value);
  if (Number.isNaN(date.getTime())) return "-";
  return `${formatMobileDate(date)} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
