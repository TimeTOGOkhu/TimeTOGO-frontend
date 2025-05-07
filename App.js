import * as Location from 'expo-location';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';

export default function App() {
  const [locationPermission, setLocationPermission] = useState(false);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          '위치 권한 필요',
          '이 앱은 위치 정보가 필요합니다. 설정에서 위치 권한을 허용해주세요.',
          [{ text: '확인' }]
        );
        setLocationPermission(false);
        return;
      }
      setLocationPermission(true);
    })();
  }, []);

  return (
    <View style={styles.container}>
      {locationPermission ? (
        <WebView
          source={{ uri: 'https://easy-time-travel-korea-62.lovable.app/' }}
          style={styles.webview}
        />
      ) : (
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>
            위치 권한이 필요합니다. 앱을 다시 시작하여 권한을 허용해주세요.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  webview: {
    flex: 1,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permissionText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
  },
}); 