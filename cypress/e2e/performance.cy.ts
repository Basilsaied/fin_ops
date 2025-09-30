describe('Performance Tests', () => {
  beforeEach(() => {
    cy.cleanupTestData();
  });

  after(() => {
    cy.cleanupTestData();
  });

  describe('Page Load Performance', () => {
    it('should load dashboard within acceptable time', () => {
      const startTime = Date.now();
      
      cy.visit('/dashboard');
      
      // Wait for main content to be visible
      cy.get('[data-testid="dashboard-content"]').should('be.visible');
      
      cy.then(() => {
        const loadTime = Date.now() - startTime;
        expect(loadTime).to.be.lessThan(3000); // 3 seconds max
      });
    });

    it('should load add data page quickly', () => {
      const startTime = Date.now();
      
      cy.visit('/add-data');
      
      // Wait for form to be interactive
      cy.get('[data-testid="expense-form"]').should('be.visible');
      cy.get('[data-testid="category-select"]').should('be.enabled');
      
      cy.then(() => {
        const loadTime = Date.now() - startTime;
        expect(loadTime).to.be.lessThan(2000); // 2 seconds max
      });
    });

    it('should load reports page within 2 seconds', () => {
      // Seed minimal test data
      const testExpenses = [
        { category: 'Salaries', amount: 50000, month: 1, year: 2024 },
        { category: 'Software & Tools', amount: 2500, month: 1, year: 2024 },
      ];
      cy.seedTestData(testExpenses);

      const startTime = Date.now();
      
      cy.visit('/reports');
      
      // Wait for charts to be fully loaded
      cy.get('[data-testid="bar-chart"]').should('be.visible');
      cy.get('[data-testid="line-chart"]').should('be.visible');
      cy.get('[data-testid="loading-spinner"]').should('not.exist');
      
      cy.then(() => {
        const loadTime = Date.now() - startTime;
        expect(loadTime).to.be.lessThan(2000); // 2 seconds requirement
      });
    });
  });

  describe('Chart Rendering Performance', () => {
    it('should render bar chart within 2 seconds with moderate data', () => {
      // Create moderate dataset (12 months of data)
      const testExpenses = [];
      for (let month = 1; month <= 12; month++) {
        testExpenses.push(
          { category: 'Salaries', amount: 50000 + (month * 1000), month, year: 2024 },
          { category: 'Software & Tools', amount: 2500 + (month * 100), month, year: 2024 },
          { category: 'Infrastructure & Hosting', amount: 1200 + (month * 50), month, year: 2024 }
        );
      }
      cy.seedTestData(testExpenses);

      cy.visit('/reports');
      
      const startTime = Date.now();
      
      // Wait for chart to be fully rendered
      cy.waitForChart('[data-testid="bar-chart"]');
      
      cy.then(() => {
        const renderTime = Date.now() - startTime;
        expect(renderTime).to.be.lessThan(2000);
      });
    });

    it('should handle large datasets efficiently', () => {
      // Create large dataset (24 months of data across multiple categories)
      const testExpenses = [];
      const categories = ['Salaries', 'Software & Tools', 'Infrastructure & Hosting', 
                         'Hardware & Equipment', 'Security & Compliance'];
      
      for (let year = 2023; year <= 2024; year++) {
        for (let month = 1; month <= 12; month++) {
          categories.forEach(category => {
            testExpenses.push({
              category,
              amount: Math.floor(Math.random() * 10000) + 1000,
              month,
              year
            });
          });
        }
      }
      
      cy.seedTestData(testExpenses);
      cy.visit('/reports');
      
      const startTime = Date.now();
      
      // Wait for charts to render
      cy.waitForChart('[data-testid="bar-chart"]');
      cy.waitForChart('[data-testid="line-chart"]');
      
      cy.then(() => {
        const renderTime = Date.now() - startTime;
        expect(renderTime).to.be.lessThan(5000); // Allow more time for large dataset
      });
      
      // Verify charts are still interactive
      cy.get('[data-testid="bar-chart"] .recharts-bar').first().trigger('mouseover');
      cy.get('.recharts-tooltip').should('be.visible');
    });

    it('should update charts quickly when filters change', () => {
      // Seed test data
      const testExpenses = [
        { category: 'Salaries', amount: 50000, month: 1, year: 2024 },
        { category: 'Software & Tools', amount: 2500, month: 1, year: 2024 },
        { category: 'Salaries', amount: 52000, month: 2, year: 2024 },
        { category: 'Software & Tools', amount: 2300, month: 2, year: 2024 },
      ];
      cy.seedTestData(testExpenses);

      cy.visit('/reports');
      cy.waitForChart('[data-testid="bar-chart"]');
      
      const startTime = Date.now();
      
      // Change month filter
      cy.get('[data-testid="month-selector"]').select('2');
      
      // Wait for chart to update
      cy.waitForChart('[data-testid="bar-chart"]');
      
      cy.then(() => {
        const updateTime = Date.now() - startTime;
        expect(updateTime).to.be.lessThan(1000); // Chart updates should be fast
      });
    });
  });

  describe('Form Performance', () => {
    it('should submit expense form quickly', () => {
      cy.visit('/add-data');
      
      // Fill form
      cy.get('[data-testid="category-select"]').select('Software & Tools');
      cy.get('[data-testid="amount-input"]').type('1500');
      cy.get('[data-testid="month-select"]').select('3');
      cy.get('[data-testid="year-select"]').select('2024');
      
      const startTime = Date.now();
      
      // Submit form
      cy.get('[data-testid="submit-button"]').click();
      
      // Wait for success message
      cy.get('[data-testid="success-message"]').should('be.visible');
      
      cy.then(() => {
        const submitTime = Date.now() - startTime;
        expect(submitTime).to.be.lessThan(2000);
      });
    });

    it('should validate form fields quickly', () => {
      cy.visit('/add-data');
      
      const startTime = Date.now();
      
      // Trigger validation by submitting empty form
      cy.get('[data-testid="submit-button"]').click();
      
      // Wait for validation errors
      cy.get('[data-testid="category-error"]').should('be.visible');
      
      cy.then(() => {
        const validationTime = Date.now() - startTime;
        expect(validationTime).to.be.lessThan(500); // Validation should be instant
      });
    });
  });

  describe('Memory and Resource Usage', () => {
    it('should not cause memory leaks during navigation', () => {
      // Navigate between pages multiple times
      for (let i = 0; i < 5; i++) {
        cy.visit('/dashboard');
        cy.get('[data-testid="dashboard-content"]').should('be.visible');
        
        cy.visit('/add-data');
        cy.get('[data-testid="expense-form"]').should('be.visible');
        
        cy.visit('/reports');
        cy.get('[data-testid="bar-chart"]').should('be.visible');
      }
      
      // Check that the page is still responsive
      cy.get('a[href="/dashboard"]').click();
      cy.get('[data-testid="dashboard-content"]').should('be.visible');
    });

    it('should handle rapid user interactions', () => {
      cy.visit('/add-data');
      
      // Rapidly change form values
      for (let i = 0; i < 10; i++) {
        cy.get('[data-testid="amount-input"]').clear().type(`${1000 + i}`);
        cy.get('[data-testid="month-select"]').select(`${(i % 12) + 1}`);
      }
      
      // Form should still be responsive
      cy.get('[data-testid="amount-input"]').should('have.value', '1009');
      cy.get('[data-testid="month-select"]').should('have.value', '10');
    });
  });

  describe('Network Performance', () => {
    it('should handle slow network conditions', () => {
      // Simulate slow network
      cy.intercept('GET', '**/api/expenses**', { delay: 2000 }).as('getExpenses');
      
      cy.visit('/dashboard');
      
      // Should show loading state
      cy.get('[data-testid="loading-spinner"]').should('be.visible');
      
      // Wait for request to complete
      cy.wait('@getExpenses');
      
      // Should show content after loading
      cy.get('[data-testid="loading-spinner"]').should('not.exist');
      cy.get('[data-testid="dashboard-content"]').should('be.visible');
    });

    it('should handle network errors gracefully', () => {
      // Simulate network error
      cy.intercept('GET', '**/api/expenses**', { statusCode: 500 }).as('getExpensesError');
      
      cy.visit('/dashboard');
      
      // Wait for error
      cy.wait('@getExpensesError');
      
      // Should show error message
      cy.get('[data-testid="error-message"]').should('be.visible');
      cy.get('[data-testid="retry-button"]').should('be.visible');
      
      // Retry should work
      cy.intercept('GET', '**/api/expenses**', { fixture: 'expenses.json' }).as('getExpensesRetry');
      cy.get('[data-testid="retry-button"]').click();
      
      cy.wait('@getExpensesRetry');
      cy.get('[data-testid="dashboard-content"]').should('be.visible');
    });
  });
});