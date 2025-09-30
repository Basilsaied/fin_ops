/// <reference types="cypress" />

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to create an expense via API
       */
      createExpense(expense: {
        category: string;
        amount: number;
        month: number;
        year: number;
      }): Chainable<any>;

      /**
       * Custom command to clean up test data
       */
      cleanupTestData(): Chainable<any>;

      /**
       * Custom command to seed test data
       */
      seedTestData(expenses: any[]): Chainable<any>;

      /**
       * Custom command to wait for chart to load
       */
      waitForChart(chartSelector: string): Chainable<any>;

      /**
       * Custom command to check accessibility
       */
      checkA11y(): Chainable<any>;
    }
  }
}

// Create expense via API
Cypress.Commands.add('createExpense', (expense) => {
  return cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/expenses`,
    body: expense,
    failOnStatusCode: false,
  });
});

// Clean up test data
Cypress.Commands.add('cleanupTestData', () => {
  return cy.request({
    method: 'DELETE',
    url: `${Cypress.env('apiUrl')}/expenses/test-cleanup`,
    failOnStatusCode: false,
  });
});

// Seed test data
Cypress.Commands.add('seedTestData', (expenses) => {
  expenses.forEach(expense => {
    cy.createExpense(expense);
  });
});

// Wait for chart to load
Cypress.Commands.add('waitForChart', (chartSelector) => {
  cy.get(chartSelector).should('be.visible');
  cy.get('[data-testid="loading-spinner"]').should('not.exist');
  // Wait for chart animation to complete
  cy.wait(2000);
});

// Basic accessibility check
Cypress.Commands.add('checkA11y', () => {
  // Check for basic accessibility issues
  cy.get('img').each(($img) => {
    cy.wrap($img).should('have.attr', 'alt');
  });
  
  cy.get('input, select, textarea').each(($input) => {
    cy.wrap($input).should('satisfy', ($el) => {
      return $el.attr('aria-label') || $el.attr('id') || $el.closest('label').length > 0;
    });
  });
});