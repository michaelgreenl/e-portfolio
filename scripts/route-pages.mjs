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

// Each project also gets a /projects/<slug>/ page with its own link preview tags.
const projects = JSON.parse(readFileSync('src/assets/data/projects.json', 'utf8'));
const attr = (text) => text.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
const setMeta = (page, key, value) =>
    page.replace(new RegExp(`((?:name|property)="${key}"\\s+content=")[^"]*`), (_, start) => start + value);

for (const { slug, title, description } of projects) {
    const image = `${ORIGIN}og/${existsSync(`dist/og/${slug}.jpg`) ? slug : 'home'}.jpg`;
    const name = attr(`${title} Demo Video`);
    const summary = attr(description.short);
    const meta = {
        description: summary,
        'og:title': name,
        'og:description': summary,
        'og:image': image,
        'og:image:alt': name,
        'twitter:title': name,
        'twitter:description': summary,
        'twitter:image': image,
    };

    let page = html
        .replaceAll(`"${ORIGIN}"`, `"${ORIGIN}projects/${slug}/"`)
        .replace(/<title>[^<]*<\/title>/, () => `<title>${name} | Michael Green</title>`);
    for (const [key, value] of Object.entries(meta)) {
        page = setMeta(page, key, value);
    }

    mkdirSync(`dist/projects/${slug}`, { recursive: true });
    writeFileSync(`dist/projects/${slug}/index.html`, page);
}
