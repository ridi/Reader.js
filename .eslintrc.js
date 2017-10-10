module.exports = {
  'extends': '@ridi',
  'rules': {
    'function-paren-newline': 0,
    'import/extensions': 0,
    'import/no-unresolved': 0,
    'no-continue': 0,
    'no-bitwise': 0,
    'object-curly-newline': ['error', { 'multiline': true }]
  },
  'env': {
    'browser': true
  },
  'globals': {
    'rangy': true,
    'android': true
  }
};
