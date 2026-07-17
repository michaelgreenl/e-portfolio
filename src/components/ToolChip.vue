<script setup>
import { markRaw } from 'vue';
import { useThemeStore } from '@/stores/themeStore.js';
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
import TypeScriptIcon from '@/components/SVGs/Tools/TypeScriptIcon.vue';
import LangGraphIcon from '@/components/SVGs/Tools/LangGraphIcon.vue';
import BunIcon from '@/components/SVGs/Tools/BunIcon.vue';
import SQLiteIcon from '@/components/SVGs/Tools/SQLiteIcon.vue';
import DockerIcon from '@/components/SVGs/Tools/DockerIcon.vue';
import IonicIcon from '@/components/SVGs/Tools/IonicIcon.vue';
import CypressIcon from '@/components/SVGs/Tools/CypressIcon.vue';
import VitestIcon from '@/components/SVGs/Tools/VitestIcon.vue';
import ZodIcon from '@/components/SVGs/Tools/ZodIcon.vue';
import OpenCodeIcon from '@/components/SVGs/Tools/OpenCodeIcon.vue';

defineProps({
    tool: {
        type: String,
    },
});

const themeStore = useThemeStore();

const tools = {
    vue: { text: 'Vue', icon: markRaw(VueIcon), lightColor: '#41B883', darkColor: '#41B883', maxWidth: '7em' },
    opencode: {
        text: 'OpenCode',
        icon: markRaw(OpenCodeIcon),
        lightColor: '#4B4646',
        darkColor: '#F1ECEC',
        maxWidth: '9em',
    },
    langgraph: {
        text: 'LangGraph',
        icon: markRaw(LangGraphIcon),
        lightColor: '#003b57',
        darkColor: '#7FC8FF',
        maxWidth: '9em',
    },
    bun: {
        text: 'Bun',
        icon: markRaw(BunIcon),
        lightColor: '#444444',
        darkColor: '#fbf0df',
        maxWidth: '6em',
    },
    docker: {
        text: 'Docker',
        icon: markRaw(DockerIcon),
        lightColor: '#2496ED',
        darkColor: '#2496ED',
        maxWidth: '8em',
    },
    sqlite: {
        text: 'SQLite',
        icon: markRaw(SQLiteIcon),
        lightColor: '#003b57',
        darkColor: '#97d9f6',
        maxWidth: '7em',
    },
    typescript: {
        text: 'TypeScript',
        icon: markRaw(TypeScriptIcon),
        lightColor: '#017acb',
        darkColor: '#017acb',
        maxWidth: '9.5em',
    },
    ionic: { text: 'Ionic', icon: markRaw(IonicIcon), lightColor: '#3880ff', darkColor: '#3880ff', maxWidth: '7em' },
    cypress: {
        text: 'Cypress',
        icon: markRaw(CypressIcon),
        lightColor: '#3880ff',
        darkColor: '#3880ff',
        maxWidth: '8em',
    },
    vitest: {
        text: 'Vitest',
        icon: markRaw(VitestIcon),
        lightColor: '#69d3a7',
        darkColor: '#69d3a7',
        maxWidth: '7.5em',
    },
    zod: {
        text: 'Zod',
        icon: markRaw(ZodIcon),
        lightColor: '#003b57',
        darkColor: '#45a9ff',
        maxWidth: '6.5em',
    },

    git: { text: 'Git', icon: markRaw(GitIcon), lightColor: '#DE4C36', darkColor: '#DE4C36', maxWidth: '7em' },
    nuxt: { text: 'Nuxt', icon: markRaw(NuxtIcon), lightColor: '#00AC65', darkColor: '#00DC82', maxWidth: '7em' },
    gsap: { text: 'GSAP', icon: markRaw(GsapIcon), lightColor: '#00AC65', darkColor: '#00DC82', maxWidth: '7em' },
    pinia: { text: 'Pinia', icon: markRaw(PiniaIcon), lightColor: '#52c861', darkColor: '#FFE56C', maxWidth: '7.5em' },
    sass: { text: 'Sass', icon: markRaw(SassIcon), lightColor: '#CD6799', darkColor: '#CD6799', maxWidth: '7em' },
    node: { text: 'Node', icon: markRaw(NodeIcon), lightColor: '#78B537', darkColor: '#8CC84B', maxWidth: '7em' },
    socket: {
        text: 'Socket.IO',
        icon: markRaw(SocketIcon),
        lightColor: '#111111',
        darkColor: '#ffffff',
        maxWidth: '8.5em',
    },
    express: {
        text: 'Express',
        icon: markRaw(ExpressIcon),
        lightColor: '#111111',
        darkColor: '#ffffff',
        maxWidth: '8em',
    },
    postgres: {
        text: 'Postgres',
        icon: markRaw(PostgresIcon),
        lightColor: '#336791',
        darkColor: '#4789BE',
        maxWidth: '8.5em',
    },
    prisma: {
        text: 'Prisma',
        icon: markRaw(PrismaIcon),
        lightColor: '#586C8D',
        darkColor: '#7588A9',
        maxWidth: '7.5em',
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
            maxWidth: `${tools[tool].maxWidth}`,
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
    @include flex-center-all;

    gap: $space-2;
    height: 1em;
    padding: $space-3 $space-4;
    border-radius: $radius-sm;
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
