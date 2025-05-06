import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Layout from '../../components/Layout';
import { AuthProvider } from '../../hooks/useAuth';
import { UserProvider } from '../../context/UserContext';

// Mock the useNavigate hook
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));

// Mock the useAuth hook
jest.mock('../../hooks/useAuth', () => ({
  ...jest.requireActual('../../hooks/useAuth'),
  useAuth: () => ({
    logout: jest.fn(),
  }),
}));

// Mock the useUser hook
jest.mock('../../context/UserContext', () => ({
  ...jest.requireActual('../../context/UserContext'),
  useUser: () => ({
    user: { role: 'user' },
  }),
}));

const renderWithProviders = (ui) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <UserProvider>
          {ui}
        </UserProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('Layout Component', () => {
  test('renders the app title', () => {
    renderWithProviders(<Layout />);
    expect(screen.getByText('לומדת אבטחת מידע')).toBeInTheDocument();
  });

  test('renders the menu button', () => {
    renderWithProviders(<Layout />);
    const menuButton = screen.getByRole('button');
    expect(menuButton).toBeInTheDocument();
  });

  test('opens drawer when menu button is clicked', () => {
    renderWithProviders(<Layout />);
    const menuButton = screen.getByRole('button');
    
    // Drawer should be closed initially
    expect(screen.queryByText('פרופיל')).not.toBeInTheDocument();
    
    // Click menu button to open drawer
    fireEvent.click(menuButton);
    
    // Drawer should now be open and show menu items
    expect(screen.getByText('פרופיל')).toBeInTheDocument();
    expect(screen.getByText('לומדה')).toBeInTheDocument();
    expect(screen.getByText('סטטיסטיקות')).toBeInTheDocument();
    expect(screen.getByText('התנתקות')).toBeInTheDocument();
  });

  test('renders admin menu item for admin users', () => {
    // Override the mock for this specific test
    jest.spyOn(require('../../context/UserContext'), 'useUser').mockImplementation(() => ({
      user: { role: 'admin' },
    }));
    
    renderWithProviders(<Layout />);
    
    // Open drawer
    const menuButton = screen.getByRole('button');
    fireEvent.click(menuButton);
    
    // Check for admin menu item
    expect(screen.getByText('ניהול')).toBeInTheDocument();
  });
});
