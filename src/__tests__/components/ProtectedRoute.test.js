import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute, { AdminRoute } from '../../components/ProtectedRoute';
import { UserProvider } from '../../context/UserContext';

// Mock the useUser hook
jest.mock('../../context/UserContext', () => {
  const originalModule = jest.requireActual('../../context/UserContext');
  
  return {
    ...originalModule,
    useUser: jest.fn(),
  };
});

describe('ProtectedRoute Component', () => {
  const mockUseUser = require('../../context/UserContext').useUser;
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('redirects to login when user is not authenticated', () => {
    // Mock user as not authenticated
    mockUseUser.mockReturnValue({ user: null, loading: false });
    
    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route path="/login" element={<div>Login Page</div>} />
          <Route 
            path="/protected" 
            element={
              <ProtectedRoute>
                <div>Protected Content</div>
              </ProtectedRoute>
            } 
          />
        </Routes>
      </MemoryRouter>
    );
    
    // Should redirect to login page
    expect(screen.getByText('Login Page')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });
  
  test('renders children when user is authenticated', () => {
    // Mock authenticated user
    mockUseUser.mockReturnValue({ 
      user: { id: '123', role: 'user' }, 
      loading: false 
    });
    
    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route path="/login" element={<div>Login Page</div>} />
          <Route 
            path="/protected" 
            element={
              <ProtectedRoute>
                <div>Protected Content</div>
              </ProtectedRoute>
            } 
          />
        </Routes>
      </MemoryRouter>
    );
    
    // Should show protected content
    expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });
  
  test('shows nothing when loading', () => {
    // Mock loading state
    mockUseUser.mockReturnValue({ user: null, loading: true });
    
    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route path="/login" element={<div>Login Page</div>} />
          <Route 
            path="/protected" 
            element={
              <ProtectedRoute>
                <div>Protected Content</div>
              </ProtectedRoute>
            } 
          />
        </Routes>
      </MemoryRouter>
    );
    
    // Should show neither login nor protected content
    expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });
  
  test('AdminRoute redirects non-admin users', () => {
    // Mock regular user (non-admin)
    mockUseUser.mockReturnValue({ 
      user: { id: '123', role: 'user' }, 
      loading: false 
    });
    
    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route path="/profile" element={<div>Profile Page</div>} />
          <Route 
            path="/admin" 
            element={
              <AdminRoute>
                <div>Admin Content</div>
              </AdminRoute>
            } 
          />
        </Routes>
      </MemoryRouter>
    );
    
    // Should redirect to profile page
    expect(screen.getByText('Profile Page')).toBeInTheDocument();
    expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
  });
  
  test('AdminRoute allows admin users', () => {
    // Mock admin user
    mockUseUser.mockReturnValue({ 
      user: { id: '123', role: 'admin' }, 
      loading: false 
    });
    
    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route path="/profile" element={<div>Profile Page</div>} />
          <Route 
            path="/admin" 
            element={
              <AdminRoute>
                <div>Admin Content</div>
              </AdminRoute>
            } 
          />
        </Routes>
      </MemoryRouter>
    );
    
    // Should show admin content
    expect(screen.queryByText('Profile Page')).not.toBeInTheDocument();
    expect(screen.getByText('Admin Content')).toBeInTheDocument();
  });
});
