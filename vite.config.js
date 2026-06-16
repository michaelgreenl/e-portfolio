import { fileURLToPath, URL } from 'node:url';

import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig(async ({ command }) => {
    const plugins = [vue()];

    if (command === 'serve') {
        const { default: vueDevTools } = await import('vite-plugin-vue-devtools');
        plugins.push(vueDevTools());
    }

    return {
        plugins,
        css: {
            preprocessorOptions: {
                scss: {
                    additionalData: `
                        @use "@/assets/styles/_variables.scss" as *;
                        @use "@/assets/styles/_utils.scss" as *;
                    `,
                },
            },
        },
        resolve: {
            alias: {
                '@': fileURLToPath(new URL('./src', import.meta.url)),
            },
        },
    };
});
