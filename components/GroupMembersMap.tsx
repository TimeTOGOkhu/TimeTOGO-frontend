// components/GroupMembersMap.tsx 수정
import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useGroupStore } from '@/store/groupStore';
import { getPathLocations, LocationData } from '@/services/pathService';
import { TextSmall, TextMedium } from '@/components/TextSize';
import { DynamicIcon } from '@/components/DynamicIcon';

interface GroupMembersMapProps {
  onMemberLocationsUpdate?: (locations: LocationData[]) => void;
}

export default function GroupMembersMap({ onMemberLocationsUpdate }: GroupMembersMapProps) {
  const { pathId, isCreator, memberLocations, updateMemberLocations } = useGroupStore();
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isCreator || !pathId) return;

    const fetchMemberLocations = async () => {
      try {
        setIsLoading(true);
        const locations = await getPathLocations(pathId);
        updateMemberLocations(locations);
        onMemberLocationsUpdate?.(locations);
        setLastUpdate(new Date());
      } catch (error) {
        console.error('멤버 위치 조회 오류:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMemberLocations();

    const interval = setInterval(fetchMemberLocations, 30000);

    return () => clearInterval(interval);
  }, [pathId, isCreator, updateMemberLocations, onMemberLocationsUpdate]);

  if (!isCreator) {
    return null;
  }

  const activeMemberCount = memberLocations.filter(
    location => Date.now() - location.timestamp < 300000
  ).length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleSection}>
          <DynamicIcon name="user" size={16} color="#3457D5" /> {/* 수정: users -> user */}
          <TextMedium style={styles.title}>
            그룹 멤버 추적 ({activeMemberCount}명 활성)
          </TextMedium>
        </View>
        
        {isLoading && (
          <DynamicIcon name="refresh-cw" size={14} color="#6B7280" />
        )}
      </View>
      
      {lastUpdate && (
        <TextSmall style={styles.updateTime}>
          마지막 업데이트: {lastUpdate.toLocaleTimeString()}
        </TextSmall>
      )}
      
      {memberLocations.length > 0 ? (
        <View style={styles.memberList}>
          {memberLocations.map((location, index) => {
            const isRecent = Date.now() - location.timestamp < 300000;
            const updateTime = new Date(location.timestamp);
            
            return (
              <View key={`${location.user_id}-${index}`} style={styles.memberItem}>
                <View style={[
                  styles.memberStatus,
                  { backgroundColor: isRecent ? "#10B981" : "#6B7280" }
                ]} />
                <View style={styles.memberInfo}>
                  <TextSmall style={styles.memberId}>
                    멤버 {location.user_id.slice(-8)}
                  </TextSmall>
                  <TextSmall style={styles.memberLocation}>
                    위도: {location.lat.toFixed(6)}, 경도: {location.lon.toFixed(6)}
                  </TextSmall>
                  <TextSmall style={styles.memberTime}>
                    {updateTime.toLocaleTimeString()}
                  </TextSmall>
                </View>
              </View>
            );
          })}
        </View>
      ) : (
        <TextSmall style={styles.noMembers}>
          아직 위치를 공유하는 멤버가 없습니다.
        </TextSmall>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    marginLeft: 8,
    fontFamily: 'Pretendard_Bold',
    color: '#3457D5',
  },
  updateTime: {
    color: '#6B7280',
    marginBottom: 8,
  },
  memberList: {
    gap: 8,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  memberStatus: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  memberInfo: {
    flex: 1,
  },
  memberId: {
    fontFamily: 'Pretendard_Bold',
    color: '#374151',
    marginBottom: 2,
  },
  memberLocation: {
    color: '#6B7280',
    fontSize: 12,
  },
  memberTime: {
    color: '#9CA3AF',
    fontSize: 11,
    marginTop: 2,
  },
  noMembers: {
    color: '#9CA3AF',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
