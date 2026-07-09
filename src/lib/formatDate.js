const pad = (value) => String(value).padStart(2, "0");

export function formatDate(input) {
  if (!input) return "-";
  const date = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) return "-";
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${String(date.getFullYear()).slice(-2)}`;
}

export function formatDateTime(input) {
  if (!input) return "-";
  const date = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) return "-";
  return `${formatDate(date)} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
