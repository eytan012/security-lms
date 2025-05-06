import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SimulationWrapper from '../../components/simulations/SimulationWrapper';

describe('SimulationWrapper Component', () => {
  test('renders title and description', () => {
    render(
      <SimulationWrapper 
        title="סימולציית סיסמאות חזקות" 
        description="בדוק את חוזק הסיסמה שלך"
      />
    );
    
    expect(screen.getByText('סימולציית סיסמאות חזקות')).toBeInTheDocument();
    expect(screen.getByText('בדוק את חוזק הסיסמה שלך')).toBeInTheDocument();
  });

  test('renders default content when no children provided', () => {
    render(
      <SimulationWrapper 
        title="סימולציה" 
        simulationType="סיסמאות"
      />
    );
    
    expect(screen.getByText(/סימולציה מסוג סיסמאות/)).toBeInTheDocument();
    expect(screen.getByText('סיים סימולציה')).toBeInTheDocument();
  });

  test('completes simulation when button is clicked', () => {
    const mockOnComplete = jest.fn();
    
    render(
      <SimulationWrapper 
        title="סימולציה" 
        onComplete={mockOnComplete}
      />
    );
    
    // Click the complete button
    fireEvent.click(screen.getByText('סיים סימולציה'));
    
    // Check that results are shown
    expect(screen.getByText('תוצאות הסימולציה')).toBeInTheDocument();
    expect(screen.getByText('85%')).toBeInTheDocument();
    expect(screen.getByText('כל הכבוד! השלמת את הסימולציה בהצלחה')).toBeInTheDocument();
    
    // Check that onComplete was called with the default score
    expect(mockOnComplete).toHaveBeenCalledWith(85);
  });

  test('passes onComplete to children', () => {
    const mockOnComplete = jest.fn();
    const mockChildOnComplete = jest.fn();
    
    // Create a mock child component
    const MockChildComponent = ({ onComplete }) => {
      return (
        <button onClick={() => onComplete(90)}>
          השלם סימולציה עם ציון 90
        </button>
      );
    };
    
    render(
      <SimulationWrapper onComplete={mockOnComplete}>
        <MockChildComponent onComplete={mockChildOnComplete} />
      </SimulationWrapper>
    );
    
    // Click the child's button
    fireEvent.click(screen.getByText('השלם סימולציה עם ציון 90'));
    
    // Check that results are shown
    expect(screen.getByText('תוצאות הסימולציה')).toBeInTheDocument();
    expect(screen.getByText('90%')).toBeInTheDocument();
    
    // Check that the wrapper's onComplete was called with the score from the child
    expect(mockOnComplete).toHaveBeenCalledWith(90);
  });

  test('normalizes scores to be between 0-100', () => {
    const mockOnComplete = jest.fn();
    
    // Create a mock child component that returns a score > 100
    const MockChildComponent = ({ onComplete }) => {
      return (
        <button onClick={() => onComplete(150)}>
          השלם עם ציון גבוה מדי
        </button>
      );
    };
    
    render(
      <SimulationWrapper onComplete={mockOnComplete}>
        <MockChildComponent />
      </SimulationWrapper>
    );
    
    // Click the child's button
    fireEvent.click(screen.getByText('השלם עם ציון גבוה מדי'));
    
    // Check that score is normalized to 100
    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(mockOnComplete).toHaveBeenCalledWith(100);
  });
});
