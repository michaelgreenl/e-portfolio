<script setup>
import { markRaw } from 'vue';
import { useThemeStore } from '@/stores/themeStore.js';
import { useMediaQuery } from '@vueuse/core';
import VueIcon from '@/components/SVGs/Tools/VueIcon.vue';
import GitIcon from '@/components/SVGs/Tools/GitIcon.vue';
import NuxtIcon from '@/components/SVGs/Tools/NuxtIcon.vue';
import GsapIcon from '@/components/SVGs/Tools/GsapIcon.vue';
import PiniaIcon from '@/components/SVGs/Tools/PiniaIcon.vue';
import SassIcon from '@/components/SVGs/Tools/SassIcon.vue';
import NodeIcon from '@/components/SVGs/Tools/NodeIcon.vue';
import SocketIcon from '@/components/SVGs/Tools/SocketIcon.vue';
import ExpressIcon from '@/components/SVGs/Tools/ExpressIcon.vue';
import PostgresIcon from '@/components/SVGs/Tools/PostgresIcon.vue';
import PrismaIcon from '@/components/SVGs/Tools/PrismaIcon.vue';
import SequelizeIcon from '@/components/SVGs/Tools/SequelizeIcon.vue';
import MySQLIcon from '@/components/SVGs/Tools/MySQLIcon.vue';

defineProps({
    tool: {
        type: String,
    },
});

const themeStore = useThemeStore();

const isMobile = useMediaQuery('(min-width: 682px)');
const tools = {
    vue: { text: 'Vue', icon: markRaw(VueIcon), lightColor: '#41B883', darkColor: '#41B883', maxWidth: '6.5em' },
    git: { text: 'Git', icon: markRaw(GitIcon), lightColor: '#DE4C36', darkColor: '#DE4C36', maxWidth: '6.5em' },
    nuxt: { text: 'Nuxt', icon: markRaw(NuxtIcon), lightColor: '#00AC65', darkColor: '#00DC82', maxWidth: '6.5em' },
    gsap: { text: 'GSAP', icon: markRaw(GsapIcon), lightColor: '#00AC65', darkColor: '#00DC82', maxWidth: '6.5em' },
    pinia: { text: 'Pinia', icon: markRaw(PiniaIcon), lightColor: '#52c861', darkColor: '#FFE56C', maxWidth: '6.5em' },
    sass: { text: 'Sass', icon: markRaw(SassIcon), lightColor: '#CD6799', darkColor: '#CD6799', maxWidth: '6.5em' },
    node: { text: 'Node', icon: markRaw(NodeIcon), lightColor: '#78B537', darkColor: '#8CC84B', maxWidth: '6.5em' },
    socket: {
        text: 'Socket.IO',
        icon: markRaw(SocketIcon),
        lightColor: '#111111',
        darkColor: '#ffffff',
        maxWidth: '7.5em',
    },
    express: {
        text: 'Express',
        icon: markRaw(ExpressIcon),
        lightColor: '#111111',
        darkColor: '#ffffff',
        maxWidth: '7em',
    },
    postgres: {
        text: 'Postgres',
        icon: markRaw(PostgresIcon),
        lightColor: '#336791',
        darkColor: '#4789BE',
        maxWidth: '7.5em',
    },
    prisma: {
        text: 'Prisma',
        icon: markRaw(PrismaIcon),
        lightColor: '#586C8D',
        darkColor: '#7588A9',
        maxWidth: '6.5em',
    },
    sequelize: {
        text: 'Sequelize',
        icon: markRaw(SequelizeIcon),
        lightColor: '#027099',
        darkColor: '#03afef',
        maxWidth: '7.5em',
    },
    mysql: { text: 'MySQL', icon: markRaw(MySQLIcon), lightColor: '#0081A5', darkColor: '#0081A5', maxWidth: '7em' },
};
</script>

<template>
    <div
        class="chip-container"
        :style="{
            backgroundColor:
                themeStore.theme === 'light' ? `${tools[tool].lightColor}30` : `${tools[tool].darkColor}30`,
            maxWidth: isMobile ? tools[tool].maxWidth : '100vw',
        }"
    >
        <div class="icon-container">
            <component :is="tools[tool].icon" class="icon" />
        </div>
        <span :style="{ color: themeStore.theme === 'light' ? tools[tool].lightColor : tools[tool].darkColor }">{{
            tools[tool].text
        }}</span>
    </div>
</template>

<style lang="scss" scoped>
.chip-container {
    @include flexCenterAll;

    gap: $size-2;
    height: 100%;
    padding: 0.85em 1em;
    border-radius: 7px;
}

.icon {
    display: flex;
    align-items: center;
    width: $size-4;
    height: $size-4;

    @include theme-light {
        fill: $color-text-primary;
        stroke: $color-text-primary;
    }
}

span {
    font-family: $secondary-font-stack;
    font-size: 1em;

    @include theme-light {
        color: $color-text-primary;
    }
}
</style>
