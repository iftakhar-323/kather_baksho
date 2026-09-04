import API from "./axios";

// Growth journal — backend mounts these at /api/journal*
export const getJournal = () => API.get("/journal");
export const addJournalEntry = (payload) => API.post("/journal", payload);
export const deleteJournalEntry = (id) => API.delete(`/journal/${id}`);
export const getJournalTimeline = () => API.get("/journal/timeline");

// Care schedule — /api/care-schedule (add/delete are admin-only on the backend)
export const getSchedules = () => API.get("/care-schedule");
export const addSchedule = (payload) => API.post("/care-schedule", payload);
export const updateSchedule = (id, payload) =>
  API.put(`/care-schedule/${id}`, payload);
export const deleteSchedule = (id) => API.delete(`/care-schedule/${id}`);

// Care calendar (computed from schedules) — /api/care-calendar?month=YYYY-MM
export const getCareCalendar = (month) =>
  API.get("/care-calendar", { params: { month } });
