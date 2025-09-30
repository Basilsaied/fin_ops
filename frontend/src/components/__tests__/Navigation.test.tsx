import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../../test/utils';
import Navigation from '../Navigation';

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useLocation: () => ({ pathname: '/dashboard' }),
    Link: ({ children, to, ...props }: any) => (
      <a href={to} {...props}>
        {children}
      </a>
    ),
  };
});

describe('Navigation', () => {
  it('should render all navigation links', () => {
    render(<Navigation />);

    expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /add data/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /reports/i })).toBeInTheDocument();
  });

  it('should highlight active navigation item', () => {
    vi.mocked(require('react-router-dom').useLocation).mockReturnValue({
      pathname: '/dashboard'
    });

    render(<Navigation />);

    const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
    expect(dashboardLink).toHaveClass('active');
  });

  it('should have correct href attributes', () => {
    render(<Navigation />);

    expect(screen.getByRole('link', { name: /dashboard/i })).toHaveAttribute('href', '/dashboard');
    expect(screen.getByRole('link', { name: /add data/i })).toHaveAttribute('href', '/add-data');
    expect(screen.getByRole('link', { name: /reports/i })).toHaveAttribute('href', '/reports');
  });

  it('should be accessible with keyboard navigation', async () => {
    const user = userEvent.setup();
    render(<Navigation />);

    // Tab through navigation links
    await user.tab();
    expect(screen.getByRole('link', { name: /dashboard/i })).toHaveFocus();

    await user.tab();
    expect(screen.getByRole('link', { name: /add data/i })).toHaveFocus();

    await user.tab();
    expect(screen.getByRole('link', { name: /reports/i })).toHaveFocus();
  });

  it('should have proper ARIA attributes', () => {
    render(<Navigation />);

    const nav = screen.getByRole('navigation');
    expect(nav).toHaveAttribute('aria-label', 'Main navigation');

    const activeLink = screen.getByRole('link', { name: /dashboard/i });
    expect(activeLink).toHaveAttribute('aria-current', 'page');
  });

  it('should display navigation icons', () => {
    render(<Navigation />);

    expect(screen.getByTestId('dashboard-icon')).toBeInTheDocument();
    expect(screen.getByTestId('add-data-icon')).toBeInTheDocument();
    expect(screen.getByTestId('reports-icon')).toBeInTheDocument();
  });

  it('should be responsive on mobile', () => {
    // Mock mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });

    render(<Navigation />);

    const nav = screen.getByRole('navigation');
    expect(nav).toHaveClass('mobile-nav');
  });

  it('should show mobile menu toggle on small screens', () => {
    // Mock mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });

    render(<Navigation />);

    expect(screen.getByRole('button', { name: /toggle menu/i })).toBeInTheDocument();
  });

  it('should toggle mobile menu when button is clicked', async () => {
    const user = userEvent.setup();
    
    // Mock mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });

    render(<Navigation />);

    const toggleButton = screen.getByRole('button', { name: /toggle menu/i });
    await user.click(toggleButton);

    const nav = screen.getByRole('navigation');
    expect(nav).toHaveClass('menu-open');
  });

  it('should close mobile menu when a link is clicked', async () => {
    const user = userEvent.setup();
    
    // Mock mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });

    render(<Navigation />);

    // Open menu
    const toggleButton = screen.getByRole('button', { name: /toggle menu/i });
    await user.click(toggleButton);

    // Click a link
    const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
    await user.click(dashboardLink);

    const nav = screen.getByRole('navigation');
    expect(nav).not.toHaveClass('menu-open');
  });

  it('should highlight correct item for different routes', () => {
    const testCases = [
      { pathname: '/dashboard', expectedActive: 'Dashboard' },
      { pathname: '/add-data', expectedActive: 'Add Data' },
      { pathname: '/reports', expectedActive: 'Reports' },
    ];

    testCases.forEach(({ pathname, expectedActive }) => {
      vi.mocked(require('react-router-dom').useLocation).mockReturnValue({
        pathname
      });

      const { unmount } = render(<Navigation />);

      const activeLink = screen.getByRole('link', { name: new RegExp(expectedActive, 'i') });
      expect(activeLink).toHaveClass('active');

      unmount();
    });
  });

  it('should handle nested routes correctly', () => {
    vi.mocked(require('react-router-dom').useLocation).mockReturnValue({
      pathname: '/reports/trends'
    });

    render(<Navigation />);

    const reportsLink = screen.getByRole('link', { name: /reports/i });
    expect(reportsLink).toHaveClass('active');
  });

  it('should have proper semantic HTML structure', () => {
    render(<Navigation />);

    const nav = screen.getByRole('navigation');
    expect(nav.tagName).toBe('NAV');

    const list = screen.getByRole('list');
    expect(list.tagName).toBe('UL');

    const listItems = screen.getAllByRole('listitem');
    expect(listItems).toHaveLength(3);
    listItems.forEach(item => {
      expect(item.tagName).toBe('LI');
    });
  });

  it('should support keyboard shortcuts', async () => {
    const user = userEvent.setup();
    render(<Navigation />);

    // Test Alt+1 for Dashboard
    await user.keyboard('{Alt>}1{/Alt}');
    expect(screen.getByRole('link', { name: /dashboard/i })).toHaveFocus();

    // Test Alt+2 for Add Data
    await user.keyboard('{Alt>}2{/Alt}');
    expect(screen.getByRole('link', { name: /add data/i })).toHaveFocus();

    // Test Alt+3 for Reports
    await user.keyboard('{Alt>}3{/Alt}');
    expect(screen.getByRole('link', { name: /reports/i })).toHaveFocus();
  });

  it('should show breadcrumbs for nested routes', () => {
    vi.mocked(require('react-router-dom').useLocation).mockReturnValue({
      pathname: '/reports/trends'
    });

    render(<Navigation showBreadcrumbs={true} />);

    expect(screen.getByText('Reports')).toBeInTheDocument();
    expect(screen.getByText('Trends')).toBeInTheDocument();
    expect(screen.getByText('>')).toBeInTheDocument();
  });

  it('should handle external links correctly', () => {
    render(<Navigation showExternalLinks={true} />);

    const helpLink = screen.getByRole('link', { name: /help/i });
    expect(helpLink).toHaveAttribute('target', '_blank');
    expect(helpLink).toHaveAttribute('rel', 'noopener noreferrer');
  });
});