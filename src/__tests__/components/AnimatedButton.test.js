import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import AnimatedButton from '../../components/AnimatedButton';

// Mock framer-motion to avoid animation-related issues in tests
jest.mock('framer-motion', () => {
  const actual = jest.requireActual('framer-motion');
  return {
    ...actual,
    motion: jest.fn().mockImplementation((Component) => {
      return ({ children, ...props }) => (
        <Component data-testid="motion-button" {...props}>
          {children}
        </Component>
      );
    }),
  };
});

describe('AnimatedButton Component', () => {
  test('renders children correctly', () => {
    render(
      <AnimatedButton>
        לחץ כאן
      </AnimatedButton>
    );
    
    expect(screen.getByText('לחץ כאן')).toBeInTheDocument();
  });

  test('passes props to Button component', () => {
    const handleClick = jest.fn();
    
    render(
      <AnimatedButton 
        variant="contained" 
        color="primary" 
        onClick={handleClick}
        data-testid="custom-button"
      >
        כפתור בדיקה
      </AnimatedButton>
    );
    
    const button = screen.getByTestId('motion-button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('variant', 'contained');
    expect(button).toHaveAttribute('color', 'primary');
    
    // Test click handler
    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
