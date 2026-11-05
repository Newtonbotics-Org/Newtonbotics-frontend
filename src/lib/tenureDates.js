export function formatTenureDate(value) {
  if (value == null || value === '' || typeof value === 'boolean') return '';
  if (typeof value === 'number') return String(value);

  const d = typeof value === 'string' ? new Date(value) : value instanceof Date ? value : new Date(value);
  if (!d || typeof d.getTime !== 'function' || Number.isNaN(d.getTime())) return '';

  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export function formatTenureRange(start, end) {
  const startLabel = formatTenureDate(start);
  if (!startLabel) return '';
  const endLabel = end ? formatTenureDate(end) : '';
  if (!endLabel || endLabel === startLabel) return startLabel;
  return `${startLabel} – ${endLabel}`;
}

export function tenureSortValue(value) {
  if (value == null || value === '' || typeof value === 'boolean') return 0;
  if (typeof value === 'number') return value * 10000;
  const d = typeof value === 'string' ? new Date(value) : value instanceof Date ? value : new Date(value);
  if (!d || typeof d.getTime !== 'function' || Number.isNaN(d.getTime())) return 0;
  return d.getTime();
}
