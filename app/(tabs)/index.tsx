import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, Text, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TabOneScreen() {
  const [locationPermission, setLocationPermission] = useState(false);
  const webViewRef = useRef<WebView>(null);

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

  const injectedJavaScript = `
    closeButton.click();
  `;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {locationPermission ? (
        <WebView
          source={{ uri: 'https://easy-time-travel-korea-62.lovable.app/' }}
          style={styles.webview}
          injectedJavaScript={injectedJavaScript}
          onLoadEnd={() => {
            // 페이지 로드가 완료되면 JavaScript 실행
            if (webViewRef.current) {
              webViewRef.current.injectJavaScript(injectedJavaScript);
            }
          }}
          ref={webViewRef}
        />
      ) : (
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>
            위치 권한이 필요합니다. 앱을 다시 시작하여 권한을 허용해주세요.
          </Text>
        </View>
      )}
    </SafeAreaView>
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
