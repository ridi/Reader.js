module.exports = {
  'extends': '@ridi',
  'rules': {
    'import/extensions': 0,
    'import/no-unresolved': 0,
    'no-continue': 0
  },
  'env': {
    'browser': true
  },
  'globals': {
    // Common
    'rangy': true,
    'app': true,
    'tts': true,
    // Android
    'CURSE': true,
    'android': true
  },
};
