import React, { createContext, useContext, useState, useCallback } from 'react';
import { getHabits, createHabit as apiCreateHabit, updateHabit as apiUpdateHabit, toggleHabitDate as apiToggleHabitDate, deleteHabit as apiDeleteHabit } from '../services/api';
import { showToast } from '../utils/toast';

const HabitContext = createContext();

export const useHabits = () => {
  const context = useContext(HabitContext);
  if (!context) {
    throw new Error('useHabits must be used within HabitProvider');
  }
  return context;
};

// Normalize habit data from API
const normalizeCompletedDates = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return [];
    try {
      const parsed = JSON.parse(trimmed);
      return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
    } catch {
      return trimmed.split(',').map(item => item.trim()).filter(Boolean);
    }
  }
  return [];
};

const normalizeHabit = (habit) => ({
  id: habit?.id,
  name: habit?.name || 'Untitled Habit',
  frequency: habit?.frequency || 'daily',
  streak: Number.isFinite(Number(habit?.streak)) ? Number(habit.streak) : 0,
  longestStreak: Number.isFinite(Number(habit?.longestStreak)) ? Number(habit.longestStreak) : 0,
  completedDates: normalizeCompletedDates(habit?.completedDates),
});

export const HabitProvider = ({ children }) => {
  const [habits, setHabits] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load all habits for a user
  const loadHabits = useCallback(async (userId) => {
    if (!userId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await getHabits(userId);
      const normalized = (Array.isArray(data) ? data : []).map(normalizeHabit);
      setHabits(normalized);
    } catch (err) {
      console.error('Failed to load habits:', err);
      setError('Failed to load habits');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create a new habit
  const createHabit = useCallback(async (userId, { name, frequency }) => {
    if (!userId) return null;
    try {
      const saved = await apiCreateHabit(userId, {
        name,
        frequency,
        streak: 0,
        longestStreak: 0,
        completedDates: '[]',
      });
      const normalized = normalizeHabit(saved);
      setHabits(prev => [...prev, normalized]);
      showToast({ title: 'Habit Created', message: `${name} added.` });
      return normalized;
    } catch (err) {
      console.error('Failed to create habit:', err);
      setError('Failed to create habit');
      showToast({ title: 'Error', message: 'Failed to create habit', type: 'error' });
      return null;
    }
  }, []);

  // Update habit details (name, frequency)
  const updateHabit = useCallback(async (habitId, updates) => {
    const current = habits.find(h => h.id === habitId);
    if (!current) return null;

    const payload = {
      name: updates.name ?? current.name,
      frequency: updates.frequency ?? current.frequency,
      streak: current.streak,
      longestStreak: current.longestStreak,
      completedDates: JSON.stringify(current.completedDates),
    };

    try {
      const saved = await apiUpdateHabit(habitId, payload);
      const normalized = normalizeHabit(saved);
      setHabits(prev => prev.map(h => h.id === habitId ? normalized : h));
      showToast({ title: 'Habit Updated', message: `${updates.name || current.name} updated.` });
      return normalized;
    } catch (err) {
      console.error('Failed to update habit:', err);
      setError('Failed to update habit');
      showToast({ title: 'Error', message: 'Failed to update habit', type: 'error' });
      return null;
    }
  }, [habits]);

  // Toggle habit completion for a specific date (optimistic + persist)
  const toggleCompletion = useCallback(async (habitId, date) => {
    const current = habits.find(h => h.id === habitId);
    if (!current) return null;

    // Store previous state for rollback
    const previousHabits = habits;

    // Optimistic update
    const isCompleted = current.completedDates.includes(date);
    const newCompletedDates = isCompleted
      ? current.completedDates.filter(d => d !== date)
      : [date, ...current.completedDates];

    // Recalculate streak for today
    const today = new Date().toISOString().split('T')[0];
    let newStreak = current.streak;
    if (date === today) {
      newStreak = isCompleted ? Math.max(0, current.streak - 1) : current.streak + 1;
    }

    const updated = {
      ...current,
      completedDates: newCompletedDates,
      streak: newStreak,
      longestStreak: Math.max(newStreak, current.longestStreak),
    };

    // Optimistic UI update
    setHabits(prev => prev.map(h => h.id === habitId ? updated : h));

    // Persist to backend
    try {
      const saved = await apiToggleHabitDate(habitId, date);
      const normalized = normalizeHabit(saved);
      setHabits(prev => prev.map(h => h.id === habitId ? normalized : h));
      return normalized;
    } catch (err) {
      console.error('Failed to toggle habit:', err);
      // Rollback on failure
      setHabits(previousHabits);
      setError('Failed to update habit');
      showToast({ title: 'Error', message: 'Failed to update habit', type: 'error' });
      return null;
    }
  }, [habits]);

  // Delete a habit
  const deleteHabit = useCallback(async (habitId) => {
    const current = habits.find(h => h.id === habitId);
    if (!current) return false;

    const previousHabits = habits;

    // Optimistic delete
    setHabits(prev => prev.filter(h => h.id !== habitId));

    try {
      await apiDeleteHabit(habitId);
      showToast({ title: 'Habit Deleted', message: 'Habit removed.', type: 'info' });
      return true;
    } catch (err) {
      console.error('Failed to delete habit:', err);
      // Rollback on failure
      setHabits(previousHabits);
      setError('Failed to delete habit');
      showToast({ title: 'Error', message: 'Failed to delete habit', type: 'error' });
      return false;
    }
  }, [habits]);

  const value = {
    habits,
    isLoading,
    error,
    loadHabits,
    createHabit,
    updateHabit,
    toggleCompletion,
    deleteHabit,
  };

  return <HabitContext.Provider value={value}>{children}</HabitContext.Provider>;
};
