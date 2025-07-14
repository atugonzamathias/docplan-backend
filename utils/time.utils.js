/**
 * Shift a slot time string by a given duration in milliseconds.
 * E.g., shift "14:00 - 14:30" by +30 minutes.
 */
export const shiftSlotTime = (slotTime, msShift) => {
  const [startStr, endStr] = slotTime.split(" - ");
  const [sh, sm] = startStr.split(":").map(Number);
  const [eh, em] = endStr.split(":").map(Number);

  const start = new Date(0, 0, 0, sh, sm);
  const end = new Date(0, 0, 0, eh, em);

  const newStart = new Date(start.getTime() + msShift);
  const newEnd = new Date(end.getTime() + msShift);

  return `${pad(newStart.getHours())}:${pad(newStart.getMinutes())} - ${pad(newEnd.getHours())}:${pad(newEnd.getMinutes())}`;
};

/**
 * Pad time values (e.g., 9 → "09").
 */
const pad = n => n < 10 ? `0${n}` : `${n}`;

/**
 * Get the weekday name from a YYYY-MM-DD string.
 * Example: "2025-07-11" → "Friday"
 */
export const getDayNameFromDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { weekday: 'long' });
};
