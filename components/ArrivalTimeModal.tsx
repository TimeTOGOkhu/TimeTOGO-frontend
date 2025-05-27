import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
} from 'react-native';
import Modal from 'react-native-modal';
import { Calendar } from 'react-native-calendars';
import WheelPicker from '@quidone/react-native-wheel-picker';

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

  const [selectedDate, setSelectedDate] = useState<Date>(defaultDate);
  const [period, setPeriod] = useState<'AM' | 'PM'>(
    defaultDate.getHours() < 12 ? 'AM' : 'PM'
  );
  const [hour, setHour] = useState<number>(
    defaultDate.getHours() % 12 || 12
  );
  const [minute, setMinute] = useState<number>(
    defaultDate.getMinutes()
  );
  const [activeTab, setActiveTab] = useState<'date' | 'time' | null>(null);

  useEffect(() => {
    if (!visible) {
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
    if (h24 === 24) h24 = 12;
    d.setHours(h24, minute, 0, 0);
    onConfirm(d);
    onCancel();
  };

  const handleDayPress = (day: { timestamp: number }) => {
    setSelectedDate(new Date(day.timestamp));
  };

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
        <Text style={styles.header}>도착 시간 설정</Text>
        <View style={styles.fieldRow}>
          <Pressable style={styles.field} onPress={() => setActiveTab('date')}>
            <Text style={styles.fieldLabel}>날짜</Text>
            <Text style={styles.fieldValue}>{dateText}</Text>
          </Pressable>
          <Pressable style={styles.field} onPress={() => setActiveTab('time')}>
            <Text style={styles.fieldLabel}>시간</Text>
            <Text style={styles.fieldValue}>{timeText}</Text>
          </Pressable>
        </View>

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
            }}
            style={styles.calendar}
          />
        )}

        {activeTab === 'time' && (
          <View style={styles.wheelSection}>
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
            />
            <View style={{ width: 16 }} />
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
            />
            <Text style={styles.colon}>:</Text>
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
            />
          </View>
        )}

        <Pressable style={styles.confirmBtn} onPress={handleConfirmAll}>
          <Text style={styles.confirmText}>확인</Text>
        </Pressable>
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
    fontSize: 18,
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
    fontSize: 24,
    fontWeight: 'bold',
    marginHorizontal: 8,
  },
  confirmBtn: {
    backgroundColor: '#4169E1',
    paddingVertical: 14,
    alignItems: 'center',
  },
  confirmText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
