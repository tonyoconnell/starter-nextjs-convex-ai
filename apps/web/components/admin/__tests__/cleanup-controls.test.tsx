import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CleanupControls } from '../cleanup-controls';

// Mock Convex
jest.mock('convex/react', () => ({
  useQuery: jest.fn(),
  useMutation: jest.fn(),
}));

const mockUseQuery = require('convex/react').useQuery;
const mockUseMutation = require('convex/react').useMutation;

const mockCleanupStatus = {
  lastCleanup: Date.now() - 3600000, // 1 hour ago
  totalRecords: 1000,
  oldRecords: 100,
  expiredRecords: 50,
  estimatedCleanupSize: 5,
  recommendations: ['Consider running safe cleanup', 'Review retention policies']
};

describe('CleanupControls', () => {
  const mockSafeCleanup = jest.fn();
  const mockForceCleanup = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseMutation
      .mockReturnValueOnce(mockSafeCleanup)
      .mockReturnValueOnce(mockForceCleanup);
  });

  it('renders loading state when data is not available', () => {
    mockUseQuery.mockReturnValue(undefined);

    render(<CleanupControls />);

    expect(screen.getByRole('heading', { name: /cleanup controls/i })).toBeInTheDocument();
  });

  it('renders cleanup status correctly', () => {
    mockUseQuery.mockReturnValue(mockCleanupStatus);

    render(<CleanupControls />);

    expect(screen.getByText('Administrative Cleanup Controls')).toBeInTheDocument();
    expect(screen.getByText('1,000')).toBeInTheDocument(); // Total records
    expect(screen.getByText('100')).toBeInTheDocument(); // Old records
    expect(screen.getByText('50')).toBeInTheDocument(); // Expired records
    expect(screen.getByText('5 MB')).toBeInTheDocument(); // Estimated cleanup size
  });

  it('displays last cleanup time', () => {
    mockUseQuery.mockReturnValue(mockCleanupStatus);

    render(<CleanupControls />);

    expect(screen.getByText(/last cleanup/i)).toBeInTheDocument();
    expect(screen.getByText(/hour ago/i)).toBeInTheDocument();
  });

  it('shows safe cleanup button and handles click', async () => {
    mockUseQuery.mockReturnValue(mockCleanupStatus);
    mockSafeCleanup.mockResolvedValue({ deleted: 50 });

    render(<CleanupControls />);

    const safeCleanupButton = screen.getByRole('button', { name: /run safe cleanup/i });
    expect(safeCleanupButton).toBeInTheDocument();

    fireEvent.click(safeCleanupButton);

    await waitFor(() => {
      expect(mockSafeCleanup).toHaveBeenCalledWith({});
    });
  });

  it('shows force cleanup button with warning styling', () => {
    mockUseQuery.mockReturnValue(mockCleanupStatus);

    render(<CleanupControls />);

    const forceCleanupButton = screen.getByRole('button', { name: /force cleanup/i });
    expect(forceCleanupButton).toBeInTheDocument();
    expect(forceCleanupButton).toHaveClass('destructive');
  });

  it('handles force cleanup with confirmation', async () => {
    mockUseQuery.mockReturnValue(mockCleanupStatus);
    mockForceCleanup.mockResolvedValue({ deleted: 200 });

    // Mock window.confirm
    const originalConfirm = window.confirm;
    window.confirm = jest.fn(() => true);

    render(<CleanupControls />);

    const forceCleanupButton = screen.getByRole('button', { name: /force cleanup/i });
    fireEvent.click(forceCleanupButton);

    await waitFor(() => {
      expect(window.confirm).toHaveBeenCalledWith(
        expect.stringContaining('This will delete ALL logs')
      );
      expect(mockForceCleanup).toHaveBeenCalledWith({});
    });

    // Restore original confirm
    window.confirm = originalConfirm;
  });

  it('cancels force cleanup when user declines confirmation', async () => {
    mockUseQuery.mockReturnValue(mockCleanupStatus);

    // Mock window.confirm to return false
    const originalConfirm = window.confirm;
    window.confirm = jest.fn(() => false);

    render(<CleanupControls />);

    const forceCleanupButton = screen.getByRole('button', { name: /force cleanup/i });
    fireEvent.click(forceCleanupButton);

    await waitFor(() => {
      expect(window.confirm).toHaveBeenCalled();
    });

    expect(mockForceCleanup).not.toHaveBeenCalled();

    // Restore original confirm
    window.confirm = originalConfirm;
  });

  it('displays recommendations when present', () => {
    mockUseQuery.mockReturnValue(mockCleanupStatus);

    render(<CleanupControls />);

    expect(screen.getByText('Consider running safe cleanup')).toBeInTheDocument();
    expect(screen.getByText('Review retention policies')).toBeInTheDocument();
  });

  it('shows cleanup progress when operations are running', async () => {
    mockUseQuery.mockReturnValue(mockCleanupStatus);
    mockSafeCleanup.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ deleted: 50 }), 1000)));

    render(<CleanupControls />);

    const safeCleanupButton = screen.getByRole('button', { name: /run safe cleanup/i });
    fireEvent.click(safeCleanupButton);

    // Button should be disabled during operation
    expect(safeCleanupButton).toBeDisabled();
  });

  it('displays cleanup statistics', () => {
    mockUseQuery.mockReturnValue(mockCleanupStatus);

    render(<CleanupControls />);

    expect(screen.getByText(/cleanup statistics/i)).toBeInTheDocument();
    expect(screen.getByText(/total records/i)).toBeInTheDocument();
    expect(screen.getByText(/old records/i)).toBeInTheDocument();
    expect(screen.getByText(/expired records/i)).toBeInTheDocument();
  });
});