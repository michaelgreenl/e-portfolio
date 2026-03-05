/**
 * Issue: Image Loading — Project images flash in on the Projects page
 *
 * Context (from issue.md & revised plans):
 *   The preloading architecture uses `loadRouteAssets` to pre-fetch images via
 *   `new Image()` with URLs constructed from `new URL('../assets/images/${f}',
 *   import.meta.url).href`. The Projects view uses the identical `getURL()` helper
 *   so that the browser cache should serve preloaded images instantly when the
 *   DOM <img> elements mount.
 *
 *   The bug: images are fetched a *second* time when navigating to /projects,
 *   causing them to flash in after the GSAP enter animation instead of being
 *   visible from the first paint.
 *
 * Strategy:
 *   1. Load the app on the home route and let background preloading complete.
 *   2. Navigate to the Projects page.
 *   3. Assert that every project image is fully loaded (naturalWidth > 0,
 *      complete === true) and visible (opacity: 1) immediately after the
 *      enter animation settles — no second network fetch, no flash-in.
 *   4. Verify that images are NOT re-fetched on subsequent visits.
 *
 * Key selectors & timings (from codebase exploration):
 *   - Project card:   `.project-card`
 *   - Project image:  `img.project-img`
 *   - Nav item:       `.nav-item` (desktop navigation)
 *   - Leave duration: 350 ms
 *   - Spinner debounce: 100 ms
 *   - Enter animation: ~450 ms (0.3 s + 3 × 0.05 s stagger for 4 cards)
 *   - Loading spinner: `.route-loading`
 *   - Hash routing:    #home, #projects
 *
 * Image filenames preloaded for the `projects` route:
 *   - algo-visualizer_blurred.webp
 *   - game-lobby_blurred.webp
 *   - reaction_blurred.webp
 *   - tally_blurred.webp
 */

const EXPECTED_IMAGE_COUNT = 4;

// Leave animation (350 ms) + spinner debounce headroom (100 ms) + enter
// animation (≈450 ms) + generous buffer for CI/rendering = ~1500 ms.
// We use this as a wait ceiling, NOT a hard sleep — Cypress assertions will
// pass as soon as the condition is met thanks to automatic retries.
const TRANSITION_BUDGET_MS = 1500;

// Maximum time we allow for background preloading to finish after initial load.
const PRELOAD_BUDGET_MS = 5000;

