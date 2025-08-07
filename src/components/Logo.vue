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
    display: flex;
    padding-left: 1em;
    font-family: $primary-font-stack;

    p {
        position: relative;
        font-size: 2em;
        font-weight: 600;
        letter-spacing: -0.1ch;

        span:first-child {
            position: relative;
            z-index: 2;
            color: $color-gray3;

            @include theme-light {
                color: $color-primary-darker;
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
