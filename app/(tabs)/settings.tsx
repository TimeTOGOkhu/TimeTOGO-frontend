import { Text, View, Switch, ScrollView, TextInput, StyleSheet } from 'react-native';
import { TextSize, useTextSize } from '../../components/TextSize';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';

export default function SettingsScreen() {
  const { isLargeText, toggleTextSize } = useTextSize();
  const [isNotificationEnabled, setIsNotificationEnabled] = useState(true);
  const [extraTime, setExtraTime] = useState('5');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerText}>설정</Text>
      </View>

      <ScrollView style={{ padding: 16 }}>
        {/* 큰 텍스트 */}
        <View style={styles.card}>
          <View style={styles.row}>
            <TextSize style={styles.label}>더 큰 텍스트</TextSize>
            <Switch value={isLargeText} onValueChange={toggleTextSize} />
          </View>

          <View style={[styles.row, { marginTop: 16 }]}>
            <TextSize style={styles.label}>언어 선택</TextSize>
            <View style={styles.dropdownBox}>
              <TextSize>한글 ▼</TextSize>
            </View>
          </View>
        </View>

        {/* 알림 설정 */}
        <View style={styles.card}>
          <View style={styles.row}>
            <TextSize style={styles.label}>알림 설정</TextSize>
            <Switch value={isNotificationEnabled} onValueChange={setIsNotificationEnabled} />
          </View>
        </View>

        {/* 여유 시간 설정 */}
        <View style={styles.card}>
          <View style={styles.row}>
            <TextSize style={styles.label}>여유 시간 설정</TextSize>
            <View style={styles.dropdownBox}>
              <TextInput
                value={extraTime}
                onChangeText={setExtraTime}
                keyboardType="numeric"
                style={styles.input}
              />
              <TextSize> 분</TextSize>
            </View>
          </View>
        </View>

        {/* 기타 */}
        <View style={styles.card}>
          <TextSize style={[styles.label, { marginBottom: 16 }]}>Help & FAQ</TextSize>
          <TextSize style={styles.label}>About</TextSize>
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
});
