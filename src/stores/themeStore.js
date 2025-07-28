import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useThemeStore = defineStore('theme', () => {
    const theme = ref('dark');

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
