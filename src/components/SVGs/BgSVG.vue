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
        --bg: #{$color-bg-primary};
        --grid: rgb(255 255 255 / 3.5%);
        --spotA: rgb(255 255 255 / 7%);
        --spotB: rgb(137 207 240 / 6%);
        --spotC: rgb(180 220 210 / 5%);
    }

    @include theme-light {
        --bg: #{$color-bg-primary};
        --grid: rgb(0 0 0 / 4%);
        --spotA: rgb(0 0 0 / 3%);
        --spotB: rgb(173 216 230 / 10%);
        --spotC: rgb(144 238 144 / 5%);
    }

    background:
        linear-gradient(var(--grid) 1px, transparent 1px), linear-gradient(90deg, var(--grid) 1px, transparent 1px),
        radial-gradient(60rem 40rem at 22% 28%, var(--spotA), transparent 60%),
        radial-gradient(50rem 35rem at 78% 14%, var(--spotB), transparent 55%),
        radial-gradient(36rem 28rem at 70% 76%, var(--spotC), transparent 60%), var(--bg);
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
