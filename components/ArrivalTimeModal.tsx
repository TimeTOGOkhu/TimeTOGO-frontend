// components/ArrivalTimeModal.tsx
import { Platform } from 'react-native';

let ArrivalTimeModalComponent;

if (Platform.OS === 'web') {
  ArrivalTimeModalComponent = require('./ArrivalTimeModal.web').default;
} else {
  ArrivalTimeModalComponent = require('./ArrivalTimeModal.native').default;
}

export default ArrivalTimeModalComponent;
