<template>
    <div>
        <h1>
            <span>M</span>
            <span>G</span>
        </h1>
    </div>
</template>

<style lang="scss" scoped>
div {
    display: flex;
    padding-left: $space-2;
    font-family: $primary-font-stack;

    @include bp-sm-phone {
        padding-left: $space-4;
    }
}

h1 {
    position: relative;
    font-size: $size-8;
    font-weight: 600;
    letter-spacing: -0.1ch;
}

span {
    position: relative;

    &:first-child {
        z-index: 2;

        @include theme-dark {
            color: $color-gray3;
        }

        @include theme-light {
            color: $color-primary-darker;
        }
    }

    &:last-child {
        z-index: 1;

        @include theme-dark {
            color: $color-primary-light;
        }

        @include theme-light {
            color: $color-primary;
        }
    }
}
</style>
