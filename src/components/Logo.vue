<template>
    <div>
        <p>
            <span>M</span>
            <span>G</span>
        </p>
    </div>
</template>

<style lang="scss" scoped>
div {
    font-family: $primary-font-stack;
    display: flex;
    padding-left: 1em;

    p {
        position: relative;
        font-size: 1.4em;
        letter-spacing: -0.2ch;

        span:first-child {
            position: relative;
            z-index: 2;
            color: $color-gray3;

            @include theme-light {
                color: $color-primary;
            }
        }

        span:last-child {
            position: relative;
            z-index: 1;
            color: $color-gray5;
        }
    }
}
</style>
