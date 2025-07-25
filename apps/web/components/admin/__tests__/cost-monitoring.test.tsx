import { render, screen } from '@testing-library/react';
import { CostMonitoring } from '../cost-monitoring';

// Mock Convex
jest.mock('convex/react', () => ({
  useQuery: jest.fn(),
}));

const mockUseQuery = require('convex/react').useQuery;

const mockCostMetrics = {
  totalWrites: 1000,
  estimatedCost: 0.02,
  budgetRemaining: 124000,
  budgetUsedPercent: 0.8,
  breakdown: {
    browser: 600,
    worker: 200,
    backend: 200
  }
};

describe('CostMonitoring', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state when data is not available', () => {
    mockUseQuery.mockReturnValue(undefined);

    render(<CostMonitoring />);

    expect(screen.getByRole('heading', { name: /cost & budget monitoring/i })).toBeInTheDocument();
  });

  it('renders cost metrics correctly', () => {
    mockUseQuery.mockReturnValue(mockCostMetrics);

    render(<CostMonitoring />);

    expect(screen.getByText('Cost & Budget Monitoring')).toBeInTheDocument();
    expect(screen.getByText('$0.02')).toBeInTheDocument(); // Estimated cost
    expect(screen.getByText('0.8%')).toBeInTheDocument(); // Budget used
    expect(screen.getByText('$1,240')).toBeInTheDocument(); // Budget remaining
    expect(screen.getByText('1,000')).toBeInTheDocument(); // Total writes
  });

  it('shows correct budget status badge for normal usage', () => {
    mockUseQuery.mockReturnValue(mockCostMetrics);

    render(<CostMonitoring />);

    expect(screen.getByText('Normal')).toBeInTheDocument();
  });

  it('shows warning status for high budget usage', () => {
    const warningData = {
      ...mockCostMetrics,
      budgetUsedPercent: 85
    };
    mockUseQuery.mockReturnValue(warningData);

    render(<CostMonitoring />);

    expect(screen.getByText('Warning')).toBeInTheDocument();
  });

  it('shows critical status for very high budget usage', () => {
    const criticalData = {
      ...mockCostMetrics,
      budgetUsedPercent: 96
    };
    mockUseQuery.mockReturnValue(criticalData);

    render(<CostMonitoring />);

    expect(screen.getByText('Critical')).toBeInTheDocument();
  });

  it('displays breakdown by system correctly', () => {
    mockUseQuery.mockReturnValue(mockCostMetrics);

    render(<CostMonitoring />);

    expect(screen.getByText('Browser')).toBeInTheDocument();
    expect(screen.getByText('Worker')).toBeInTheDocument();
    expect(screen.getByText('Backend')).toBeInTheDocument();
    expect(screen.getByText('600')).toBeInTheDocument(); // Browser writes
    expect(screen.getByText('200')).toBeInTheDocument(); // Worker writes
  });

  it('shows progress bar for budget usage', () => {
    mockUseQuery.mockReturnValue(mockCostMetrics);

    render(<CostMonitoring />);

    // Should have a progress indicator
    const progressElements = document.querySelectorAll('[role="progressbar"]');
    expect(progressElements.length).toBeGreaterThan(0);
  });

  it('displays monthly usage information', () => {
    mockUseQuery.mockReturnValue(mockCostMetrics);

    render(<CostMonitoring />);

    expect(screen.getByText(/monthly usage/i)).toBeInTheDocument();
    expect(screen.getByText(/current month/i)).toBeInTheDocument();
  });
});