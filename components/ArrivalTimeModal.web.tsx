// components/ArrivalTimeModal.tsx

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text, // renderItem 안에서 쓰기 위해 import
} from 'react-native';
import Modal from 'react-native-modal';
import { Calendar } from 'react-native-calendars';
import WheelPicker from '@quidone/react-native-wheel-picker';
import { useFontSize } from '@hooks/useFontSize';
import {
TextSmall,
TextMedium,
TextXLarge,
TextXXXLarge,
TextNormal,
TextLarge,
} from "@components/TextSize";
import PressableOpacity from "@/components/PressableOpacity";

type Props = {
  visible: boolean;
  initial?: Date;
  onConfirm: (dt: Date) => void;
  onCancel: () => void;
};

type PickerItem<T> = { label: string; value: T };

export default function ArrivalTimeModal({
  visible,
  initial,
  onConfirm,
  onCancel,
}: Props) {
  const now = new Date();
  const defaultDate = initial ?? now;

  // useFontSize 훅으로 현재 설정된 폰트 크기를 가져옴
  const { getSize } = useFontSize();

  const [selectedDate, setSelectedDate] = useState<Date>(defaultDate);
  const [period, setPeriod] = useState<'AM' | 'PM'>(
    defaultDate.getHours() < 12 ? 'AM' : 'PM'
  );
  const [hour, setHour] = useState<number>(defaultDate.getHours() % 12 || 12);
  const [minute, setMinute] = useState<number>(defaultDate.getMinutes());
  const [activeTab, setActiveTab] = useState<'date' | 'time' | null>(null);

  useEffect(() => {
    if (!visible) {
      // 모달이 닫히면 상태 초기화
      setActiveTab(null);
      setSelectedDate(defaultDate);
      setPeriod(defaultDate.getHours() < 12 ? 'AM' : 'PM');
      setHour(defaultDate.getHours() % 12 || 12);
      setMinute(defaultDate.getMinutes());
    }
  }, [visible, defaultDate]);

  const handleConfirmAll = () => {
    const d = new Date(selectedDate);
    let h24 = hour % 12 + (period === 'PM' ? 12 : 0);
    if (h24 === 24) h24 = 12; // 12 AM/PM 예외 처리
    d.setHours(h24, minute, 0, 0);
    onConfirm(d);
    onCancel();
  };

  const handleDayPress = (day: { timestamp: number }) => {
    setSelectedDate(new Date(day.timestamp));
  };

  // Picker 데이터 정의
  const periodItems: PickerItem<'AM' | 'PM'>[] = [
    { label: '오전', value: 'AM' },
    { label: '오후', value: 'PM' },
  ];
  const hourItems: PickerItem<number>[] = Array.from({ length: 12 }, (_, i) => ({
    label: String(i + 1),
    value: i + 1,
  }));
  const minuteItems: PickerItem<number>[] = Array.from({ length: 60 }, (_, i) => ({
    label: String(i).padStart(2, '0'),
    value: i,
  }));

  const dateText = `${selectedDate.getFullYear()}년 ${selectedDate.getMonth() + 1}월 ${selectedDate.getDate()}일`;
  const timeText = `${period === 'AM' ? '오전' : '오후'} ${hour}:${String(minute).padStart(2, '0')}`;

  return (
    <Modal
      isVisible={visible}
      onBackdropPress={onCancel}
      backdropOpacity={0.3}
      style={styles.modal}
    >
      <View style={styles.container}>
        {/* 헤더: TextSize로 동적 폰트 크기 적용 */}
        <TextXLarge style={styles.header}>
          도착 시간 설정
        </TextXLarge>

        <View style={styles.fieldRow}>
          {/* 날짜 필드 */}
          <PressableOpacity style={styles.field} onPress={() => setActiveTab('date')}>
            <TextSmall style={styles.fieldLabel}>
              날짜
            </TextSmall>
            <TextNormal style={styles.fieldValue}>
              {dateText}
            </TextNormal>
          </PressableOpacity>

          {/* 시간 필드 */}
          <PressableOpacity style={styles.field} onPress={() => setActiveTab('time')}>
            <TextSmall style={styles.fieldLabel}>
              시간
            </TextSmall>
            <TextNormal style={styles.fieldValue}>
              {timeText}
            </TextNormal>
          </PressableOpacity>
        </View>

        {/* 날짜 선택 캘린더 */}
        {activeTab === 'date' && (
          <Calendar
            minDate={now.toISOString().split('T')[0]}
            onDayPress={handleDayPress}
            markedDates={{
              [selectedDate.toISOString().split('T')[0]]: {
                selected: true,
                selectedColor: '#4169E1',
              },
            }}
            theme={{
              todayTextColor: '#4169E1',
              arrowColor: '#4169E1',
              // 달력 내부 글꼴 크기도 동적으로 조절
              textDayFontSize: getSize('normal'),
              textMonthFontSize: getSize('large'),
              textDayHeaderFontSize: getSize('small'),
            }}
            style={styles.calendar}
          />
        )}

        {/* 시간 선택 다이얼 */}
        {activeTab === 'time' && (
          <View style={styles.wheelSection}>
            {/* 오전/오후 Picker */}
            <WheelPicker
              data={periodItems}
              value={period}
              itemHeight={50}
              visibleItemCount={3}
              width={80}
              onValueChanging={({ item }: { item: PickerItem<'AM' | 'PM'> }) =>
                setPeriod(item.value)
              }
              onValueChanged={({ item }: { item: PickerItem<'AM' | 'PM'> }) =>
                setPeriod(item.value)
              }
              // renderItem을 통해 선택된 아이템만 크게, 나머지는 기본 크기로 렌더링
              renderItem={({ item }: { item: PickerItem<'AM' | 'PM'> }) => (
                <Text
                  style={{
                    fontSize:
                      item.value === period
                        ? getSize('large')
                        : getSize('normal'),
                    textAlign: 'center',
                  }}
                >
                  {item.label}
                </Text>
              )}
            />

            <View style={{ width: 16 }} />

            {/* 시(hour) Picker */}
            <WheelPicker
              data={hourItems}
              value={hour}
              itemHeight={50}
              visibleItemCount={3}
              width={80}
              onValueChanging={({ item }: { item: PickerItem<number> }) =>
                setHour(item.value)
              }
              onValueChanged={({ item }: { item: PickerItem<number> }) =>
                setHour(item.value)
              }
              renderItem={({ item }: { item: PickerItem<number> }) => (
                <Text
                  style={{
                    fontSize:
                      item.value === hour ? getSize('large') : getSize('normal'),
                    textAlign: 'center',
                  }}
                >
                  {item.label}
                </Text>
              )}
            />

            {/* 콜론(:) */}
            <TextLarge style={styles.colon}>
              :
            </TextLarge>

            {/* 분(minute) Picker */}
            <WheelPicker
              data={minuteItems}
              value={minute}
              itemHeight={50}
              visibleItemCount={3}
              width={80}
              onValueChanging={({ item }: { item: PickerItem<number> }) =>
                setMinute(item.value)
              }
              onValueChanged={({ item }: { item: PickerItem<number> }) =>
                setMinute(item.value)
              }
              renderItem={({ item }: { item: PickerItem<number> }) => (
                <Text
                  style={{
                    fontSize:
                      item.value === minute
                        ? getSize('large')
                        : getSize('normal'),
                    textAlign: 'center',
                  }}
                >
                  {item.label}
                </Text>
              )}
            />
          </View>
        )}

        {/* 확인 버튼 */}
        <PressableOpacity style={styles.confirmBtn} onPress={handleConfirmAll}>
          <TextMedium style={styles.confirmText}>
            확인
          </TextMedium>
        </PressableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modal: {
    justifyContent: 'center',
    margin: 0,
  },
  container: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  header: {
    fontWeight: '600',
    padding: 16,
  },
  fieldRow: {
    flexDirection: 'column',
    paddingHorizontal: 16,
    marginBottom: 12,
    width: '100%',
  },
  field: {
    height: 56,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginVertical: 8,
    width: '100%',
  },
  fieldLabel: {
    color: '#666',
    marginRight: 8,
  },
  fieldValue: {
    flex: 1,
    color: '#000',
  },
  calendar: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  wheelSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 12,
  },
  colon: {
    fontFamily: 'Pretendard_Bold',
    marginHorizontal: 8,
  },
  confirmBtn: {
    backgroundColor: '#4169E1',
    paddingVertical: 14,
    alignItems: 'center',
  },
  confirmText: {
    color: '#fff',
    fontWeight: '600',
  },
});
