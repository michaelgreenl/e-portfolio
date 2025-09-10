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
        --grid: rgba(255, 255, 255, 0.035);
        --spotA: rgba(255, 255, 255, 0.07);
        --spotB: rgba(137, 207, 240, 0.06);
        --spotC: rgba(180, 220, 210, 0.05);
    }

    @include theme-light {
        --bg: #{$color-bg-primary};
        --grid: rgba(0, 0, 0, 0.04);
        --spotA: rgba(0, 0, 0, 0.03);
        --spotB: rgba(173, 216, 230, 0.1);
        --spotC: rgba(144, 238, 144, 0.05);
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
