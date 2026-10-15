// GitHub Pages answers unknown paths with 404.html, so each route gets its own copy of the built page with its
// own canonical URL. Crawlers and link previews then get a 200 response for every route.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const ORIGIN = 'https://michaelgreenl.net/';
const ROUTES = ['projects', 'resume', 'contact'];

const html = readFileSync('dist/index.html', 'utf8');
for (const route of ROUTES) {
    mkdirSync(`dist/${route}`, { recursive: true });
    writeFileSync(`dist/${route}/index.html`, html.replaceAll(`"${ORIGIN}"`, `"${ORIGIN}${route}/"`));
}
