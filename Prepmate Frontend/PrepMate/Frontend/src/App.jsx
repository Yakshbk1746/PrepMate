import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/authContext';

// Layout Component
const DashboardLayout = lazy(() => import('./layout/DashboardLayout'));

// Auth Pages
import Login from './pages/Login';
import SignUp from './pages/SignUp';

// Feature Pages
const Dashboard = lazy(() => import('./pages/dashboard'));
const RevisionPage = lazy(() => import('./pages/RevisionPage'));
const YearlyPlanner = lazy(() => import('./pages/YearlyPlanner'));
const MonthlyPlanner = lazy(() => import('./pages/MonthlyPlanner'));
const WeeklyPlanner = lazy(() => import('./pages/WeeklyPlanner'));
const DailyPlanner = lazy(() => import('./pages/DailyPlanner'));
const HabitsPage = lazy(() => import('./pages/HabitsPage'));
const TimersPage = lazy(() => import('./pages/TimersPage'));
const ReflectionPage = lazy(() => import('./pages/ReflectionPage'));
const DistractionPage = lazy(() => import('./pages/DistractionPage'));
const ResourcesPage = lazy(() => import('./pages/ResourcesPage'));
const TestsPage = lazy(() => import('./pages/TestsPage'));
const FlashcardsPage = lazy(() => import('./pages/FlashcardsPage'));
const GoalsPage = lazy(() => import('./pages/GoalsPage'));
const DeadlinesPage = lazy(() => import('./pages/DeadlinesPage'));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const WellbeingPage = lazy(() => import('./pages/WellbeingPage'));
const VisionBoardPage = lazy(() => import('./pages/VisionBoardPage'));
const WeeklyReportPage = lazy(() => import('./pages/WeeklyReportPage'));

const RouteFallback = (
  <div className="h-screen w-full bg-slate-950 flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
      <p className="text-blue-500 font-medium animate-pulse">Loading PrepMate...</p>
    </div>
  </div>
);

/**
 * Robust ProtectedRoute wrapper
 * Prevents the "Blank Screen" by returning null during initial auth check
 */
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="h-screen w-full bg-slate-950 flex items-center justify-center">
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
            <Suspense fallback={RouteFallback}>
              <DashboardLayout />
            </Suspense>
          </ProtectedRoute>
        }
      >
        {/* Default Redirect to Dashboard */}
        <Route index element={<Navigate to="/dashboard" replace />} />
        
        {/* Child Feature Routes */}
        <Route path="dashboard" element={<Suspense fallback={RouteFallback}><Dashboard /></Suspense>} />
        <Route path="revision" element={<Suspense fallback={RouteFallback}><RevisionPage /></Suspense>} />
        <Route path="yearly" element={<Suspense fallback={RouteFallback}><YearlyPlanner /></Suspense>} />
        <Route path="monthly" element={<Suspense fallback={RouteFallback}><MonthlyPlanner /></Suspense>} />
        <Route path="weekly" element={<Suspense fallback={RouteFallback}><WeeklyPlanner /></Suspense>} />
        <Route path="daily" element={<Suspense fallback={RouteFallback}><DailyPlanner /></Suspense>} />
        <Route path="habits" element={<Suspense fallback={RouteFallback}><HabitsPage /></Suspense>} />
        <Route path="timers" element={<Suspense fallback={RouteFallback}><TimersPage /></Suspense>} />
        <Route path="reflection" element={<Suspense fallback={RouteFallback}><ReflectionPage /></Suspense>} />
        <Route path="distraction" element={<Suspense fallback={RouteFallback}><DistractionPage /></Suspense>} />
        <Route path="resources" element={<Suspense fallback={RouteFallback}><ResourcesPage /></Suspense>} />
        <Route path="tests" element={<Suspense fallback={RouteFallback}><TestsPage /></Suspense>} />
        <Route path="flashcards" element={<Suspense fallback={RouteFallback}><FlashcardsPage /></Suspense>} />
        <Route path="goals" element={<Suspense fallback={RouteFallback}><GoalsPage /></Suspense>} />
        <Route path="deadlines" element={<Suspense fallback={RouteFallback}><DeadlinesPage /></Suspense>} />
        <Route path="analytics" element={<Suspense fallback={RouteFallback}><AnalyticsPage /></Suspense>} />
        <Route path="reports" element={<Suspense fallback={RouteFallback}><WeeklyReportPage /></Suspense>} />
        <Route path="settings" element={<Suspense fallback={RouteFallback}><SettingsPage /></Suspense>} />
        <Route path="wellbeing" element={<Suspense fallback={RouteFallback}><WellbeingPage /></Suspense>} />
        <Route path="vision" element={<Suspense fallback={RouteFallback}><VisionBoardPage /></Suspense>} />
      </Route>

      {/* Global Catch-all Redirect */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;