<template>
    <!-- Each mark matches the "l" in Quicksand Bold: 0.12em wide, 0.74em tall, round ends. -->
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="-180 0 1200 740">
        <path d="M60 60V680M300 60V680M540 60V680M780 60V680M-120 600L960 140"></path>
    </svg>
</template>

<style lang="scss" scoped>
path {
    fill: none;
    stroke-width: 120;
    stroke-linecap: round;

    @include theme-dark {
        stroke: $color-gray3;
    }

    @include theme-light {
        stroke: $color-primary-darker;
    }
}
</style>
