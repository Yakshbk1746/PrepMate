const GOOGLE_CALENDAR_TOKEN_KEY = 'prepmateGoogleCalendarToken';

export const getGoogleCalendarToken = () => localStorage.getItem(GOOGLE_CALENDAR_TOKEN_KEY) || '';

export const clearGoogleCalendarToken = () => {
  localStorage.removeItem(GOOGLE_CALENDAR_TOKEN_KEY);
};

const toIsoDateKey = (event) => {
  const start = event?.start;
  if (!start) return '';

  if (start.date) {
    return String(start.date);
  }

  if (start.dateTime) {
    const parsed = new Date(start.dateTime);
    if (Number.isNaN(parsed.getTime())) return '';
    return parsed.toISOString().split('T')[0];
  }

  return '';
};

export const fetchGoogleCalendarEventsByDate = async ({ token, monthStart, monthEnd }) => {
  if (!token) {
    return {};
  }

  const params = new URLSearchParams({
    timeMin: monthStart.toISOString(),
    timeMax: monthEnd.toISOString(),
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '250',
  });

  const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status === 401) {
    const err = new Error('Google Calendar session expired. Please connect again.');
    err.code = 'GOOGLE_CALENDAR_UNAUTHORIZED';
    throw err;
  }

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || 'Failed to fetch Google Calendar events.');
  }

  const data = await response.json();
  const events = Array.isArray(data?.items) ? data.items : [];

  return events.reduce((acc, event) => {
    const dayKey = toIsoDateKey(event);
    if (!dayKey) return acc;
    acc[dayKey] = (acc[dayKey] || 0) + 1;
    return acc;
  }, {});
};
