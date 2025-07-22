import { render, screen } from '@testing-library/react';
import { Button } from '../../ui/src/button';
import {
  Default,
  Secondary,
  Destructive,
  AllVariants,
} from '../stories/Button.stories';

// Mock CSS to avoid issues with Tailwind classes during testing
jest.mock('../storybook.css', () => ({}));

describe('Button Stories', () => {
  it('should render Default story', () => {
    render(<Button {...Default.args} />);
    expect(screen.getByText('Default Button')).toBeInTheDocument();
  });

  it('should render Secondary story', () => {
    render(<Button {...Secondary.args} />);
    expect(screen.getByText('Secondary Button')).toBeInTheDocument();
  });

  it('should render Destructive story', () => {
    render(<Button {...Destructive.args} />);
    expect(screen.getByText('Delete Item')).toBeInTheDocument();
  });

  it('should render AllVariants story without errors', () => {
    if (AllVariants.render) {
      render(AllVariants.render(AllVariants.args || {}, {} as any));

      // Check that all variant buttons are rendered
      expect(screen.getByText('Default')).toBeInTheDocument();
      expect(screen.getByText('Secondary')).toBeInTheDocument();
      expect(screen.getByText('Destructive')).toBeInTheDocument();
      expect(screen.getByText('Outline')).toBeInTheDocument();
      expect(screen.getByText('Ghost')).toBeInTheDocument();
      expect(screen.getByText('Link')).toBeInTheDocument();
    }
  });

  it('should have proper accessibility attributes', () => {
    render(<Button {...Default.args} />);
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('Default Button');
  });

  it('should handle disabled state correctly', () => {
    render(<Button disabled>Disabled Button</Button>);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });
});
