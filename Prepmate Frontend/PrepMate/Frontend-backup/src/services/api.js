import axios from 'axios';
import { auth } from '../config/firebaseConfig';

const api = axios.create({
  baseURL: 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request Interceptor: Attach Firebase ID Token
api.interceptors.request.use(
  async (config) => {
    if (auth.currentUser) {
      try {
        const token = await auth.currentUser.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
      } catch (error) {
        console.error("Error getting Firebase token", error);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Global error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// --- User Profile ---
export const syncUser = (userData) => api.post('/users/sync', userData);
export const getUserProfile = (userId) => api.get('/users/${userId}`);
export const getUserByFirebaseUid = (uid) => api.get('/users/firebase/${uid}`);
export const updateUserProfile = (userId, userData) => api.put('/users/${userId}`, userData);
export const deleteUser = (userId) => api.delete('/users/${userId}`);

// --- Static Data ---
export const getExams = () => api.get('/static-data/exams');
export const getStreams = (examId) => api.get('/static-data/exams/${examId}/streams`);
export const getSubjectsByStream = (streamId) => api.get('/static-data/streams/${streamId}/subjects`);
export const getSubjectsByStreamName = (streamName) => api.get('/static-data/streams/name/${encodeURIComponent(streamName.replace(/\//g, "-"))}/subjects`);
export const getSubjectsByExamAndStream = (examId, streamId) => api.get('/static-data/exams/${examId}/streams/${streamId}/subjects`);
export const getSubjectsByExamNameAndStreamName = (examName, streamName) => api.get('/static-data/exams/name/${encodeURIComponent(examName)}/streams/name/${encodeURIComponent(streamName.replace(/\//g, "-"))}/subjects`);
export const getTopics = (subjectId) => api.get('/static-data/subjects/${subjectId}/topics`);
export const getSignupConfig = () => api.get('/static-data/signup-config');

// --- Dashboard ---
export const getDashboardStats = (userId) => api.get('/dashboard/stats?userId=${userId}`);

// --- Tasks ---
export const getTasks = (userId) => api.get('/tasks?userId=${userId}`);
export const getTasksByDate = (userId, date) => api.get('/tasks/date/${date}?userId=${userId}`);
export const getTasksByStatus = (userId, status) => api.get('/tasks/status/${status}?userId=${userId}`);
export const getTaskById = (id) => api.get('/tasks/${id}`);
export const createTask = (userId, task) => api.post('/tasks?userId=${userId}`, task);
export const updateTask = (id, task) => api.put('/tasks/${id}`, task);
export const updateTaskStatus = (id, status) => api.patch('/tasks/${id}/status?status=${status}`);
export const deleteTask = (id) => api.delete('/tasks/${id}`);

// --- Tests ---
export const getTests = (userId) => api.get('/tests?userId=${userId}`);
export const getTestById = (id) => api.get('/tests/${id}`);
export const getTestStats = (userId) => api.get('/tests/stats?userId=${userId}`);
export const createTest = (userId, test) => api.post('/tests?userId=${userId}`, test);
export const updateTest = (id, test) => api.put('/tests/${id}`, test);
export const deleteTest = (id) => api.delete('/tests/${id}`);

// --- Flashcards ---
export const getFlashcards = (userId) => api.get('/flashcards?userId=${userId}`);
export const getFlashcardsBySubject = (userId, subject) => api.get('/flashcards/subject/${subject}?userId=${userId}`);
export const getFlashcardById = (id) => api.get('/flashcards/${id}`);
export const createFlashcard = (userId, flashcard) => api.post('/flashcards?userId=${userId}`, flashcard);
export const updateFlashcard = (id, flashcard) => api.put('/flashcards/${id}`, flashcard);
export const updateFlashcardStatus = (id, status) => api.patch('/flashcards/${id}/status?status=${status}`);
export const deleteFlashcard = (id) => api.delete('/flashcards/${id}`);

// --- Resources ---
export const getResources = (userId) => api.get('/resources?userId=${userId}`);
export const getResourcesByCategory = (userId, category) => api.get('/resources/category/${category}?userId=${userId}`);
export const getResourceById = (id) => api.get('/resources/${id}`);
export const createResource = (userId, resource) => api.post('/resources?userId=${userId}`, resource);
export const updateResource = (id, resource) => api.put('/resources/${id}`, resource);
export const toggleResourceFavorite = (id) => api.patch('/resources/${id}/favorite`);
export const deleteResource = (id) => api.delete('/resources/${id}`);

// --- Revisions ---
export const getRevisions = (userId) => api.get('/revisions?userId=${userId}`);
export const getUpcomingRevisions = (userId) => api.get('/revisions/upcoming?userId=${userId}`);
export const getRevisionById = (id) => api.get('/revisions/${id}`);
export const createRevision = (userId, revision) => api.post('/revisions?userId=${userId}`, revision);
export const updateRevision = (id, revision) => api.put('/revisions/${id}`, revision);
export const markRevisionComplete = (id) => api.patch('/revisions/${id}/complete`);
export const deleteRevision = (id) => api.delete('/revisions/${id}`);

// --- Deadlines ---
export const getDeadlines = (userId) => api.get('/deadlines?userId=${userId}`);
export const getActiveDeadlines = (userId) => api.get('/deadlines/active?userId=${userId}`);
export const getDeadlineById = (id) => api.get('/deadlines/${id}`);
export const createDeadline = (userId, deadline) => api.post('/deadlines?userId=${userId}`, deadline);
export const updateDeadline = (id, deadline) => api.put('/deadlines/${id}`, deadline);
export const toggleDeadlineComplete = (id) => api.patch('/deadlines/${id}/toggle`);
export const deleteDeadline = (id) => api.delete('/deadlines/${id}`);

// --- Goals ---
export const getGoals = (userId) => api.get('/goals?userId=${userId}`);
export const getGoalsByType = (userId, type) => api.get('/goals/type/${type}?userId=${userId}`);
export const getGoalById = (id) => api.get('/goals/${id}`);
export const createGoal = (userId, goal) => api.post('/goals?userId=${userId}`, goal);
export const updateGoal = (id, goal) => api.put('/goals/${id}`, goal);
export const deleteGoal = (id) => api.delete('/goals/${id}`);

// --- Habits ---
export const getHabits = (userId) => api.get('/habits?userId=${userId}`);
export const getHabitById = (id) => api.get('/habits/${id}`);
export const createHabit = (userId, habit) => api.post('/habits?userId=${userId}`, habit);
export const updateHabit = (id, habit) => api.put('/habits/${id}`, habit);
export const toggleHabitCompletion = (id, date) => api.patch('/habits/${id}/toggle?date=${date}`);
export const deleteHabit = (id) => api.delete('/habits/${id}`);

// --- Distractions ---
export const getDistractions = (userId) => api.get('/distractions?userId=${userId}`);
export const getDistractionById = (id) => api.get('/distractions/${id}`);
export const getDistractionStats = (userId) => api.get('/distractions/stats?userId=${userId}`);
export const createDistraction = (userId, distraction) => api.post('/distractions?userId=${userId}`, distraction);
export const deleteDistraction = (id) => api.delete('/distractions/${id}`);

// --- Reflections ---
export const getReflections = (userId) => api.get('/reflections?userId=${userId}`);
export const getReflectionById = (id) => api.get('/reflections/${id}`);
export const getMonthlyReflectionStats = (userId, year, month) => api.get('/reflections/monthly-stats?userId=${userId}&year=${year}&month=${month}`);
export const createReflection = (userId, reflection) => api.post('/reflections?userId=${userId}`, reflection);
export const updateReflection = (id, reflection) => api.put('/reflections/${id}`, reflection);
export const deleteReflection = (id) => api.delete('/reflections/${id}`);

// --- Timer Sessions ---
export const getTimerSessions = (userId) => api.get('/timer-sessions?userId=${userId}`);
export const getTimerSessionsByDate = (userId, date) => api.get('/timer-sessions/date/${date}?userId=${userId}`);
export const logTimerSession = (userId, session) => api.post('/timer-sessions?userId=${userId}`, session);
export const deleteTimerSession = (id) => api.delete('/timer-sessions/${id}`);

// --- Timetable ---
export const getTimetableEvents = (userId) => api.get('/timetable?userId=${userId}`);
export const getTimetableEventsByDate = (userId, date) => api.get('/timetable/date/${date}?userId=${userId}`);
export const createTimetableEvent = (userId, event) => api.post('/timetable?userId=${userId}`, event);
export const updateTimetableEvent = (id, event) => api.put('/timetable/${id}`, event);
export const deleteTimetableEvent = (id) => api.delete('/timetable/${id}`);

// --- Wellbeing ---
export const logWellbeing = (userId, log) => api.post('/wellbeing?userId=${userId}`, log);
export const getWellbeingToday = (userId) => api.get('/wellbeing/today?userId=${userId}`);
export const getWellbeingWeekly = (userId) => api.get('/wellbeing/weekly?userId=${userId}`);
export const getAllWellbeingLogs = (userId) => api.get('/wellbeing?userId=${userId}`);

// --- Vision Images ---
export const getVisionImages = (userId) => api.get('/vision-images?userId=${userId}`);
export const createVisionImage = (userId, image) => api.post('/vision-images?userId=${userId}`, image);
export const deleteVisionImage = (id) => api.delete('/vision-images/${id}`);

// --- Planner: Yearly ---
export const getYearlyPlans = (userId, year) => api.get('/planner/yearly?userId=${userId}&year=${year}`);
export const createYearlyPlan = (userId, plan) => api.post('/planner/yearly?userId=${userId}`, plan);
export const updateYearlyPlan = (id, plan) => api.put('/planner/yearly/${id}`, plan);
export const deleteYearlyPlan = (id) => api.delete('/planner/yearly/${id}`);

// --- Planner: Monthly ---
export const getMonthlyTasks = (userId, month, year) => api.get('/planner/monthly?userId=${userId}&month=${month}&year=${year}`);
export const createMonthlyTask = (userId, task) => api.post('/planner/monthly?userId=${userId}`, task);
export const updateMonthlyTask = (id, task) => api.put('/planner/monthly/${id}`, task);
export const deleteMonthlyTask = (id) => api.delete('/planner/monthly/${id}`);

// --- Planner: Weekly ---
export const getWeeklyTopics = (userId, weekStartDate) => api.get('/planner/weekly?userId=${userId}&weekStartDate=${weekStartDate}`);
export const createWeeklyTopic = (userId, topic) => api.post('/planner/weekly?userId=${userId}`, topic);
export const updateWeeklyTopic = (id, topic) => api.put('/planner/weekly/${id}`, topic);
export const deleteWeeklyTopic = (id) => api.delete('/planner/weekly/${id}`);

// Default export
export default api;