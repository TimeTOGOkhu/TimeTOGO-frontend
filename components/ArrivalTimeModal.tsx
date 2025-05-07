import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import Modal from 'react-native-modal';
import { Calendar } from 'react-native-calendars';
import { Picker } from '@react-native-picker/picker';

type Props = {
  visible: boolean;
  initial?: Date;
  onConfirm: (dt: Date) => void;
  onCancel: () => void;
};

export default function ArrivalTimeModal({
  visible,
  initial = new Date(),
  onConfirm,
  onCancel,
}: Props) {
  // 내부 상태
  const [date, setDate] = useState(initial);
  const [period, setPeriod] = useState<'AM' | 'PM'>(initial.getHours() < 12 ? 'AM' : 'PM');
  const [hour, setHour] = useState(() => {
    const h = initial.getHours() % 12;
    return h === 0 ? 12 : h;
  });
  const [minute, setMinute] = useState(() => initial.getMinutes());

  // initial이 바뀌면 동기화
  useEffect(() => {
    setDate(initial);
    setPeriod(initial.getHours() < 12 ? 'AM' : 'PM');
    const h = initial.getHours() % 12 || 12;
    setHour(h);
    setMinute(initial.getMinutes());
  }, [initial]);

  const handleConfirm = () => {
    let h24 = hour % 12 + (period === 'PM' ? 12 : 0);
    if (h24 === 24) h24 = 12;
    const dt = new Date(date);
    dt.setHours(h24, minute, 0, 0);
    onConfirm(dt);
  };

  // 달력에 선택된 날짜 마킹
  const marked: Record<string, any> = {};
  marked[date.toISOString().split('T')[0]] = {
    selected: true,
    selectedColor: '#4169E1',
  };

  return (
    <Modal
      isVisible={visible}
      onBackdropPress={onCancel}
      backdropOpacity={0.3}
      style={styles.modalWrapper}
    >
      <View style={styles.modalContent}>
        <Text style={styles.header}>도착 시간 선택</Text>

        {/* 1) 달력 */}
        <Calendar
          minDate={new Date().toISOString().split('T')[0]}
          onDayPress={day => setDate(new Date(day.timestamp))}
          markedDates={marked}
          theme={{
            todayTextColor: '#4169E1',
            arrowColor: '#4169E1',
          }}
          style={styles.calendar}
        />

        {/* 2) 시간 다이얼 */}
        <View style={styles.timeRow}>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={period}
              onValueChange={v => setPeriod(v)}
              style={styles.picker}
            >
              <Picker.Item label="오전" value="AM" />
              <Picker.Item label="오후" value="PM" />
            </Picker>
          </View>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={hour}
              onValueChange={v => setHour(v)}
              style={styles.picker}
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map(h => (
                <Picker.Item key={h} label={`${h}`} value={h} />
              ))}
            </Picker>
          </View>
          <Text style={styles.colon}>:</Text>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={minute}
              onValueChange={v => setMinute(v)}
              style={styles.picker}
            >
              {Array.from({ length: 60 }, (_, i) => i).map(m => (
                <Picker.Item key={m} label={m.toString().padStart(2, '0')} value={m} />
              ))}
            </Picker>
          </View>
        </View>

        {/* 확인 버튼 */}
        <Pressable style={styles.confirmBtn} onPress={handleConfirm}>
          <Text style={styles.confirmText}>확인</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalWrapper: {
    justifyContent: 'center',
    margin: 0,
  },
  modalContent: {
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
  calendar: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  pickerWrapper: {
    flex: 1,
    height: Platform.OS === 'android' ? 150 : undefined,
  },
  picker: {
    flex: 1,
  },
  colon: {
    fontSize: 20,
    fontWeight: '600',
    marginHorizontal: 4,
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
