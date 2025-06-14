import { Text, View, Switch, ScrollView, TextInput, StyleSheet } from 'react-native';
import { TextMedium } from '@components/TextSize';
import LanguageDropdown from '@components/LanguageDropdown';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { useSettingsStore } from '@store/settingsStore';
import { useTranslation } from '@hooks/useTranslation';

export default function SettingsScreen() {
  const [isNotificationEnabled, setIsNotificationEnabled] = useState(true);
  const [extraTime, setExtraTime] = useState('5');
  
  // Zustand 설정 스토어
  const { fontSize, setFontSize } = useSettingsStore();
  
  // 다국어 지원
  const { t } = useTranslation();
  
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
        <Text style={styles.headerText}>{t('settings')}</Text>
      </View>

      <ScrollView style={{ padding: 16 }}>
        {/* 큰 텍스트 */}
        <View style={styles.card}>
          <View style={styles.row}>
            <TextMedium style={styles.label}>{t('largeText')}</TextMedium>
            <Switch 
              value={isLargeText} 
              onValueChange={handleToggleLargeText}
            />
          </View>

          <View style={[styles.row, { marginTop: 16 }]}>
            <TextMedium style={styles.label}>{t('language')}</TextMedium>
            <LanguageDropdown />
          </View>
        </View>

        {/* 알림 설정 */}
        {/* <View style={styles.card}>
          <View style={styles.row}>
            <TextMedium style={styles.label}>{t('notifications')}</TextMedium>
            <Switch value={isNotificationEnabled} onValueChange={setIsNotificationEnabled} />
          </View>
        </View> */}

        {/* 여유 시간 설정 */}
        <View style={styles.card}>
          <View style={styles.row}>
            <TextMedium style={styles.label}>{t('extraTime')}</TextMedium>
            <View style={styles.dropdownBox}>
              <TextInput
                value={extraTime}
                onChangeText={setExtraTime}
                keyboardType="numeric"
                style={styles.input}
              />
              <TextMedium> {t('minutes')}</TextMedium>
            </View>
          </View>
        </View>

        {/* 기타 */}
        {/* <View style={styles.card}>
          <TextMedium style={[styles.label, { marginBottom: 16 }]}>{t('helpFaq')}</TextMedium>
          <TextMedium style={styles.label}>{t('about')}</TextMedium>
        </View> */}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomColor: '#C6C8C9',
    borderBottomWidth: 1,
  },
  headerText: {
    fontSize: 30,
    fontFamily: 'Pretendard_Bold',
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
    fontFamily: 'Pretendard_Bold',
  },
});
