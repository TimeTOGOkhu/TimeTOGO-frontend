// app/result.tsx
import { Platform } from 'react-native';

// 플랫폼별 컴포넌트 import
let ResultComponent;

if (Platform.OS === 'web') {
  ResultComponent = require('./result.web').default;
} else {
  ResultComponent = require('./result.native').default;
}

export default ResultComponent;
