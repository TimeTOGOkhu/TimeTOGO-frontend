import { Text, View, Switch, ScrollView, TextInput, StyleSheet, Pressable } from 'react-native';
import { TextMedium } from '@components/TextSize';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { useSettingsStore } from '@store/settingsStore';
import { useFontSize } from '@hooks/useFontSize';

export default function SettingsScreen() {
  const [isNotificationEnabled, setIsNotificationEnabled] = useState(true);
  const [extraTime, setExtraTime] = useState('5');
  
  // Zustand 설정 스토어
  const fontSize = useSettingsStore(state => state.fontSize);
  const setFontSize = useSettingsStore(state => state.setFontSize);
  
  // 폰트 크기 유틸리티 
  const { getSize } = useFontSize();
  
  // 더 큰 텍스트 토글 상태
  const [isLargeText, setIsLargeText] = useState(fontSize === 'large');
  
  // 토글이 변경될 때 폰트 크기 업데이트
  const handleToggleLargeText = (value: boolean) => {
    setIsLargeText(value);
    setFontSize(value ? 'large' : 'medium');
  };
  
  // fontSize 상태가 외부에서 변경될 때 isLargeText 업데이트
  useEffect(() => {
    setIsLargeText(fontSize === 'large');
  }, [fontSize]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerText}>설정</Text>
      </View>

      <ScrollView style={{ padding: 16 }}>
        {/* 큰 텍스트 */}
        <View style={styles.card}>
          <View style={styles.row}>
            <TextMedium style={styles.label}>더 큰 텍스트</TextMedium>
            <Switch 
              value={isLargeText} 
              onValueChange={handleToggleLargeText}
            />
          </View>

          {/* 
          <View style={[styles.row, { marginTop: 16 }]}>
            <TextMedium style={styles.label}>글꼴 크기</TextMedium>
            <View style={styles.fontSizeSelector}>
              <Pressable 
                style={[
                  styles.fontSizeButton, 
                  fontSize === 'small' && styles.selectedFontSize
                ]}
                onPress={() => setFontSize('small')}
              >
                <Text style={[styles.fontSizeText, fontSize === 'small' && styles.selectedFontSizeText]}>
                  작게
                </Text>
              </Pressable>
              <Pressable 
                style={[
                  styles.fontSizeButton, 
                  fontSize === 'medium' && styles.selectedFontSize
                ]}
                onPress={() => {
                  setFontSize('medium');
                  setIsLargeText(false);
                }}
              >
                <Text style={[styles.fontSizeText, fontSize === 'medium' && styles.selectedFontSizeText]}>
                  보통
                </Text>
              </Pressable>
              <Pressable 
                style={[
                  styles.fontSizeButton, 
                  fontSize === 'large' && styles.selectedFontSize
                ]}
                onPress={() => {
                  setFontSize('large');
                  setIsLargeText(true);
                }}
              >
                <Text style={[styles.fontSizeText, fontSize === 'large' && styles.selectedFontSizeText]}>
                  크게
                </Text>
              </Pressable>
            </View>
          </View> */}

          <View style={[styles.row, { marginTop: 16 }]}>
            <TextMedium style={styles.label}>언어 선택</TextMedium>
            <View style={styles.dropdownBox}>
              <TextMedium>한글 ▼</TextMedium>
            </View>
          </View>
        </View>

        {/* 알림 설정 */}
        <View style={styles.card}>
          <View style={styles.row}>
            <TextMedium style={styles.label}>알림 설정</TextMedium>
            <Switch value={isNotificationEnabled} onValueChange={setIsNotificationEnabled} />
          </View>
        </View>

        {/* 여유 시간 설정 */}
        <View style={styles.card}>
          <View style={styles.row}>
            <TextMedium style={styles.label}>여유 시간 설정</TextMedium>
            <View style={styles.dropdownBox}>
              <TextInput
                value={extraTime}
                onChangeText={setExtraTime}
                keyboardType="numeric"
                style={styles.input}
              />
              <TextMedium> 분</TextMedium>
            </View>
          </View>
        </View>

        {/* 기타 */}
        <View style={styles.card}>
          <TextMedium style={[styles.label, { marginBottom: 16 }]}>Help & FAQ</TextMedium>
          <TextMedium style={styles.label}>About</TextMedium>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 72,
    justifyContent: 'center',
    borderBottomColor: '#C6C8C9',
    borderBottomWidth: 1,
  },
  headerText: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#3457D5',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    borderColor: '#E5E5E5',
    borderWidth: 1,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    //fontSize: 16,
  },
  dropdownBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#D0D0D0',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  input: {
    width: 30,
    textAlign: 'center',
  },
  fontSizeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 160,
  },
  fontSizeButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#D0D0D0',
  },
  selectedFontSize: {
    backgroundColor: '#3457D5',
    borderColor: '#3457D5',
  },
  fontSizeText: {
    color: '#666',
    fontSize: 12,
  },
  selectedFontSizeText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
