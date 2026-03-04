import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useThemeStore = defineStore('theme', () => {
    const theme = ref(document.documentElement.getAttribute('data-theme') || 'dark');

    let clearThemeAnimTimer;

    const applyTheme = (nextTheme, { animate = false } = {}) => {
        const root = document.documentElement;
        theme.value = nextTheme;
        root.setAttribute('data-theme', nextTheme);
        localStorage.setItem('THEME', nextTheme);

        if (animate) {
            root.classList.add('theme-animating');
            window.clearTimeout(clearThemeAnimTimer);
            clearThemeAnimTimer = window.setTimeout(() => {
                root.classList.remove('theme-animating');
            }, 280);
        }
    };

    function init() {
        const current = document.documentElement.getAttribute('data-theme');
        applyTheme(current === 'light' ? 'light' : 'dark');
    }

    function toggleTheme() {
        applyTheme(theme.value === 'dark' ? 'light' : 'dark', { animate: true });
    }

    return { theme, init, toggleTheme, applyTheme };
});
