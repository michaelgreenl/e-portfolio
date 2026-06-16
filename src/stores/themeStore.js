import { defineStore } from 'pinia';
import { shallowRef } from 'vue';

const THEME_STORAGE_KEY = 'THEME';

function getInitialTheme() {
    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    if (storedTheme === 'dark' || storedTheme === 'light') return storedTheme;

    const documentTheme = document.documentElement.getAttribute('data-theme');
    return documentTheme === 'light' ? 'light' : 'dark';
}

export const useThemeStore = defineStore('theme', () => {
    const theme = shallowRef(getInitialTheme());

    document.documentElement.setAttribute('data-theme', theme.value);

    const toggleTheme = () => {
        theme.value = theme.value === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', theme.value);
        localStorage.setItem(THEME_STORAGE_KEY, theme.value);
    };

    return {
        theme,
        toggleTheme,
    };
});
