const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname, {
  isCSSEnabled: true,
});

// 웹 플랫폼에서 react-native-maps를 빈 모듈로 대체
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && moduleName === 'react-native-maps') {
    return {
      type: 'empty',
    };
  }
  
  // 기본 해석기로 폴백
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;