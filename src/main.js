import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import { router } from '@/router/index.js';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);

// Text in a face that has not loaded stays invisible (font-display: block in fonts.css), and a browser loads a face
// only when text first uses it, even after preloading its file. So the app mounts once every face has loaded, and
// no page, like the resume with its Spartan headings, shows text before its font. Browsers show fallback text after
// 3 seconds anyway, so the app does not wait longer.
const FONT_WAIT_MS = 3000;
const fontsLoaded = Promise.allSettled([...document.fonts].map((face) => face.load()));
const fontWait = new Promise((resolve) => setTimeout(resolve, FONT_WAIT_MS));

Promise.all([router.isReady(), Promise.race([fontsLoaded, fontWait])]).then(() => {
    app.mount('#app');
});
