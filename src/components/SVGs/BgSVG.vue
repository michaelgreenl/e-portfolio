<template>
    <div class="bg-layer" aria-hidden="true"></div>
</template>

<style scoped lang="scss">
.bg-layer {
    position: fixed;
    inset: 0;
    z-index: 1;
    pointer-events: none;

    @include theme-dark {
        // $color-bg-primary
        --bg: #212529;
        --grid: rgb(255 255 255 / 3.5%);
        --spot-a: rgb(107 143 158 / 20%);
        --spot-b: rgb(111 185 201 / 14%);
        --spot-c: rgb(132 105 180 / 12%);
    }

    @include theme-light {
        // $color-bg-primary
        --bg: #dee2e6;
        --grid: rgb(0 0 0 / 4%);
        --spot-a: rgb(107 143 158 / 22%);
        --spot-b: rgb(120 190 210 / 20%);
        --spot-c: rgb(150 125 205 / 10%);
    }

    background:
        linear-gradient(var(--grid) 1px, transparent 1px), linear-gradient(90deg, var(--grid) 1px, transparent 1px),
        radial-gradient(60rem 40rem at 22% 28%, var(--spot-a), transparent 60%),
        radial-gradient(50rem 35rem at 78% 14%, var(--spot-b), transparent 55%),
        radial-gradient(36rem 28rem at 70% 76%, var(--spot-c), transparent 60%), var(--bg);
    background-size:
        32px 32px,
        32px 32px,
        auto,
        auto,
        auto,
        auto;

    @media (prefers-reduced-motion: no-preference) {
        animation: hue 18s ease-in-out infinite alternate;
    }
}

@keyframes hue {
    from {
        filter: hue-rotate(0deg) saturate(108%);
    }

    to {
        filter: hue-rotate(12deg) saturate(114%);
    }
}
</style>
