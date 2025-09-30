describe('Expense Management Application', () => {
  beforeEach(() => {
    // Clean up test data before each test
    cy.cleanupTestData();
    cy.visit('/');
  });

  after(() => {
    // Clean up after all tests
    cy.cleanupTestData();
  });

  describe('Navigation and Layout', () => {
    it('should display main navigation correctly', () => {
      cy.get('[data-testid="navigation"]').should('be.visible');
      cy.get('a[href="/dashboard"]').should('contain.text', 'Dashboard');
      cy.get('a[href="/add-data"]').should('contain.text', 'Add Data');
      cy.get('a[href="/reports"]').should('contain.text', 'Reports');
    });

    it('should navigate between pages correctly', () => {
      // Navigate to Add Data
      cy.get('a[href="/add-data"]').click();
      cy.url().should('include', '/add-data');
      cy.get('h1').should('contain.text', 'Add Expense');

      // Navigate to Reports
      cy.get('a[href="/reports"]').click();
      cy.url().should('include', '/reports');
      cy.get('h1').should('contain.text', 'Reports');

      // Navigate back to Dashboard
      cy.get('a[href="/dashboard"]').click();
      cy.url().should('include', '/dashboard');
      cy.get('h1').should('contain.text', 'Dashboard');
    });

    it('should be responsive on mobile devices', () => {
      cy.viewport('iphone-x');
      
      // Check mobile navigation
      cy.get('[data-testid="mobile-menu-toggle"]').should('be.visible');
      cy.get('[data-testid="mobile-menu-toggle"]').click();
      cy.get('[data-testid="mobile-menu"]').should('be.visible');
      
      // Navigate on mobile
      cy.get('a[href="/add-data"]').click();
      cy.url().should('include', '/add-data');
    });
  });

  describe('Expense Creation Flow', () => {
    it('should create a new expense successfully', () => {
      cy.visit('/add-data');

      // Fill out the form
      cy.get('[data-testid="category-select"]').select('Software & Tools');
      cy.get('[data-testid="amount-input"]').type('1500.50');
      cy.get('[data-testid="month-select"]').select('3');
      cy.get('[data-testid="year-select"]').select('2024');

      // Submit the form
      cy.get('[data-testid="submit-button"]').click();

      // Verify success message
      cy.get('[data-testid="success-message"]')
        .should('be.visible')
        .and('contain.text', 'Expense created successfully');

      // Verify redirect to dashboard
      cy.url().should('include', '/dashboard');

      // Verify expense appears in the list
      cy.get('[data-testid="expense-list"]').should('contain.text', 'Software & Tools');
      cy.get('[data-testid="expense-list"]').should('contain.text', '$1,500.50');
    });

    it('should validate form fields correctly', () => {
      cy.visit('/add-data');

      // Try to submit empty form
      cy.get('[data-testid="submit-button"]').click();

      // Check validation errors
      cy.get('[data-testid="category-error"]').should('contain.text', 'Category is required');
      cy.get('[data-testid="amount-error"]').should('contain.text', 'Amount is required');
      cy.get('[data-testid="month-error"]').should('contain.text', 'Month is required');
      cy.get('[data-testid="year-error"]').should('contain.text', 'Year is required');

      // Test invalid amount
      cy.get('[data-testid="amount-input"]').type('-100');
      cy.get('[data-testid="submit-button"]').click();
      cy.get('[data-testid="amount-error"]').should('contain.text', 'Amount must be positive');

      // Test invalid month
      cy.get('[data-testid="amount-input"]').clear().type('1000');
      cy.get('[data-testid="month-select"]').select('13');
      cy.get('[data-testid="submit-button"]').click();
      cy.get('[data-testid="month-error"]').should('contain.text', 'Invalid month');
    });

    it('should prevent duplicate entries', () => {
      // Create first expense
      cy.createExpense({
        category: 'Software & Tools',
        amount: 1500,
        month: 3,
        year: 2024
      });

      cy.visit('/add-data');

      // Try to create duplicate
      cy.get('[data-testid="category-select"]').select('Software & Tools');
      cy.get('[data-testid="amount-input"]').type('2000');
      cy.get('[data-testid="month-select"]').select('3');
      cy.get('[data-testid="year-select"]').select('2024');
      cy.get('[data-testid="submit-button"]').click();

      // Verify error message
      cy.get('[data-testid="error-message"]')
        .should('be.visible')
        .and('contain.text', 'Duplicate entry');
    });
  });

  describe('Expense Management', () => {
    beforeEach(() => {
      // Seed test data
      const testExpenses = [
        { category: 'Salaries', amount: 50000, month: 1, year: 2024 },
        { category: 'Software & Tools', amount: 2500, month: 1, year: 2024 },
        { category: 'Infrastructure & Hosting', amount: 1200, month: 1, year: 2024 },
      ];
      cy.seedTestData(testExpenses);
    });

    it('should display expense list correctly', () => {
      cy.visit('/dashboard');

      // Check if expenses are displayed
      cy.get('[data-testid="expense-list"]').should('be.visible');
      cy.get('[data-testid="expense-row"]').should('have.length', 3);

      // Check expense details
      cy.get('[data-testid="expense-row"]').first().within(() => {
        cy.get('[data-testid="expense-category"]').should('contain.text', 'Salaries');
        cy.get('[data-testid="expense-amount"]').should('contain.text', '$50,000');
        cy.get('[data-testid="expense-date"]').should('contain.text', '1/2024');
      });
    });

    it('should edit an expense successfully', () => {
      cy.visit('/dashboard');

      // Click edit button on first expense
      cy.get('[data-testid="expense-row"]').first().within(() => {
        cy.get('[data-testid="edit-button"]').click();
      });

      // Verify edit form is pre-populated
      cy.get('[data-testid="amount-input"]').should('have.value', '50000');
      cy.get('[data-testid="category-select"]').should('have.value', 'Salaries');

      // Update amount
      cy.get('[data-testid="amount-input"]').clear().type('55000');
      cy.get('[data-testid="submit-button"]').click();

      // Verify success message
      cy.get('[data-testid="success-message"]')
        .should('be.visible')
        .and('contain.text', 'Expense updated successfully');

      // Verify updated amount in list
      cy.get('[data-testid="expense-list"]').should('contain.text', '$55,000');
    });

    it('should delete an expense successfully', () => {
      cy.visit('/dashboard');

      // Click delete button on first expense
      cy.get('[data-testid="expense-row"]').first().within(() => {
        cy.get('[data-testid="delete-button"]').click();
      });

      // Confirm deletion
      cy.get('[data-testid="confirm-delete-button"]').click();

      // Verify success message
      cy.get('[data-testid="success-message"]')
        .should('be.visible')
        .and('contain.text', 'Expense deleted successfully');

      // Verify expense is removed from list
      cy.get('[data-testid="expense-row"]').should('have.length', 2);
      cy.get('[data-testid="expense-list"]').should('not.contain.text', 'Salaries');
    });

    it('should filter expenses correctly', () => {
      cy.visit('/dashboard');

      // Filter by category
      cy.get('[data-testid="category-filter"]').select('Salaries');
      cy.get('[data-testid="expense-row"]').should('have.length', 1);
      cy.get('[data-testid="expense-list"]').should('contain.text', 'Salaries');

      // Clear filter
      cy.get('[data-testid="category-filter"]').select('All Categories');
      cy.get('[data-testid="expense-row"]').should('have.length', 3);

      // Search by text
      cy.get('[data-testid="search-input"]').type('Software');
      cy.get('[data-testid="expense-row"]').should('have.length', 1);
      cy.get('[data-testid="expense-list"]').should('contain.text', 'Software & Tools');
    });
  });
});