describe('Image Loading — Projects page images should not flash in', () => {
    /**
     * Helper: assert that an <img> element is fully loaded by the browser.
     * A loaded image has `complete === true` AND `naturalWidth > 0`.
     * An image that failed or hasn't started loading will have naturalWidth 0.
     */
    const assertImageLoaded = ($img) => {
        expect($img[0].complete, 'img.complete should be true').to.be.true;
        expect($img[0].naturalWidth, 'img.naturalWidth should be > 0').to.be.greaterThan(0);
    };

    // -----------------------------------------------------------------------
    // Test 1: Images are visible on first paint after navigating to /projects
    // -----------------------------------------------------------------------
    it('should display all project images immediately with the enter animation — no flash-in', () => {
        // 1. Visit the app on the home route so background preloading can run.
        cy.visit('/#home');

        // 2. Wait for the home route to be fully ready (spinner gone, page rendered).
        cy.get('.route-loading', { timeout: 10000 }).should('not.exist');

        // 3. Give background preloading time to cache project images.
        //    We watch for the projects nav item to be clickable and then allow
        //    idle-time preloading to finish before navigating.
        // eslint-disable-next-line cypress/no-unnecessary-waiting
        cy.wait(PRELOAD_BUDGET_MS);

        // 4. Navigate to the Projects page via the desktop nav.
        cy.get('.nav-item').contains('Projects').click();

        // 5. The loading spinner should NOT appear (assets are preloaded).
        //    We assert it never becomes visible during the transition window.
        cy.get('.route-loading').should('not.exist');

        // 6. Wait for project cards to appear (enter animation mounting).
        cy.get('.project-card', { timeout: TRANSITION_BUDGET_MS }).should('have.length', EXPECTED_IMAGE_COUNT);

        // 7. CORE ASSERTION — Every project image must be fully loaded and
        //    visible as soon as the cards are in the DOM. If images flash in
        //    later, either `complete` will be false or opacity will be < 1
        //    at this point.
        cy.get('img.project-img', { timeout: TRANSITION_BUDGET_MS })
            .should('have.length', EXPECTED_IMAGE_COUNT)
            .each(($img) => {
                assertImageLoaded($img);
            });

        // 8. After the enter animation completes, all cards (and their images)
        //    should be fully opaque.
        cy.get('.project-card', { timeout: TRANSITION_BUDGET_MS }).each(($card) => {
            cy.wrap($card).should('have.css', 'opacity', '1');
        });
    });

    // -----------------------------------------------------------------------
    // Test 2: Images are NOT re-fetched on a second visit to /projects
    // -----------------------------------------------------------------------
    it('should not re-fetch images when navigating to /projects a second time', () => {
        // 1. Start on home, let preloading complete.
        cy.visit('/#home');
        cy.get('.route-loading', { timeout: 10000 }).should('not.exist');
        // eslint-disable-next-line cypress/no-unnecessary-waiting
        cy.wait(PRELOAD_BUDGET_MS);

        // 2. First visit to Projects — prime the route.
        cy.get('.nav-item').contains('Projects').click();
        cy.get('img.project-img', { timeout: TRANSITION_BUDGET_MS }).should('have.length', EXPECTED_IMAGE_COUNT);

        // 3. Navigate away (back to Home).
        cy.get('.nav-item').contains('Home').click();
        cy.get('.route-loading', { timeout: 10000 }).should('not.exist');

        // 4. Set up a spy on image-related network requests BEFORE the second
        //    navigation. We intercept any request whose URL contains one of the
        //    known blurred image filenames.
        cy.intercept('**/*_blurred*.webp').as('imageRequest');

        // 5. Navigate to Projects again.
        cy.get('.nav-item').contains('Projects').click();

        // 6. Project cards and images should appear instantly.
        cy.get('img.project-img', { timeout: TRANSITION_BUDGET_MS })
            .should('have.length', EXPECTED_IMAGE_COUNT)
            .each(($img) => {
                assertImageLoaded($img);
            });

        // 7. Verify no new image network requests were made. We wait a small
        //    window and then assert the alias was never called.
        // eslint-disable-next-line cypress/no-unnecessary-waiting
        cy.wait(500);
        cy.get('@imageRequest.all').should('have.length', 0);
    });

    // -----------------------------------------------------------------------
    // Test 3: Images animate in with their parent cards (no late pop-in)
    // -----------------------------------------------------------------------
    it('should have images visible inside cards during the enter animation (not after)', () => {
        cy.visit('/#home');
        cy.get('.route-loading', { timeout: 10000 }).should('not.exist');
        // eslint-disable-next-line cypress/no-unnecessary-waiting
        cy.wait(PRELOAD_BUDGET_MS);

        cy.get('.nav-item').contains('Projects').click();

        // As soon as each card exists in the DOM, its image should already be
        // loaded. We check `complete` immediately — if the image hasn't loaded
        // yet, this will fail, proving the flash-in bug.
        cy.get('.project-card', { timeout: TRANSITION_BUDGET_MS })
            .should('have.length', EXPECTED_IMAGE_COUNT)
            .each(($card) => {
                cy.wrap($card)
                    .find('img.project-img')
                    .then(($img) => {
                        assertImageLoaded($img);
                    });
            });
    });

    // -----------------------------------------------------------------------
    // Test 4: Direct navigation to /projects (cold, no preload from /home)
    // -----------------------------------------------------------------------
    it('should load images before the enter animation when navigating directly to #projects', () => {
        // Visit /projects directly — the initial load path (not background
        // preloading) should still ensure images are ready before mounting.
        cy.visit('/#projects');

        // The spinner may appear briefly on a cold load — that's fine.
        // Wait for the spinner to disappear and the page to render.
        cy.get('.route-loading', { timeout: 10000 }).should('not.exist');

        // Once project cards are visible, images must already be loaded.
        cy.get('.project-card', { timeout: TRANSITION_BUDGET_MS }).should('have.length', EXPECTED_IMAGE_COUNT);

        cy.get('img.project-img', { timeout: TRANSITION_BUDGET_MS })
            .should('have.length', EXPECTED_IMAGE_COUNT)
            .each(($img) => {
                assertImageLoaded($img);
            });

        // All cards should reach full opacity after enter animation.
        cy.get('.project-card').each(($card) => {
            cy.wrap($card).should('have.css', 'opacity', '1');
        });
    });
});
