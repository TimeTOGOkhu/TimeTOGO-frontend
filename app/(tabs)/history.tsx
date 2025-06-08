// app/(tabs)/history.tsx
import React from 'react';
import { router } from 'expo-router';
import {
  SafeAreaView,
  View,
  FlatList, // ScrollView 대신 FlatList import
  StyleSheet,
  Pressable,
  Text,
} from 'react-native';
import {
  TextSmall,
  TextMedium,
} from '@components/TextSize';
import { DynamicIcon } from '@components/DynamicIcon';
import { useHistoryStore } from '@/store/historyStore';
import { useFontSize } from '@hooks/useFontSize';
import { useTranslation } from '@hooks/useTranslation';

export default function HistoryScreen() {
  const historys = useHistoryStore((s) => s.historys);
  const removeHistory = useHistoryStore((s) => s.removeHistory);
  const { getSize } = useFontSize();

  const { t } = useTranslation();

  const applyHistory = (item: typeof historys[0]) => {
    // TODO: setOrigin, setDestination을 사용하여 출발지/도착지 설정 로직 구현 필요
    // 예시: 
    // if (item.originCoords && item.destinationCoords) {
    //   setOrigin({ name: item.origin, coordinates: item.originCoords });
    //   setDestination({ name: item.destination, coordinates: item.destinationCoords });
    // }
    router.push('/explore');
  };

  // FlatList renderItem 함수
  const renderHistoryItem = ({ item, index }: { item: typeof historys[0], index: number }) => (
    <View style={styles.card}>
      {/* 카드 헤더: 제목 + 아이콘 */}
      <View style={styles.cardHeader}>
        <TextMedium style={{ fontSize: getSize('large') }}>
          {t('historyRouteTitle') + ` ${index + 1}`}
        </TextMedium>
        <View style={styles.headerIcons}>
          <Pressable onPress={() => applyHistory(item)}>
            <DynamicIcon
              name="share"
              size={getSize('normal')}
              style={styles.icon}
            />
          </Pressable>
          <Pressable onPress={() => removeHistory(index)}>
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
        {t('historyTravelTime')}: {Math.round(item.travelTime / 60)} {t('minutes')}
      </TextSmall>
      <TextSmall style={[styles.applyText, { fontSize: getSize('small') }]}>
        {t('historyApplyText')}
      </TextSmall>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('history')}</Text>
      </View>
      <FlatList // ScrollView 대신 FlatList 사용
        data={historys}
        renderItem={renderHistoryItem}
        keyExtractor={(item, index) => `${item.origin}-${item.destination}-${index}`} // 고유 key 보강
        contentContainerStyle={styles.list}
        ListEmptyComponent={ // 히스토리가 없을 때 표시할 컴포넌트
          <View style={styles.emptyContainer}>
            <TextMedium style={styles.emptyText}>{t('noHistory')}</TextMedium>
          </View>
        }
      />
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
    flexGrow: 1, // FlatList 내용이 적을 때도 중앙 정렬 등을 위해 추가
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
  emptyContainer: { // 히스토리가 없을 때 스타일
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#888',
  },
});