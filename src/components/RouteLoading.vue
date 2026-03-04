<template>
    <section class="route-loading" role="status" aria-live="polite" aria-busy="true">
        <div class="spinner" />
    </section>
</template>

<style scoped lang="scss">
.route-loading {
    min-height: clamp(280px, 76vh, 560px);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: $size-4;
    position: relative;
    z-index: 3;
}

.spinner {
    width: 2.5em;
    height: 2.5em;
    border-radius: 50%;
    border: 1px solid transparent;

    @include theme-dark {
        border-color: rgb(255 255 255 / 22%);
        border-top-color: $color-primary-light;
    }

    @include theme-light {
        border-color: rgb(0 0 0 / 14%);
        border-top-color: $color-primary-darker;
    }

    animation: spin 1s ease infinite;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

@media (prefers-reduced-motion: reduce) {
    .spinner {
        animation: none;
    }
}
</style>
