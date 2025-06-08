// app/(tabs)/history.tsx
import React from 'react';
import { router } from 'expo-router';
import {
  SafeAreaView,
  View,
  ScrollView,
  StyleSheet,
  Pressable,
  Text,
} from 'react-native';
import {
  TextSmall,
  TextMedium,
  TextXLarge,
} from '@components/TextSize';
import { DynamicIcon } from '@components/DynamicIcon';
import { useHistoryStore } from '@/store/historyStore';
import { useCalculationStore } from '@store/calculationStore';
import { useFontSize } from '@hooks/useFontSize';
import { useTranslation } from '@hooks/useTranslation';

export default function HistoryScreen() {
  const historys = useHistoryStore((s) => s.historys);
  const removeHistory = useHistoryStore((s) => s.removeHistory);
  const setOrigin = useCalculationStore((s) => s.setOrigin);
  const setDestination = useCalculationStore((s) => s.setDestination);
  const { getSize } = useFontSize();

  const { t } = useTranslation();

  const applyHistory = (item: typeof historys[0]) => {
    // 문자열로 저장했던 좌표를 파싱하거나, 필요에 따라
    // StoreLocation 형태로 다시 셋업해 주세요.
    // 예시: setOrigin({ name: item.origin, coordinates: { ... } });
    // setDestination(...)
    router.push('/explore');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('history')}</Text>
      </View>
      <ScrollView contentContainerStyle={styles.list}>
        {historys.map((item, idx) => (
          <View key={`${item.origin}-${item.destination}`} style={styles.card}>
            {/* 카드 헤더: 제목 + 아이콘 */}
            <View style={styles.cardHeader}>
              <TextMedium style={{ fontSize: getSize('large') }}>
                경로 {idx + 1}
              </TextMedium>
              <View style={styles.headerIcons}>
                <Pressable onPress={() => applyHistory(item)}>
                  <DynamicIcon
                    name="share"
                    size={getSize('normal')}
                    style={styles.icon}
                  />
                </Pressable>
                <Pressable onPress={() => removeHistory(idx)}>
                  <DynamicIcon
                    name="x"
                    size={getSize('normal')}
                    style={styles.icon}
                  />
                </Pressable>
              </View>
            </View>

            {/* 경로 정보 */}
            <TextMedium style={[styles.routeText, { fontSize: getSize('medium') }]}>
              {item.origin} → {item.destination}
            </TextMedium>
            <TextSmall style={[styles.infoText, { fontSize: getSize('small') }]}>
              평균 {Math.round(item.travelTime / 60)}분 소요
            </TextSmall>
            <TextSmall style={[styles.applyText, { fontSize: getSize('small') }]}>
              클릭하여 적용
            </TextSmall>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  header: {
    height: 72,
    justifyContent: 'center',
    borderBottomColor: '#C6C8C9',
    borderBottomWidth: 1,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 30,
    fontFamily: 'Pretendard-Bold',
    color: '#3457D5',
    textAlign: 'center',
  },
  list: {
    padding: 16,
  },
  card: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerIcons: { flexDirection: 'row' },
  icon: { marginLeft: 12 },
  routeText: { marginBottom: 4, color: '#333' },
  infoText: { color: '#666', marginBottom: 4 },
  applyText: { color: '#999' },
});