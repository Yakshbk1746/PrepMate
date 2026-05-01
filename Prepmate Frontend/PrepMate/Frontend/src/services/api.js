import axios from 'axios';

const api = axios.create({
  baseURL: 'https://prepmate-tn24.onrender.com/api',
});

// Deduplicate identical in-flight GET requests so concurrent callers reuse one network trip.
const rawGet = api.get.bind(api);
const inflightGetRequests = new Map();

const buildGetRequestKey = (url, config = {}) => {
  const params = config?.params || {};
  return `${url}::${JSON.stringify(params)}`;
};

api.get = (url, config = {}) => {
  const requestKey = buildGetRequestKey(url, config);

  if (inflightGetRequests.has(requestKey)) {
    return inflightGetRequests.get(requestKey);
  }

  const requestPromise = rawGet(url, config).finally(() => {
    inflightGetRequests.delete(requestKey);
  });

  inflightGetRequests.set(requestKey, requestPromise);
  return requestPromise;
};

const withUserParams = (userId) => ({
  params: { userId },
});

const splitCsv = (value) => {
  if (!value || typeof value !== 'string') {
    return [];
  }

  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

const parseErrorBook = (errors) => {
  if (!errors) {
    return [];
  }

  if (Array.isArray(errors)) {
    return errors;
  }

  if (typeof errors === 'string') {
    try {
      const parsed = JSON.parse(errors);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  return [];
};

const normalizeTest = (test) => {
  const type = test?.type || 'topic';
  const subjects = splitCsv(test?.subjects);
  const topicsList = splitCsv(test?.topics);

  const topics = {};
  if (type === 'topic' && subjects.length > 0) {
    topics[subjects[0]] = topicsList.length > 0 ? topicsList : ['General'];
  } else if (type === 'subject' && subjects.length > 0) {
    subjects.forEach((subject) => {
      topics[subject] = topicsList;
    });
  }

  return {
    id: test?.id ?? Date.now(),
    name: test?.name || 'Untitled Test',
    type,
    subjects: subjects.length > 0 ? subjects : (type === 'mock' ? ['Full Syllabus'] : []),
    topics,
    score: Number.isFinite(Number(test?.score)) ? Number(test.score) : 0,
    total: Number.isFinite(Number(test?.total)) && Number(test.total) > 0 ? Number(test.total) : 100,
    duration: Number.isFinite(Number(test?.duration)) ? Number(test.duration) : 0,
    date: test?.date || new Date().toISOString().split('T')[0],
    errors: parseErrorBook(test?.errors),
  };
};

const serializeTestPayload = (test = {}) => {
  const type = test?.type || 'topic';
  const subjects = Array.isArray(test?.subjects)
    ? test.subjects.filter(Boolean)
    : splitCsv(test?.subjects);

  const topics = (() => {
    if (Array.isArray(test?.topics)) {
      return test.topics.filter(Boolean);
    }

    if (test?.topics && typeof test.topics === 'object') {
      return Object.values(test.topics)
        .flat()
        .filter(Boolean);
    }

    return splitCsv(test?.topics);
  })();

  return {
    name: test?.name,
    type,
    subjects: subjects.join(', '),
    topics: topics.join(', '),
    score: Number.isFinite(Number(test?.score)) ? Number(test.score) : null,
    total: Number.isFinite(Number(test?.total)) ? Number(test.total) : null,
    duration: Number.isFinite(Number(test?.duration)) ? Number(test.duration) : null,
    errors: Array.isArray(test?.errors) ? JSON.stringify(test.errors) : (typeof test?.errors === 'string' ? test.errors : null),
    date: test?.date,
  };
};

export const getProtectedData = async (token) => {
  return api.get('/data', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const getDashboardTasks = async (userId) => {
  const response = await api.get('/dashboard/tasks', withUserParams(userId));
  return Array.isArray(response.data?.tasks) ? response.data.tasks : [];
};

export const getDashboardRevisions = async (userId) => {
  const response = await api.get('/dashboard/revisions', withUserParams(userId));
  return Array.isArray(response.data?.revisions) ? response.data.revisions : [];
};

export const getDashboardData = async (userId) => {
  const [tasks, revisions] = await Promise.all([
    getDashboardTasks(userId),
    getDashboardRevisions(userId),
  ]);

  return { tasks, revisions };
};

export const getTests = async (userId) => {
  const response = await api.get('/tests', withUserParams(userId));
  const data = Array.isArray(response.data) ? response.data : [];
  return data.map(normalizeTest);
};

export const createTest = async (userId, test) => {
  const response = await api.post('/tests', serializeTestPayload(test), { params: { userId } });
  return normalizeTest(response.data);
};

export const updateTest = async (testId, test) => {
  const response = await api.put(`/tests/${testId}`, serializeTestPayload(test));
  return normalizeTest(response.data);
};

export const deleteTest = async (testId) => {
  await api.delete(`/tests/${testId}`);
};

// --- USER ---
export const syncUser = async (payload) => {
  const response = await api.post('/users/sync', payload);
  return response.data;
};

export const getUserByFirebaseUid = async (uid) => {
  try {
    const response = await api.get(`/users/firebase/${uid}`);
    return response.data;
  } catch (error) {
    if (error?.response?.status === 404) {
      return null;
    }
    throw error;
  }
};

export const updateUserProfile = async (userId, payload) => {
  const response = await api.put(`/users/${userId}`, payload);
  return response.data;
};

// --- TASKS (Daily Planner) ---
export const getTasks = async (userId) => {
  const response = await api.get('/tasks', withUserParams(userId));
  return Array.isArray(response.data) ? response.data : [];
};

export const createTask = async (userId, task) => {
  const response = await api.post('/tasks', task, { params: { userId } });
  return response.data;
};

export const updateTask = async (taskId, task) => {
  const response = await api.put(`/tasks/${taskId}`, task);
  return response.data;
};

export const deleteTask = async (taskId, userId) => {
  const config = userId ? withUserParams(userId) : undefined;
  await api.delete(`/tasks/${taskId}`, config);
};

export const deleteTaskForUser = async (userId, taskId) => {
  await api.delete(`/tasks/${taskId}`, withUserParams(userId));
};

// --- REVISIONS ---
export const getRevisions = async (userId) => {
  const response = await api.get('/revisions', withUserParams(userId));
  return Array.isArray(response.data) ? response.data : [];
};

export const createRevision = async (userId, revision) => {
  const response = await api.post('/revisions', revision, { params: { userId } });
  return response.data;
};

export const updateRevision = async (revisionId, revision) => {
  const response = await api.put(`/revisions/${revisionId}`, revision);
  return response.data;
};

export const markRevisionComplete = async (revisionId) => {
  const response = await api.patch(`/revisions/${revisionId}/complete`);
  return response.data;
};

export const deleteRevision = async (revisionId) => {
  await api.delete(`/revisions/${revisionId}`);
};

// --- HABITS ---
export const getHabits = async (userId) => {
  const response = await api.get('/habits', withUserParams(userId));
  return Array.isArray(response.data) ? response.data : [];
};

export const createHabit = async (userId, habit) => {
  const response = await api.post('/habits', habit, { params: { userId } });
  return response.data;
};

export const updateHabit = async (habitId, habit) => {
  const response = await api.put(`/habits/${habitId}`, habit);
  return response.data;
};

export const toggleHabitDate = async (habitId, date) => {
  const response = await api.patch(`/habits/${habitId}/toggle`, null, { params: { date } });
  return response.data;
};

export const deleteHabit = async (habitId) => {
  await api.delete(`/habits/${habitId}`);
};

// --- GOALS ---
export const getGoals = async (userId) => {
  const response = await api.get('/goals', withUserParams(userId));
  return Array.isArray(response.data) ? response.data : [];
};

export const createGoal = async (userId, goal) => {
  const response = await api.post('/goals', goal, { params: { userId } });
  return response.data;
};

export const updateGoal = async (goalId, goal) => {
  const response = await api.put(`/goals/${goalId}`, goal);
  return response.data;
};

export const deleteGoal = async (goalId) => {
  await api.delete(`/goals/${goalId}`);
};

// --- DEADLINES ---
export const getDeadlines = async (userId) => {
  const response = await api.get('/deadlines', withUserParams(userId));
  return Array.isArray(response.data) ? response.data : [];
};

export const createDeadline = async (userId, deadline) => {
  const response = await api.post('/deadlines', deadline, { params: { userId } });
  return response.data;
};

export const updateDeadline = async (deadlineId, deadline) => {
  const response = await api.put(`/deadlines/${deadlineId}`, deadline);
  return response.data;
};

export const deleteDeadline = async (deadlineId) => {
  await api.delete(`/deadlines/${deadlineId}`);
};

// --- FLASHCARDS ---
export const getFlashcards = async (userId) => {
  const response = await api.get('/flashcards', withUserParams(userId));
  return Array.isArray(response.data) ? response.data : [];
};

export const createFlashcard = async (userId, card) => {
  const response = await api.post('/flashcards', card, { params: { userId } });
  return response.data;
};

export const updateFlashcard = async (cardId, card) => {
  const response = await api.put(`/flashcards/${cardId}`, card);
  return response.data;
};

export const deleteFlashcard = async (cardId) => {
  await api.delete(`/flashcards/${cardId}`);
};

// --- DISTRACTIONS ---
export const getDistractions = async (userId) => {
  const response = await api.get('/distractions', withUserParams(userId));
  return Array.isArray(response.data) ? response.data : [];
};

export const createDistraction = async (userId, distraction) => {
  const response = await api.post('/distractions', distraction, { params: { userId } });
  return response.data;
};

export const deleteDistraction = async (distractionId) => {
  await api.delete(`/distractions/${distractionId}`);
};

// --- REFLECTIONS ---
export const getReflections = async (userId) => {
  const response = await api.get('/reflections', withUserParams(userId));
  return Array.isArray(response.data) ? response.data : [];
};

export const createReflection = async (userId, reflection) => {
  const response = await api.post('/reflections', reflection, { params: { userId } });
  return response.data;
};

export const updateReflection = async (reflectionId, reflection) => {
  const response = await api.put(`/reflections/${reflectionId}`, reflection);
  return response.data;
};

export const deleteReflection = async (reflectionId) => {
  await api.delete(`/reflections/${reflectionId}`);
};

// --- RESOURCES ---
export const getResources = async (userId) => {
  const response = await api.get('/resources', withUserParams(userId));
  return Array.isArray(response.data) ? response.data : [];
};

export const createResource = async (userId, resource) => {
  const response = await api.post('/resources', resource, { params: { userId } });
  return response.data;
};

export const uploadResourceFile = async (userId, file, category, name) => {
  const formData = new FormData();
  formData.append('file', file);
  if (category) {
    formData.append('category', category);
  }
  if (name) {
    formData.append('name', name);
  }

  const response = await api.post('/resources/upload', formData, {
    params: { userId },
  });

  return response.data;
};

export const getResourceOpenUrl = (resourceId) =>
  `${api.defaults.baseURL}/resources/${resourceId}/download?download=false`;

export const getResourceDownloadUrl = (resourceId) =>
  `${api.defaults.baseURL}/resources/${resourceId}/download?download=true`;

export const updateResource = async (resourceId, resource) => {
  const response = await api.put(`/resources/${resourceId}`, resource);
  return response.data;
};

export const deleteResource = async (resourceId) => {
  await api.delete(`/resources/${resourceId}`);
};

// --- TIMER SESSIONS ---
export const getTimerSessions = async (userId) => {
  const response = await api.get('/timer-sessions', withUserParams(userId));
  return Array.isArray(response.data) ? response.data : [];
};

export const logTimerSession = async (userId, session) => {
  const response = await api.post('/timer-sessions', session, { params: { userId } });
  return response.data;
};

export const deleteTimerSession = async (sessionId) => {
  await api.delete(`/timer-sessions/${sessionId}`);
};

// --- PLANNER: YEARLY ---
export const getYearlyPlans = async (userId, year) => {
  const response = await api.get('/planner/yearly', { params: { userId, year } });
  return Array.isArray(response.data) ? response.data : [];
};

export const createYearlyPlan = async (userId, plan) => {
  const response = await api.post('/planner/yearly', plan, { params: { userId } });
  return response.data;
};

export const updateYearlyPlan = async (planId, plan) => {
  const response = await api.put(`/planner/yearly/${planId}`, plan);
  return response.data;
};

export const deleteYearlyPlan = async (planId) => {
  await api.delete(`/planner/yearly/${planId}`);
};

// --- PLANNER: MONTHLY ---
export const getMonthlyTasks = async (userId, month, year) => {
  const response = await api.get('/planner/monthly', { params: { userId, month, year } });
  return Array.isArray(response.data) ? response.data : [];
};

export const createMonthlyTask = async (userId, task) => {
  const response = await api.post('/planner/monthly', task, { params: { userId } });
  return response.data;
};

export const updateMonthlyTask = async (taskId, task) => {
  const response = await api.put(`/planner/monthly/${taskId}`, task);
  return response.data;
};

export const deleteMonthlyTask = async (taskId) => {
  await api.delete(`/planner/monthly/${taskId}`);
};

// --- PLANNER: WEEKLY ---
export const getWeeklyTopics = async (userId, weekStartDate) => {
  const response = await api.get('/planner/weekly', { params: { userId, weekStartDate } });
  return Array.isArray(response.data) ? response.data : [];
};

export const createWeeklyTopic = async (userId, topic) => {
  const response = await api.post('/planner/weekly', topic, { params: { userId } });
  return response.data;
};

export const updateWeeklyTopic = async (topicId, topic) => {
  const response = await api.put(`/planner/weekly/${topicId}`, topic);
  return response.data;
};

export const deleteWeeklyTopic = async (topicId) => {
  await api.delete(`/planner/weekly/${topicId}`);
};

// --- DASHBOARD STATS ---
export const getDashboardStats = async (userId) => {
  const response = await api.get('/dashboard/stats', withUserParams(userId));
  return response.data;
};

// --- STATIC DATA ---
export const getSignupConfig = async () => {
  const response = await api.get('/static-data/signup-config');
  return response.data;
};

// --- WELLBEING ---
export const getTodayWellbeing = async (userId) => {
  const response = await api.get('/wellbeing/today', withUserParams(userId));
  return response.data || null;
};

export const getWeeklyWellbeing = async (userId) => {
  const response = await api.get('/wellbeing/weekly', withUserParams(userId));
  return Array.isArray(response.data) ? response.data : [];
};

export const upsertWellbeing = async (userId, payload) => {
  const response = await api.post('/wellbeing', payload, withUserParams(userId));
  return response.data;
};

// --- VISION BOARD ---
export const getVisionImages = async (userId) => {
  const response = await api.get('/vision-images', withUserParams(userId));
  return Array.isArray(response.data) ? response.data : [];
};

export const createVisionImage = async (userId, payload) => {
  const response = await api.post('/vision-images', payload, withUserParams(userId));
  return response.data;
};

export const deleteVisionImage = async (imageId) => {
  await api.delete(`/vision-images/${imageId}`);
};

export default {
  getProtectedData,
  getDashboardTasks,
  getDashboardRevisions,
  getDashboardData,
  getTests,
  createTest,
  updateTest,
  deleteTest,
  syncUser,
  getUserByFirebaseUid,
  updateUserProfile,
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  deleteTaskForUser,
  getRevisions,
  createRevision,
  updateRevision,
  markRevisionComplete,
  deleteRevision,
  getHabits,
  createHabit,
  updateHabit,
  toggleHabitDate,
  deleteHabit,
  getGoals,
  createGoal,
  updateGoal,
  deleteGoal,
  getDeadlines,
  createDeadline,
  updateDeadline,
  deleteDeadline,
  getFlashcards,
  createFlashcard,
  updateFlashcard,
  deleteFlashcard,
  getDistractions,
  createDistraction,
  deleteDistraction,
  getReflections,
  createReflection,
  updateReflection,
  deleteReflection,
  getResources,
  createResource,
  updateResource,
  deleteResource,
  getTimerSessions,
  logTimerSession,
  deleteTimerSession,
  getYearlyPlans,
  createYearlyPlan,
  updateYearlyPlan,
  deleteYearlyPlan,
  getMonthlyTasks,
  createMonthlyTask,
  updateMonthlyTask,
  deleteMonthlyTask,
  getWeeklyTopics,
  createWeeklyTopic,
  updateWeeklyTopic,
  deleteWeeklyTopic,
  getDashboardStats,
  getSignupConfig,
  getTodayWellbeing,
  getWeeklyWellbeing,
  upsertWellbeing,
  getVisionImages,
  createVisionImage,
  deleteVisionImage,
};