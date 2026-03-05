import { defineConfig } from 'cypress';

export default defineConfig({
    e2e: {
        baseUrl: 'http://localhost:5173',
        supportFile: false,
        allowCypressEnv: false,
        specPattern: ['tests/e2e/**/*.cy.{js,jsx,ts,tsx}', 'docs/agents/initiatives/*/issues/*/issue.cy.js'],
        excludeSpecPattern: [
            'docs/agents/initiatives/archived/**/*',
            'docs/agents/initiatives/*/issues/fixed-issues/**/*',
        ],
        setupNodeEvents(on, config) {
            // Node event listeners can go here
        },
    },
});
