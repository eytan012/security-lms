import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { CssBaseline } from '@mui/material';
import { AnimatePresence } from 'framer-motion';

// Language Provider
import { LanguageProvider } from './context/LanguageContext';

// Components
import PageTransition from './components/PageTransition';

// Context
import { UserProvider } from './context/UserContext';

// Components
import ProtectedRoute, { AdminRoute } from './components/ProtectedRoute';

// Pages
import LoginPage from './pages/LoginPage';
import LearningPage from './pages/LearningPage';
import ProfilePage from './pages/ProfilePage';
import StatisticsPage from './pages/StatisticsPage';
import VideoPage from './pages/content/VideoPage';
import QuizPage from './pages/content/QuizPage';
import SimulationPage from './pages/content/SimulationPage';
import DocumentPage from './pages/content/DocumentPage';
import AdminPage from './pages/AdminPage';

// Theme is now managed by LanguageProvider

// Wrapper component for AnimatePresence
const AnimatedRoutes = () => {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/login" element={<PageTransition><LoginPage /></PageTransition>} />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <PageTransition><ProfilePage /></PageTransition>
            </ProtectedRoute>
          }
        />
        <Route
          path="/learning"
          element={
            <ProtectedRoute>
              <PageTransition><LearningPage /></PageTransition>
            </ProtectedRoute>
          }
        />
        {/* Legacy routes redirects */}
        <Route path="/progress" element={<Navigate to="/profile" replace />} />
        <Route path="/blocks" element={<Navigate to="/learning" replace />} />
        <Route
          path="/statistics"
          element={
            <ProtectedRoute>
              <PageTransition><StatisticsPage /></PageTransition>
            </ProtectedRoute>
          }
        />
        <Route
          path="/video/:blockId"
          element={
            <ProtectedRoute>
              <PageTransition><VideoPage /></PageTransition>
            </ProtectedRoute>
          }
        />
        <Route
          path="/material/:blockId"
          element={
            <ProtectedRoute>
              <PageTransition><DocumentPage /></PageTransition>
            </ProtectedRoute>
          }
        />
        <Route
          path="/quiz/:blockId"
          element={
            <ProtectedRoute>
              <PageTransition><QuizPage /></PageTransition>
            </ProtectedRoute>
          }
        />
        <Route
          path="/simulation/:blockId"
          element={
            <ProtectedRoute>
              <PageTransition><SimulationPage /></PageTransition>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <PageTransition><AdminPage /></PageTransition>
            </AdminRoute>
          }
        />
        <Route path="/" element={<Navigate to="/profile" replace />} />
      </Routes>
    </AnimatePresence>
  );
};

function App() {
  return (
    <Router>
      <LanguageProvider>
        <CssBaseline />
        <UserProvider>
          <AnimatedRoutes />
        </UserProvider>
      </LanguageProvider>
    </Router>
  );
}

export default App;
