<script setup>
import { useRouteStore } from '@/stores/routeStore.js';

const routeStore = useRouteStore();
</script>

<template>
    <nav v-if="routeStore.currentRoute.base !== 'home'" class="nav-desktop">
        <button
            v-for="(route, key) in routeStore.routes"
            :key="key"
            class="nav-item"
            :class="{ active: routeStore.currentRoute.base === key }"
            :disabled="routeStore.currentRoute.base === key"
            @click="routeStore.toRoute(key)"
        >
            <component :is="route.meta.iconFill" v-if="routeStore.currentRoute.base === key" class="icon" />
            <component :is="route.meta.icon" v-else class="icon" />
            {{ route.name }}
        </button>
    </nav>
</template>

<style lang="scss" scoped>
.nav-desktop {
    display: none;
    gap: $space-3;

    @include bp-md-tablet {
        display: flex;
    }
}

.nav-item {
    position: relative;
    display: flex;
    gap: $space-3;
    align-items: center;
    padding: $space-3 $space-5;
    font-family: $primary-font-stack;
    font-size: 0.85em;
    background-color: transparent;
    border: 0;
    border-radius: $size-3;
    opacity: 0;
    transform: translateX(-50px) scaleX(0.5);

    @include theme-dark {
        font-weight: 400;
        color: $color-text-primary;
    }

    @include theme-light {
        font-weight: 500;
        color: $color-primary-darker;
    }

    &::after {
        position: absolute;
        bottom: 0;
        left: $size-2;
        width: 0;
        height: 1px;
        content: '';
        border-radius: $size-4;
        transition: width 0.15s ease-in-out;

        @include theme-dark {
            background-color: $color-text-secondary;
        }

        @include theme-light {
            background-color: $color-primary-darker;
        }
    }

    &:hover {
        @include theme-dark {
            background-color: #343a4060;
        }

        @include theme-light {
            background-color: #ced4da60;
        }
    }

    &:active {
        background-color: transparent !important;
    }

    &.active {
        &::after {
            width: 88%;
        }

        &:hover {
            background-color: transparent;
        }
    }

    .icon {
        height: $size-6;

        @include theme-dark {
            fill: $color-text-secondary;
            stroke: $color-text-secondary;
        }

        @include theme-light {
            fill: $color-primary-darker;
            stroke: $color-primary-darker;
        }
    }
}
</style>
