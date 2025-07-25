import { render, screen } from '@testing-library/react';
import { DatabaseHealth } from '../database-health';

// Mock Convex
jest.mock('convex/react', () => ({
  useQuery: jest.fn(),
}));

const mockUseQuery = require('convex/react').useQuery;

const mockUsageData = {
  estimatedStorageMB: 15,
  estimatedStorageBytes: 15728640,
  recordCounts: {
    log_queue_sample: 100,
    recent_log_entries_sample: 50,
    users: 5,
    sessions: 10,
    note: 'Showing actual counts'
  },
  warnings: []
};

describe('DatabaseHealth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state when data is not available', () => {
    mockUseQuery.mockReturnValue(undefined);

    render(<DatabaseHealth />);

    expect(screen.getByRole('heading', { name: /database health/i })).toBeInTheDocument();
  });

  it('renders database usage correctly', () => {
    mockUseQuery.mockReturnValue(mockUsageData);

    render(<DatabaseHealth />);

    expect(screen.getByText('Database Health')).toBeInTheDocument();
    expect(screen.getByText('15 MB')).toBeInTheDocument(); // Storage usage
    expect(screen.getByText('100')).toBeInTheDocument(); // Log queue count
    expect(screen.getByText('50')).toBeInTheDocument(); // Log entries count
    expect(screen.getByText('5')).toBeInTheDocument(); // Users count
    expect(screen.getByText('10')).toBeInTheDocument(); // Sessions count
  });

  it('shows healthy status for normal storage usage', () => {
    mockUseQuery.mockReturnValue(mockUsageData);

    render(<DatabaseHealth />);

    expect(screen.getByText('Healthy')).toBeInTheDocument();
  });

  it('shows warning status for elevated storage usage', () => {
    const warningData = {
      ...mockUsageData,
      estimatedStorageMB: 30,
      warnings: ['Storage usage is elevated']
    };
    mockUseQuery.mockReturnValue(warningData);

    render(<DatabaseHealth />);

    expect(screen.getByText('Warning')).toBeInTheDocument();
    expect(screen.getByText('Storage usage is elevated')).toBeInTheDocument();
  });

  it('shows critical status for high storage usage', () => {
    const criticalData = {
      ...mockUsageData,
      estimatedStorageMB: 60,
      warnings: ['Storage usage critical - cleanup recommended']
    };
    mockUseQuery.mockReturnValue(criticalData);

    render(<DatabaseHealth />);

    expect(screen.getByText('Critical')).toBeInTheDocument();
  });

  it('displays record counts for all tables', () => {
    mockUseQuery.mockReturnValue(mockUsageData);

    render(<DatabaseHealth />);

    expect(screen.getByText(/log_queue_sample/i)).toBeInTheDocument();
    expect(screen.getByText(/recent_log_entries_sample/i)).toBeInTheDocument();
    expect(screen.getByText(/users/i)).toBeInTheDocument();
    expect(screen.getByText(/sessions/i)).toBeInTheDocument();
  });

  it('shows storage breakdown information', () => {
    mockUseQuery.mockReturnValue(mockUsageData);

    render(<DatabaseHealth />);

    expect(screen.getByText(/storage usage/i)).toBeInTheDocument();
    expect(screen.getByText(/record counts/i)).toBeInTheDocument();
  });

  it('displays warnings when present', () => {
    const dataWithWarnings = {
      ...mockUsageData,
      warnings: ['High storage usage detected', 'Consider running cleanup']
    };
    mockUseQuery.mockReturnValue(dataWithWarnings);

    render(<DatabaseHealth />);

    expect(screen.getByText('High storage usage detected')).toBeInTheDocument();
    expect(screen.getByText('Consider running cleanup')).toBeInTheDocument();
  });

  it('shows no warnings message when warnings array is empty', () => {
    mockUseQuery.mockReturnValue(mockUsageData);

    render(<DatabaseHealth />);

    expect(screen.getByText(/no warnings/i)).toBeInTheDocument();
  });
});