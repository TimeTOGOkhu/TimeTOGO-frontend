// components/LocationSelectModal.tsx
import { Platform } from 'react-native';

let LocationSelectModalComponent;

if (Platform.OS === 'web') {
  LocationSelectModalComponent = require('./LocationSelectModal.web').default;
} else {
  LocationSelectModalComponent = require('./LocationSelectModal.native').default;
}

export default LocationSelectModalComponent;
