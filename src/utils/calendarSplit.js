export function splitForCalendar(ev) {
  const actStart = ev.actualClockIn || ev.actualStartAt;
  const actEnd   = ev.actualClockOut || ev.actualEndAt;

  const regStart = ev.registeredClockIn || ev.registeredStartAt || ev.startAt;
  const regEnd   = ev.registeredClockOut || ev.registeredEndAt || ev.endAt;

  const startIso = (actStart && actEnd) ? actStart : regStart;
  const endIso   = (actStart && actEnd) ? actEnd   : regEnd;

  if (!startIso || !endIso) {
    const day = (startIso || endIso || ev.date || '').slice(0, 10);
    return [{ ...ev, scheduleId: ev.id, uiKey: `${ev.id}:${day}`, cellDate: day }];
  }

  const dayStart = String(startIso).slice(0, 10);
  const dayEnd   = String(endIso).slice(0, 10);

  if (dayStart === dayEnd) {
    return [{ ...ev, scheduleId: ev.id, uiKey: `${ev.id}:${dayStart}`, cellDate: dayStart }];
  }

  const end = new Date(endIso);
  const isEndAtMidnight =
    end.getHours() === 0 && end.getMinutes() === 0 && end.getSeconds() === 0;

  const head = {
    ...ev,
    scheduleId: ev.id,
    uiKey: `${ev.id}:${dayStart}`,
    cellDate: dayStart,
    isOvernight: true,
    part: 'HEAD',
  };

  if (isEndAtMidnight) {
    return [head];
  }

  const tail = {
    ...ev,
    scheduleId: ev.id,
    uiKey: `${ev.id}:${dayEnd}`,
    cellDate: dayEnd,
    isOvernight: true,
    part: 'TAIL',
  };

  return [head, tail];
}
