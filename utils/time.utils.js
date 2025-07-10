export const shiftSlotTime = (slotTime, msShift) => {
  const [startStr, endStr] = slotTime.split(" - ");
  const [sh, sm] = startStr.split(":" ).map(Number);
  const [eh, em] = endStr.split(":" ).map(Number);

  const start = new Date(0, 0, 0, sh, sm);
  const end = new Date(0, 0, 0, eh, em);

  const newStart = new Date(start.getTime() + msShift);
  const newEnd = new Date(end.getTime() + msShift);

  return `${pad(newStart.getHours())}:${pad(newStart.getMinutes())} - ${pad(newEnd.getHours())}:${pad(newEnd.getMinutes())}`;
};

const pad = n => n < 10 ? `0${n}` : `${n}`;