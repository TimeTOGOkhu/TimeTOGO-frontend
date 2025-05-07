import * as Location from 'expo-location';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ExploreScreen() {
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
    <SafeAreaView style={styles.container} edges={['top']}>
      {locationPermission ? (
        <View style={{  }}>
          <View style={{ height:100, width:'100%', justifyContent:'center', borderBottomColor:'#C6C8C9', borderBottomWidth:1 }}>
            <Text style={{ fontSize:50, fontWeight:'bold', color:'#3457D5', textAlign:'center' }}>TimeTOGO</Text>
          </View>
          
        </View>
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
