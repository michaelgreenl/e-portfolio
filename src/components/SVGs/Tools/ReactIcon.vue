<template>
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="-11.5 -10.23174 23 20.46348">
        <circle cx="0" cy="0" r="2.05" />
        <g stroke-width="1" fill="none">
            <ellipse rx="11" ry="4.2" />
            <ellipse rx="11" ry="4.2" transform="rotate(60)" />
            <ellipse rx="11" ry="4.2" transform="rotate(120)" />
        </g>
    </svg>
</template>

<style lang="scss" scoped>
svg {
    @include theme-dark {
        stroke: #61dafb;
        fill: #61dafb;
    }

    @include theme-light {
        stroke: #53b9d5;
        fill: #53b9d5;
    }
}
</style>
