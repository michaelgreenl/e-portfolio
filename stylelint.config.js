module.exports = {
    extends: [
        'stylelint-config-standard-scss',
        'stylelint-config-standard-vue/scss',
        'stylelint-config-prettier-scss',
        'stylelint-config-recess-order',
    ],
    rules: {
        'multi-word-component-names': null,
        'selector-max-type': null,
        'no-empty-source': null,
    },
};
