module.exports = {
  extends: [
    'stylelint-config-standard-scss',
    'stylelint-config-standard-vue/scss',
    'stylelint-config-prettier-scss',
    'stylelint-config-recess-order',
  ],
  rules: {
    'selector-max-type': [0, { ignore: ['child', 'descendant', 'compounded'] }],
  },
};
