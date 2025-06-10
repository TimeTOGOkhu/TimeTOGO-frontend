// app/(tabs)/explore.tsx
import { Platform } from 'react-native';

// 플랫폼별 컴포넌트 import
let ExploreComponent;

if (Platform.OS === 'web') {
  ExploreComponent = require('./explore.web').default;
} else {
  ExploreComponent = require('./explore.native').default;
}

export default ExploreComponent;
