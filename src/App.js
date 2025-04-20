import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { CssBaseline } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { theme, cacheRtl } from './theme/theme';
import { CacheProvider } from '@emotion/react';
import { AnimatePresence } from 'framer-motion';


// Components


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
import BlockEditorPage from './pages/admin/BlockEditorPage';


// Wrapper component for AnimatePresence
const AnimatedRoutes = () => {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/learning"
          element={
            <ProtectedRoute>
              <LearningPage />
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
              <StatisticsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/video/:blockId"
          element={
            <ProtectedRoute>
              <VideoPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/material/:blockId"
          element={
            <ProtectedRoute>
              <DocumentPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/quiz/:blockId"
          element={
            <ProtectedRoute>
              <QuizPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/simulation/:blockId"
          element={
            <ProtectedRoute>
              <SimulationPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/block/:blockId"
          element={
            <AdminRoute>
              <BlockEditorPage />
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
      <CacheProvider value={cacheRtl}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <UserProvider>
            <AnimatedRoutes />
          </UserProvider>
        </ThemeProvider>
      </CacheProvider>
    </Router>
  );
}

export default App;