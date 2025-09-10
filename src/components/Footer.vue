<template>
    <footer>
        <p>© 2025 M.G.</p>
    </footer>
</template>

<style lang="scss" scoped>
footer {
    position: relative;
    z-index: 3;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 2em;
    width: 100%;
    padding-right: $size-8;
    padding-bottom: 5em !important;

    p {
        font-family: $primary-font-stack !important;
        color: $color-text-muted;
    }

    @include bp-md-tablet {
        padding-bottom: 0 !important;
    }
}
</style>
