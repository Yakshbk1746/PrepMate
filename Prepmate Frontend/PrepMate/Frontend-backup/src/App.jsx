import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/authContext';

// Layout Component
import DashboardLayout from './layout/DashboardLayout';

// Auth Pages
import Login from './pages/Login';
import SignUp from './pages/SignUp';

// Feature Pages
import Dashboard from './pages/dashboard';
import RevisionPage from './pages/RevisionPage';
import YearlyPlanner from './pages/YearlyPlanner';
import MonthlyPlanner from './pages/MonthlyPlanner';
import WeeklyPlanner from './pages/WeeklyPlanner';
import DailyPlanner from './pages/DailyPlanner';
import HabitsPage from './pages/HabitsPage';
import TimersPage from './pages/TimersPage';
import ReflectionPage from './pages/ReflectionPage';
import DistractionPage from './pages/DistractionPage';
import ResourcesPage from './pages/ResourcesPage';
import TestsPage from './pages/TestsPage';
import WeeklyReportPage from './pages/WeeklyReportPage';
import FlashcardsPage from './pages/FlashcardsPage';
import WellbeingPage from './pages/WellbeingPage';
import GoalsPage from './pages/GoalsPage';
import TimetablePage from './pages/TimetablePage';
import DeadlinesPage from './pages/DeadlinesPage';
import AnalyticsPage from './pages/AnalyticsPage';
import SettingsPage from './pages/SettingsPage';

/**
 * Robust ProtectedRoute wrapper
 * Prevents the "Blank Screen" by returning null during initial auth check
 */
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="h-screen w-full bg-[#020617] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
          <p className="text-blue-500 font-medium animate-pulse">Initializing PrepMate...</p>
        </div>
      </div>
    );
  }
  
  // Only redirect if we are certain the user is not logged in
  return user ? children : <Navigate to="/login" replace />;
};

function App() {
  return (
    <Routes>
      {/* Public Authentication Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<SignUp />} />

      {/* Protected Application Shell */}
      <Route 
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        {/* Default Redirect to Dashboard */}
        <Route index element={<Navigate to="/dashboard" replace />} />
        
        {/* Child Feature Routes */}
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="revision" element={<RevisionPage />} />
        <Route path="yearly" element={<YearlyPlanner />} />
        <Route path="monthly" element={<MonthlyPlanner />} />
        <Route path="weekly" element={<WeeklyPlanner />} />
        <Route path="daily" element={<DailyPlanner />} />
        <Route path="habits" element={<HabitsPage />} />
        <Route path="timers" element={<TimersPage />} />
        <Route path="reflection" element={<ReflectionPage />} />
        <Route path="distraction" element={<DistractionPage />} />
        <Route path="resources" element={<ResourcesPage />} />
        <Route path="tests" element={<TestsPage />} />
        <Route path="reports" element={<WeeklyReportPage />} />
        <Route path="flashcards" element={<FlashcardsPage />} />
        <Route path="wellbeing" element={<WellbeingPage />} />
        <Route path="goals" element={<GoalsPage />} />
        <Route path="timetable" element={<TimetablePage />} />
        <Route path="deadlines" element={<DeadlinesPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      {/* Global Catch-all Redirect */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;