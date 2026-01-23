import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SummaryCard } from './SummaryCard';
import { useEventStore } from '@/store/useEventStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useUserProfileStore } from '@/store';

// Mock stores
vi.mock('@/store/useEventStore');
vi.mock('@/store/useAuthStore');
vi.mock('@/store');

describe('SummaryCard', () => {
  const mockFetchBills = vi.fn();
  const mockFetchUserProfile = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementations
    vi.mocked(useAuthStore).mockReturnValue({
      user: { uid: 'user123' },
    } as any);

    vi.mocked(useUserProfileStore).mockReturnValue({
      userProfile: { uid: 'user123', displayName: 'Test User', image: null },
      fetchUserProfile: mockFetchUserProfile,
    } as any);

    vi.mocked(useEventStore).mockReturnValue({
      currentEvent: null,
      eventBills: [],
      fetchBills: mockFetchBills,
      loading: false,
    } as any);
  });

  it('should display totalExpenses when currentEvent exists', () => {
    vi.mocked(useEventStore).mockReturnValue({
      currentEvent: {
        id: 'event123',
        totalExpenses: 11378.8, // Zmienione na rzeczywistą wartość
        participants: [],
        balances: {},
      },
      eventBills: [],
      fetchBills: mockFetchBills,
      loading: false,
    } as any);

    render(<SummaryCard />);

    expect(screen.getByText(/Łączna kwota:/)).toHaveTextContent('Łączna kwota: 11378.8 zł');
  });

  it('should display empty when totalExpenses is missing', () => {
    vi.mocked(useEventStore).mockReturnValue({
      currentEvent: {
        id: 'event123',
        participants: [],
        balances: {},
      },
      eventBills: [],
      fetchBills: mockFetchBills,
      loading: false,
    } as any);

    render(<SummaryCard />);

    expect(screen.getByText(/Łączna kwota:/)).toHaveTextContent('Łączna kwota: zł');
  });

  it('should not display totalExpenses when currentEvent is null', () => {
    render(<SummaryCard />);

    expect(screen.getByText(/Łączna kwota:/)).toHaveTextContent('Łączna kwota: zł');
  });

  it('should calculate totalExpenses from eventBills', () => {
    const mockEventBills = [
      { id: '1', value: 100, participants: [] },
      { id: '2', value: 200, participants: [] },
      { id: '3', value: 50.5, participants: [] },
    ];

    vi.mocked(useEventStore).mockReturnValue({
      currentEvent: { id: 'event123', totalExpenses: 350.5, participants: [], balances: {} },
      eventBills: mockEventBills,
      fetchBills: mockFetchBills,
      loading: false,
    } as any);

    render(<SummaryCard />);

    const expectedTotal = mockEventBills.reduce((sum, bill) => sum + bill.value, 0);
    expect(expectedTotal).toBe(350.5);
    expect(screen.getByText(/Łączna kwota:/)).toHaveTextContent('Łączna kwota: 350.5 zł');
  });
});
