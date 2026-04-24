const REVISION_INTERVALS = [1, 3, 7, 21];

const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  result.setHours(0, 0, 0, 0);
  return result;
};

const formatDate = (date) => date.toISOString().split('T')[0];

export const revisionService = {
  
  generateRevisions(completionDate = new Date()) {
    return REVISION_INTERVALS.map((intervalDays) => ({
      intervalDays,
      scheduledDate: formatDate(addDays(completionDate, intervalDays)),
      completed: false,
      completedAt: null,
    }));
  },

  getUrgencyStatus(scheduledDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(scheduledDate);
    target.setHours(0, 0, 0, 0);
    if (target < today) return 'overdue';
    if (target.getTime() === today.getTime()) return 'today';
    return 'upcoming';
  },

  formatRelativeDate(date) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(date);
    target.setHours(0, 0, 0, 0);
    const diffMs = target.getTime() - today.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === -1) return 'Yesterday';
    if (diffDays > 0) return `In ${diffDays} day${diffDays > 1 ? 's' : ''}`;
    return `${Math.abs(diffDays)} day${Math.abs(diffDays) > 1 ? 's' : ''} ago`;
  },

  getIntervalLabel(intervalDays) {
    const labels = {
      1: 'Day-1 (First Review)',
      3: 'Day-3 (Early Retention)',
      7: 'Day-7 (Weekly Check)',
      21: 'Day-21 (Mastery)',
    };
    return labels[intervalDays] || `Day-${intervalDays}`;
  },

  getCompletionPercentage(revisions) {
    if (!revisions || revisions.length === 0) return 0;
    const completed = revisions.filter(r => r.completed).length;
    return Math.round((completed / revisions.length) * 100);
  },

  groupByTopic(revisions) {
    return revisions.reduce((groups, rev) => {
      const key = rev.topicId || rev.topic_id;
      if (!groups[key]) groups[key] = [];
      groups[key].push(rev);
      return groups;
    }, {});
  },

};

// Mock data for testing
export const mockRevisionData = {
  getMockRevisions() {
    const today = new Date();
    return [
      {
        id: 'rev-101',
        topicId: 'topic-1',
        topicName: 'Dynamic Programming',
        subject: 'Algorithms',
        intervalDays: 3,
        scheduledDate: formatDate(addDays(today, -2)),
        completed: false,
      },
      {
        id: 'rev-102',
        topicId: 'topic-2',
        topicName: 'Process Scheduling',
        subject: 'Operating Systems',
        intervalDays: 7,
        scheduledDate: formatDate(today),
        completed: false,
      },
      {
        id: 'rev-103',
        topicId: 'topic-2',
        topicName: 'Process Scheduling',
        subject: 'Operating Systems',
        intervalDays: 3,
        scheduledDate: formatDate(today),
        completed: false,
      },
    ];
  },

  getMockTopics() {
    return [
      {
        id: 'topic-1',
        subject: 'Algorithms',
        topicName: 'Dynamic Programming',
        status: 'COMPLETED',
        completedAt: '2026-02-15',
      },
      {
        id: 'topic-2',
        subject: 'Operating Systems',
        topicName: 'Process Scheduling',
        status: 'COMPLETED',
        completedAt: '2026-02-12',
      },
      {
        id: 'topic-3',
        subject: 'DBMS',
        topicName: 'Normalization',
        status: 'STUDYING',
        startedAt: '2026-02-18',
      },
    ];
  },
};