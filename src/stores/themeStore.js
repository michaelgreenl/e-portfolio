import { defineStore } from 'pinia';
import { shallowRef } from 'vue';

function getInitialTheme() {
    const storedTheme = localStorage.getItem('THEME');
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
        localStorage.setItem('THEME', theme.value);
    };

    return {
        theme,
        toggleTheme,
    };
});
