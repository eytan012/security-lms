import React from 'react';
import { render, screen } from '@testing-library/react';
import AnimatedCard from '../../components/AnimatedCard';

// Mock framer-motion to avoid animation-related issues in tests
jest.mock('framer-motion', () => {
  const actual = jest.requireActual('framer-motion');
  return {
    ...actual,
    motion: {
      div: ({ children, ...props }) => (
        <div data-testid="motion-div" {...props}>
          {children}
        </div>
      ),
    },
  };
});

describe('AnimatedCard Component', () => {
  test('renders children correctly', () => {
    render(
      <AnimatedCard>
        <div data-testid="test-child">Test Content</div>
      </AnimatedCard>
    );
    
    expect(screen.getByTestId('test-child')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  test('passes props to Card component', () => {
    render(
      <AnimatedCard data-testid="test-card" variant="outlined">
        Card Content
      </AnimatedCard>
    );
    
    const motionDiv = screen.getByTestId('motion-div');
    expect(motionDiv).toBeInTheDocument();
    expect(screen.getByText('Card Content')).toBeInTheDocument();
  });
});
