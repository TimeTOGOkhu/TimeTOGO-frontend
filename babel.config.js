// babel.config.js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@components': './components',
            '@store': './store',
            '@services': './services',
            '@hooks': './hooks',
          },
        },
      ],
      // Reanimated 플러그인 추가 (필수)
      'react-native-reanimated/plugin',
    ],
  };
};
