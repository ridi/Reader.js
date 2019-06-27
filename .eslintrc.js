module.exports = {
  'extends': '@ridi',
  'rules': {
    'class-methods-use-this': 0,
    'function-paren-newline': 0,
    'import/extensions': 0,
    'import/no-unresolved': 0,
    'max-len': ['warn', 120],
    'newline-per-chained-call': ['error', { 'ignoreChainWithDepth': 5 }],
    'no-cond-assign': 0,
    'no-continue': 0,
    'no-bitwise': 0,
    'no-restricted-globals': 0,
    'no-param-reassign': 0,
    'no-underscore-dangle': 0,
    'object-curly-newline': ['error', { 'multiline': true }],
  },
  'env': {
    'browser': true
  },
  'globals': {
    'rangy': true,
    'android': true,
    'DOMRectList': true,
    'DEBUG': true
  }
};
