import React from 'react';
import { render, screen } from '@testing-library/react';
import { LineStatsTable } from '../LineStatsTable';
import { LineName } from '../../../types';

describe('LineStatsTable', () => {
  const mockStats = {
    totalNewDelivered: 10,
    totalNewUndelivered: 5,
    totalType7Active: 15,
    totalType7Inactive: 3,
    totalType8Active: 12,
    totalType8Inactive: 2,
    totalType9Delivered: 8,
    totalType9Undelivered: 4,
    totalType10Delivered: 6,
    totalType10Undelivered: 3,
    totalOldActive: 20,
    totalOldInactive: 5,
    totalActive: 30,
    totalInactive: 8,
  };

  describe('Green Line', () => {
    it('renders Green line specific stats', () => {
      render(<LineStatsTable line="Green" stats={mockStats} />);

      // Check that Green line specific content is present
      expect(screen.getAllByText('Type 10')).toHaveLength(2);
      expect(screen.getAllByText('Type 9')).toHaveLength(2);
      expect(screen.getAllByText('Type 8')).toHaveLength(2);
      expect(screen.getAllByText('Type 7')).toHaveLength(2);
      
      // Check that specific values are displayed
      expect(screen.getByText('6')).toBeInTheDocument(); // totalType10Delivered
      expect(screen.getByText('8')).toBeInTheDocument(); // totalType9Delivered
      expect(screen.getByText('12')).toBeInTheDocument(); // totalType8Active
      expect(screen.getByText('15')).toBeInTheDocument(); // totalType7Active
    });

    it('renders table with correct structure for Green line', () => {
      render(<LineStatsTable line="Green" stats={mockStats} />);

      const table = screen.getByRole('table');
      expect(table).toHaveClass('stats-table');

      // Check that we have the expected number of rows
      const rows = screen.getAllByRole('row');
      expect(rows).toHaveLength(8); // 8 data rows for Green line
    });

    it('renders train type text with proper styling', () => {
      render(<LineStatsTable line="Green" stats={mockStats} />);

      const typeElements = screen.getAllByText(/Type \d+/);
      typeElements.forEach(element => {
        expect(element).toHaveClass('train-type-text');
      });
    });
  });

  describe('Other Lines (Red, Orange, Blue, Mattapan)', () => {
    const otherLines: LineName[] = ['Red', 'Orange', 'Blue', 'Mattapan'];

    otherLines.forEach(line => {
      describe(`${line} Line`, () => {
        it('renders standard stats for non-Green lines', () => {
          render(<LineStatsTable line={line} stats={mockStats} />);

          // Check for standard stats
          expect(screen.getByText('Train Cars Active:')).toBeInTheDocument();
          expect(screen.getByText('Train Cars Inactive:')).toBeInTheDocument();
          expect(screen.getByText('New Train Cars Delivered:')).toBeInTheDocument();
          expect(screen.getByText('New Train Cars Awaiting Delivery:')).toBeInTheDocument();
          expect(screen.getByText('Old Train Cars Active:')).toBeInTheDocument();
          expect(screen.getByText('Old Train Cars Inactive:')).toBeInTheDocument();

          // Check that specific values are displayed
          expect(screen.getByText('30')).toBeInTheDocument(); // totalActive
          expect(screen.getByText('8')).toBeInTheDocument(); // totalInactive
          expect(screen.getByText('10')).toBeInTheDocument(); // totalNewDelivered
          expect(screen.getByText('20')).toBeInTheDocument(); // totalOldActive
        });

        it('renders table with correct structure for non-Green lines', () => {
          render(<LineStatsTable line={line} stats={mockStats} />);

          const table = screen.getByRole('table');
          expect(table).toHaveClass('stats-table');

          // Check that we have the expected number of rows
          const rows = screen.getAllByRole('row');
          expect(rows).toHaveLength(6); // 6 data rows for non-Green lines
        });
      });
    });
  });

  describe('Conditional Rendering', () => {
    it('does not render rows when stats are undefined', () => {
      const partialStats = {
        totalActive: 10,
        totalInactive: 5,
        // Other stats are undefined
      };

      render(<LineStatsTable line="Red" stats={partialStats} />);

      // Should only render the defined stats
      expect(screen.getByText('Train Cars Active:')).toBeInTheDocument();
      expect(screen.getByText('10')).toBeInTheDocument();
      expect(screen.getByText('Train Cars Inactive:')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();

      // Should not render undefined stats
      expect(screen.queryByText('New Train Cars Delivered:')).not.toBeInTheDocument();
      expect(screen.queryByText('New Train Cars Awaiting Delivery:')).not.toBeInTheDocument();
      expect(screen.queryByText('Old Train Cars Active:')).not.toBeInTheDocument();
      expect(screen.queryByText('Old Train Cars Inactive:')).not.toBeInTheDocument();
    });

    it('renders only some stats when others are undefined', () => {
      const partialStats = {
        totalNewDelivered: 15,
        totalOldActive: 25,
        // Other stats are undefined
      };

      render(<LineStatsTable line="Orange" stats={partialStats} />);

      // Should render the defined stats
      expect(screen.getByText('New Train Cars Delivered:')).toBeInTheDocument();
      expect(screen.getByText('15')).toBeInTheDocument();
      expect(screen.getByText('Old Train Cars Active:')).toBeInTheDocument();
      expect(screen.getByText('25')).toBeInTheDocument();

      // Should not render undefined stats
      expect(screen.queryByText('Train Cars Active:')).not.toBeInTheDocument();
      expect(screen.queryByText('Train Cars Inactive:')).not.toBeInTheDocument();
      expect(screen.queryByText('New Train Cars Awaiting Delivery:')).not.toBeInTheDocument();
      expect(screen.queryByText('Old Train Cars Inactive:')).not.toBeInTheDocument();
    });

    it('renders empty table when all stats are undefined', () => {
      const emptyStats = {};

      render(<LineStatsTable line="Blue" stats={emptyStats} />);

      const table = screen.getByRole('table');
      expect(table).toHaveClass('stats-table');

      // Should have no data rows - check that tbody is empty
      const tbody = screen.getByRole('rowgroup');
      expect(tbody).toBeInTheDocument();
      expect(tbody.children).toHaveLength(0);
    });
  });

  describe('Stat Count Display', () => {
    it('displays stat counts with correct CSS class', () => {
      render(<LineStatsTable line="Red" stats={mockStats} />);

      const statCounts = screen.getAllByText(/^\d+$/);
      statCounts.forEach(count => {
        expect(count).toHaveClass('stat-count');
      });
    });

    it('displays zero values correctly', () => {
      const zeroStats = {
        totalActive: 0,
        totalInactive: 0,
        totalNewDelivered: 0,
        totalNewUndelivered: 0,
        totalOldActive: 0,
        totalOldInactive: 0,
      };

      render(<LineStatsTable line="Mattapan" stats={zeroStats} />);

      const zeroElements = screen.getAllByText('0');
      expect(zeroElements.length).toBeGreaterThan(0);
      expect(zeroElements).toHaveLength(6);
    });
  });

  describe('Green Line Specific Behavior', () => {
    it('does not render standard stats for Green line', () => {
      render(<LineStatsTable line="Green" stats={mockStats} />);

      // Green line should not render standard stats (without Type prefix)
      expect(screen.queryByText('Train Cars Active:')).not.toBeInTheDocument();
      expect(screen.queryByText('Train Cars Inactive:')).not.toBeInTheDocument();
      
      // Green line should render Type-specific versions instead of generic ones
      expect(screen.getAllByText('Type 10')).toHaveLength(2);
      expect(screen.getAllByText('Type 9')).toHaveLength(2);
      expect(screen.getAllByText('Type 8')).toHaveLength(2);
      expect(screen.getAllByText('Type 7')).toHaveLength(2);
    });

    it('renders Green line stats even when some values are undefined', () => {
      const partialGreenStats = {
        totalType10Delivered: 5,
        totalType9Delivered: 3,
        totalType8Active: 10,
        totalType7Active: 8,
        // Other Green line stats are undefined
      };

      render(<LineStatsTable line="Green" stats={partialGreenStats} />);

      // Should render the defined Green line stats
      expect(screen.getAllByText('Type 10')).toHaveLength(2);
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getAllByText('Type 9')).toHaveLength(2);
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getAllByText('Type 8')).toHaveLength(2);
      expect(screen.getByText('10')).toBeInTheDocument();
      expect(screen.getAllByText('Type 7')).toHaveLength(2);
      expect(screen.getByText('8')).toBeInTheDocument();
    });
  });
});