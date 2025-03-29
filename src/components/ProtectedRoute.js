import { Navigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';

// Base protected route that checks if user is logged in
function ProtectedRoute({ children, requiredRole }) {
  const { user, loading } = useUser();

  if (loading) {
    return null; // or a loading spinner
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If a specific role is required, check for it
  if (requiredRole && user.role !== requiredRole) {
    // Redirect non-admin users to their profile page
    return <Navigate to="/profile" replace />;
  }

  return children;
}

// Specific route for admin users
export function AdminRoute({ children }) {
  return <ProtectedRoute requiredRole="admin">{children}</ProtectedRoute>;
}

export default ProtectedRoute;
