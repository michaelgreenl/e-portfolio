// GitHub Pages answers unknown paths with 404.html, so each route gets its own copy of the built page with its
// own canonical URL. Crawlers and link previews then get a 200 response for every route.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const ORIGIN = 'https://michaelgreenl.net/';
const ROUTES = ['projects', 'resume', 'contact'];

const html = readFileSync('dist/index.html', 'utf8');
for (const route of ROUTES) {
    mkdirSync(`dist/${route}`, { recursive: true });
    writeFileSync(`dist/${route}/index.html`, html.replaceAll(`"${ORIGIN}"`, `"${ORIGIN}${route}/"`));
}

// The host serves the same HTML for every query string, so /projects?slug=x can't have its own link preview. Each
// project gets a /demo/<slug>/ page with its own preview tags that sends visitors to the project.
const projects = JSON.parse(readFileSync('src/assets/data/projects.json', 'utf8'));
const attr = (text) => text.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');

for (const { slug, title, description } of projects) {
    const url = `${ORIGIN}demo/${slug}/`;
    const target = `/projects?slug=${slug}`;
    const image = `${ORIGIN}og/${existsSync(`dist/og/${slug}.jpg`) ? slug : 'home'}.jpg`;
    const name = attr(`${title} Demo Video`);
    const summary = attr(description.short);

    mkdirSync(`dist/demo/${slug}`, { recursive: true });
    writeFileSync(
        `dist/demo/${slug}/index.html`,
        `<!doctype html>
<html lang="en">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${name} | Michael Green</title>
        <meta name="description" content="${summary}" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="${url}" />
        <meta property="og:site_name" content="Michael Green Portfolio" />
        <meta property="og:title" content="${name}" />
        <meta property="og:description" content="${summary}" />
        <meta property="og:image" content="${image}" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="627" />
        <meta property="og:image:alt" content="${name}" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="${name}" />
        <meta name="twitter:description" content="${summary}" />
        <meta name="twitter:image" content="${image}" />
        <script>
            location.replace('${target}');
        </script>
    </head>
    <body>
        <a href="${attr(target)}">Watch the ${name}</a>
    </body>
</html>
`,
    );
}
