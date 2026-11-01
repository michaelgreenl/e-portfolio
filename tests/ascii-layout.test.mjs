// Start Vite, then run PORTFOLIO_URL=http://127.0.0.1:5173 node --test tests/ascii-layout.test.mjs.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { chromium, webkit } from 'playwright';

const url = process.env.PORTFOLIO_URL || 'http://127.0.0.1:5173';

for (const engine of [chromium, webkit]) {
    await test(engine.name(), async (t) => {
        const browser = await engine.launch();
        try {
            for (const [width, height, reducedMotion] of [
                [440, 753, 'no-preference'],
                [502, 793, 'no-preference'],
                [768, 900, 'no-preference'],
                [1600, 1000, 'no-preference'],
                [440, 753, 'reduce'],
            ]) {
                await t.test(`greeting and corner at ${width}px, motion: ${reducedMotion}`, async (viewTest) => {
                    const context = await browser.newContext({
                        viewport: { width, height },
                        deviceScaleFactor: 3,
                        isMobile: width < 800,
                        hasTouch: width < 800,
                        reducedMotion,
                    });
                    try {
                        const page = await context.newPage();
                        await page.addInitScript(() => {
                            window.asciiPaint = [];
                            const { clearRect, fillText } = CanvasRenderingContext2D.prototype;
                            CanvasRenderingContext2D.prototype.clearRect = function (...args) {
                                if (this.canvas.dataset.testid === 'ascii-field') window.asciiPaint = [];
                                return clearRect.apply(this, args);
                            };
                            CanvasRenderingContext2D.prototype.fillText = function (text, x, y, ...args) {
                                if (this.canvas.dataset.testid === 'ascii-field') {
                                    const cellWidth = this.measureText('M').width;
                                    [...text].forEach((char, i) => {
                                        if (char !== ' ') window.asciiPaint.push({ x: x + i * cellWidth, y });
                                    });
                                }
                                return fillText.call(this, text, x, y, ...args);
                            };

                            window.greetingLandings = [];
                            let start;
                            let target;
                            const sample = (now) => {
                                const greeting = document.querySelector('[data-testid="hero-greeting"]');
                                if (greeting !== target) {
                                    target = greeting;
                                    start = undefined;
                                    window.greetingLandings = [];
                                    window.greetingSampleDone = false;
                                }
                                if (greeting && !window.greetingSampleDone) {
                                    start ??= now;
                                    const style = getComputedStyle(greeting);
                                    if (parseFloat(style.opacity) > 0) {
                                        const y =
                                            style.transform === 'none' ? 0 : new DOMMatrixReadOnly(style.transform).m42;
                                        const title = greeting.nextElementSibling.getBoundingClientRect();
                                        window.greetingLandings.push(
                                            greeting.getBoundingClientRect().top - y - title.top,
                                        );
                                    }
                                }
                                if (start !== undefined && now - start >= 1800) window.greetingSampleDone = true;
                                requestAnimationFrame(sample);
                            };
                            requestAnimationFrame(sample);
                        });
                        await page.goto(url);
                        await page.waitForFunction(() => window.greetingSampleDone);
                        const landings = await page.evaluate(() => window.greetingLandings);
                        assert.ok(landings.length > 1, 'The greeting animation was not sampled');
                        assert.ok(
                            Math.max(...landings) - Math.min(...landings) < 0.25,
                            'The greeting changed its landing position during or after entry',
                        );

                        if (width === 440 || width === 502) {
                            const corner = await page.getByTestId('hero-last-name').evaluate((el) => {
                                const node = el.firstChild;
                                const end = node.data.trimEnd().length;
                                const range = document.createRange();
                                range.setStart(node, end - 1);
                                range.setEnd(node, end);
                                const style = getComputedStyle(el);
                                const ctx = document.createElement('canvas').getContext('2d');
                                ctx.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
                                const ink = ctx.measureText(node.data[end - 1]);
                                const top =
                                    range.getBoundingClientRect().top +
                                    ink.fontBoundingBoxAscent -
                                    ink.actualBoundingBoxAscent;
                                const right = el.getBoundingClientRect().right;
                                const cells = window.asciiPaint.filter((cell) => cell.x >= right);
                                const rows = [...new Set(cells.map((cell) => cell.y))].sort((a, b) => a - b);
                                const row = rows.findLastIndex((y) => y <= top);
                                const first = (y) =>
                                    Math.min(...cells.filter((cell) => cell.y === y).map((cell) => cell.x));
                                return { top: first(rows[row]), side: first(rows[row + 2]) };
                            });
                            assert.ok(
                                corner.top < corner.side,
                                'The painted corner character beside the last letter is missing',
                            );
                        }
                        if ((width === 440 || width === 768) && reducedMotion === 'no-preference') {
                            await viewTest.test('greeting stays fixed when returning Home', async () => {
                                await page.getByRole('button', { name: 'Projects', exact: true }).click();
                                await page.getByTestId('hero-greeting').waitFor({ state: 'detached' });
                                await page.getByRole('button', { name: 'Home', exact: true }).click();
                                await page.getByTestId('hero-greeting').waitFor({ state: 'visible' });
                                await page.waitForFunction(() => window.greetingSampleDone);
                                const returned = await page.evaluate(() => window.greetingLandings);
                                assert.ok(
                                    returned.length > 1 && Math.max(...returned) - Math.min(...returned) < 0.25,
                                    'The greeting changed its landing position after returning Home',
                                );
                            });
                        }
                    } finally {
                        await context.close();
                    }
                });
            }
        } finally {
            await browser.close();
        }
    });
}
