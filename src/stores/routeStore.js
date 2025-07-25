import { defineStore } from 'pinia';
import { ref, markRaw } from 'vue';
import HomeView from '../views/HomeView.vue';
import ProjectsView from '../views/ProjectsView.vue';

export const useRouteStore = defineStore('router', () => {
    const routes = {
        home: {
            component: markRaw(HomeView),
            meta: { title: 'Home' },
        },
        projects: {
            component: markRaw(ProjectsView),
            meta: { title: 'Projects' },
        },
    };
    const activeRoute = ref('home');

    const DEFAULT_TITLE = 'M. Green';

    function toRoute(to) {
        activeRoute.value = to;

        let title = DEFAULT_TITLE;
        title += ' | ' + routes[`${to}`].meta.title;
        document.title = title;
    }

    return { routes, activeRoute, toRoute };
});
