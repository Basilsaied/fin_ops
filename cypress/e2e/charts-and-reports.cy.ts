describe('Charts and Reports', () => {
  beforeEach(() => {
    // Clean up and seed test data
    cy.cleanupTestData();
    
    const testExpenses = [
      { category: 'Salaries', amount: 50000, month: 1, year: 2024 },
      { category: 'Software & Tools', amount: 2500, month: 1, year: 2024 },
      { category: 'Infrastructure & Hosting', amount: 1200, month: 1, year: 2024 },
      { category: 'Salaries', amount: 52000, month: 2, year: 2024 },
      { category: 'Software & Tools', amount: 2300, month: 2, year: 2024 },
      { category: 'Infrastructure & Hosting', amount: 1100, month: 2, year: 2024 },
    ];
    
    cy.seedTestData(testExpenses);
    cy.visit('/reports');
  });

  after(() => {
    cy.cleanupTestData();
  });

  describe('Chart Loading and Performance', () => {
    it('should load charts within 2 seconds', () => {
      const startTime = Date.now();
      
      // Wait for charts to be visible
      cy.get('[data-testid="bar-chart"]').should('be.visible');
      cy.get('[data-testid="line-chart"]').should('be.visible');
      
      // Verify loading time
      cy.then(() => {
        const loadTime = Date.now() - startTime;
        expect(loadTime).to.be.lessThan(2000);
      });
    });

    it('should display loading states correctly', () => {
      // Intercept API calls to simulate slow loading
      cy.intercept('GET', '**/api/expenses/trends', { delay: 1000 }).as('getTrends');
      
      cy.visit('/reports');
      
      // Check loading spinner is visible
      cy.get('[data-testid="loading-spinner"]').should('be.visible');
      
      // Wait for API call to complete
      cy.wait('@getTrends');
      
      // Check loading spinner is gone
      cy.get('[data-testid="loading-spinner"]').should('not.exist');
      cy.get('[data-testid="bar-chart"]').should('be.visible');
    });

    it('should handle chart errors gracefully', () => {
      // Intercept API calls to simulate error
      cy.intercept('GET', '**/api/expenses/trends', { statusCode: 500 }).as('getTrendsError');
      
      cy.visit('/reports');
      
      // Wait for error
      cy.wait('@getTrendsError');
      
      // Check error message is displayed
      cy.get('[data-testid="error-message"]')
        .should('be.visible')
        .and('contain.text', 'Failed to load chart data');
      
      // Check retry button is available
      cy.get('[data-testid="retry-button"]').should('be.visible');
    });
  });

  describe('Bar Chart Functionality', () => {
    it('should display category breakdown correctly', () => {
      cy.waitForChart('[data-testid="bar-chart"]');
      
      // Check chart title
      cy.get('[data-testid="bar-chart-title"]')
        .should('contain.text', 'Monthly Expenses by Category');
      
      // Check chart data
      cy.get('[data-testid="bar-chart"] .recharts-bar').should('have.length.at.least', 3);
      
      // Check tooltip functionality
      cy.get('[data-testid="bar-chart"] .recharts-bar').first().trigger('mouseover');
      cy.get('.recharts-tooltip').should('be.visible');
    });

    it('should update when month/year selection changes', () => {
      cy.waitForChart('[data-testid="bar-chart"]');
      
      // Change month selection
      cy.get('[data-testid="month-selector"]').select('2');
      
      // Wait for chart to update
      cy.waitForChart('[data-testid="bar-chart"]');
      
      // Verify chart updated (different data should be shown)
      cy.get('[data-testid="bar-chart"]').should('be.visible');
    });

    it('should be interactive with hover effects', () => {
      cy.waitForChart('[data-testid="bar-chart"]');
      
      // Hover over a bar
      cy.get('[data-testid="bar-chart"] .recharts-bar').first().trigger('mouseover');
      
      // Check tooltip appears
      cy.get('.recharts-tooltip').should('be.visible');
      
      // Check tooltip content
      cy.get('.recharts-tooltip').should('contain.text', '$');
      cy.get('.recharts-tooltip').should('contain.text', 'Salaries');
    });
  });

  describe('Line Chart Functionality', () => {
    it('should display trend data correctly', () => {
      cy.waitForChart('[data-testid="line-chart"]');
      
      // Check chart title
      cy.get('[data-testid="line-chart-title"]')
        .should('contain.text', 'Expense Trends Over Time');
      
      // Check line is present
      cy.get('[data-testid="line-chart"] .recharts-line').should('exist');
      
      // Check data points
      cy.get('[data-testid="line-chart"] .recharts-dot').should('have.length.at.least', 2);
    });

    it('should show trend indicators', () => {
      cy.waitForChart('[data-testid="line-chart"]');
      
      // Check for trend indicators (arrows or percentage changes)
      cy.get('[data-testid="trend-indicator"]').should('exist');
      
      // Verify trend calculation
      cy.get('[data-testid="trend-percentage"]').should('contain.text', '%');
    });

    it('should handle multiple data series', () => {
      cy.waitForChart('[data-testid="line-chart"]');
      
      // Enable category breakdown
      cy.get('[data-testid="show-categories-toggle"]').click();
      
      // Wait for chart to update
      cy.waitForChart('[data-testid="line-chart"]');
      
      // Check multiple lines are present
      cy.get('[data-testid="line-chart"] .recharts-line').should('have.length.at.least', 2);
    });
  });

  describe('Chart Responsiveness', () => {
    it('should be responsive on mobile devices', () => {
      cy.viewport('iphone-x');
      
      cy.waitForChart('[data-testid="bar-chart"]');
      cy.waitForChart('[data-testid="line-chart"]');
      
      // Check charts are still visible and properly sized
      cy.get('[data-testid="bar-chart"]').should('be.visible');
      cy.get('[data-testid="line-chart"]').should('be.visible');
      
      // Check charts don't overflow
      cy.get('[data-testid="bar-chart"]').should('have.css', 'width').and('match', /^\d+px$/);
    });

    it('should be responsive on tablet devices', () => {
      cy.viewport('ipad-2');
      
      cy.waitForChart('[data-testid="bar-chart"]');
      cy.waitForChart('[data-testid="line-chart"]');
      
      // Check charts are properly sized for tablet
      cy.get('[data-testid="bar-chart"]').should('be.visible');
      cy.get('[data-testid="line-chart"]').should('be.visible');
    });

    it('should maintain aspect ratio on different screen sizes', () => {
      const viewports = ['macbook-15', 'ipad-2', 'iphone-x'];
      
      viewports.forEach(viewport => {
        cy.viewport(viewport as any);
        
        cy.waitForChart('[data-testid="bar-chart"]');
        
        // Check chart maintains proper proportions
        cy.get('[data-testid="bar-chart"]').then($chart => {
          const width = $chart.width();
          const height = $chart.height();
          const aspectRatio = width! / height!;
          
          // Aspect ratio should be reasonable (not too wide or tall)
          expect(aspectRatio).to.be.within(1, 3);
        });
      });
    });
  });

  describe('Data Export and Comparison', () => {
    it('should export chart data', () => {
      cy.waitForChart('[data-testid="bar-chart"]');
      
      // Click export button
      cy.get('[data-testid="export-button"]').click();
      
      // Check export options
      cy.get('[data-testid="export-csv"]').should('be.visible');
      cy.get('[data-testid="export-png"]').should('be.visible');
      
      // Test CSV export
      cy.get('[data-testid="export-csv"]').click();
      
      // Verify download (this might need to be mocked in a real test)
      cy.get('[data-testid="export-success"]').should('be.visible');
    });

    it('should compare multiple months', () => {
      // Enable comparison mode
      cy.get('[data-testid="comparison-toggle"]').click();
      
      // Select multiple months
      cy.get('[data-testid="month-selector-1"]').select('1');
      cy.get('[data-testid="month-selector-2"]').select('2');
      
      // Wait for comparison chart to load
      cy.waitForChart('[data-testid="comparison-chart"]');
      
      // Verify comparison data is shown
      cy.get('[data-testid="comparison-chart"]').should('be.visible');
      cy.get('[data-testid="comparison-legend"]').should('contain.text', 'January');
      cy.get('[data-testid="comparison-legend"]').should('contain.text', 'February');
    });
  });

  describe('Accessibility', () => {
    it('should be accessible with keyboard navigation', () => {
      cy.waitForChart('[data-testid="bar-chart"]');
      
      // Tab through interactive elements
      cy.get('body').tab();
      cy.focused().should('have.attr', 'data-testid', 'month-selector');
      
      cy.focused().tab();
      cy.focused().should('have.attr', 'data-testid', 'year-selector');
    });

    it('should have proper ARIA labels', () => {
      cy.waitForChart('[data-testid="bar-chart"]');
      
      // Check chart has proper ARIA attributes
      cy.get('[data-testid="bar-chart"]').should('have.attr', 'role', 'img');
      cy.get('[data-testid="bar-chart"]').should('have.attr', 'aria-label');
      
      // Check interactive elements have labels
      cy.get('[data-testid="month-selector"]').should('have.attr', 'aria-label');
    });

    it('should support screen readers', () => {
      cy.waitForChart('[data-testid="bar-chart"]');
      
      // Check for screen reader friendly content
      cy.get('[data-testid="chart-summary"]').should('exist');
      cy.get('[data-testid="chart-summary"]').should('contain.text', 'Total expenses');
      
      // Check data table alternative
      cy.get('[data-testid="data-table-toggle"]').click();
      cy.get('[data-testid="data-table"]').should('be.visible');
      cy.get('[data-testid="data-table"] th').should('contain.text', 'Category');
    });
  });
});