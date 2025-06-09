import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
} from 'react-native';
import Modal from 'react-modal';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { useFontSize } from '@hooks/useFontSize';
import {
  TextSmall,
  TextMedium,
  TextXLarge,
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

// 웹용 모달 스타일 설정
if (typeof window !== 'undefined') {
  Modal.setAppElement('body'); // body로 변경하여 더 안전하게
}

export default function ArrivalTimeModal({
  visible,
  initial,
  onConfirm,
  onCancel,
}: Props) {
  const now = new Date();
  const defaultDate = initial ?? now;
  const { getSize } = useFontSize();

  const [selectedDateTime, setSelectedDateTime] = useState<Date>(defaultDate);

  useEffect(() => {
    if (!visible) {
      setSelectedDateTime(defaultDate);
    }
  }, [visible, defaultDate]);

  // 웹용 DatePicker 커스텀 스타일을 동적으로 추가
  useEffect(() => {
    if (typeof window !== 'undefined' && visible) {
      // 기존 스타일 제거
      const existingStyle = document.getElementById('custom-datepicker-style');
      if (existingStyle) {
        existingStyle.remove();
      }

      // 새 스타일 추가
      const style = document.createElement('style');
      style.id = 'custom-datepicker-style';
      style.textContent = `
        .custom-datepicker {
          font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif !important;
          border: none !important;
          box-shadow: none !important;
        }
        
        .react-datepicker__header {
          background-color: #3457D5 !important;
          border-bottom: none !important;
        }
        
        .react-datepicker__current-month,
        .react-datepicker__day-name {
          color: white !important;
          font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif !important;
        }
        
        .react-datepicker__day--selected {
          background-color: #3457D5 !important;
        }
        
        .react-datepicker__day--selected:hover {
          background-color: #2845C7 !important;
        }
        
        .react-datepicker__time-container .react-datepicker__time .react-datepicker__time-box {
          width: 120px !important;
        }

        .react-datepicker__time-list-item {
          font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif !important;
        }

        .react-datepicker__time-list-item--selected {
          background-color: #3457D5 !important;
        }
      `;
      document.head.appendChild(style);

      // 컴포넌트 언마운트 시 스타일 제거
      return () => {
        const styleElement = document.getElementById('custom-datepicker-style');
        if (styleElement) {
          styleElement.remove();
        }
      };
    }
  }, [visible]);

  const handleConfirm = () => {
    onConfirm(selectedDateTime);
    onCancel();
  };

  const formatKoreanDate = (date: Date) => {
    const y = date.getFullYear();
    const m = date.getMonth() + 1;
    const d = date.getDate();
    const h = date.getHours();
    const min = String(date.getMinutes()).padStart(2, '0');
    const period = h < 12 ? '오전' : '오후';
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${y}년 ${m}월 ${d}일 ${period} ${h12}:${min}`;
  };

  return (
    <Modal
      isOpen={visible}
      onRequestClose={onCancel}
      style={{
        overlay: {
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          zIndex: 1000,
        },
        content: {
          top: '50%',
          left: '50%',
          right: 'auto',
          bottom: 'auto',
          marginRight: '-50%',
          transform: 'translate(-50%, -50%)',
          borderRadius: '12px',
          padding: '0',
          border: 'none',
          maxWidth: '400px',
          width: '90%',
          maxHeight: '80vh',
          overflow: 'auto',
          fontFamily: 'Pretendard, -apple-system, BlinkMacSystemFont, sans-serif',
        },
      }}
    >
      <View style={styles.container}>
        {/* 헤더 */}
        <View style={styles.header}>
          <TextXLarge style={styles.headerText}>
            도착 시간 설정
          </TextXLarge>
        </View>

        {/* 현재 선택된 시간 표시 */}
        <View style={styles.selectedTimeContainer}>
          <TextSmall style={styles.fieldLabel}>
            선택된 시간
          </TextSmall>
          <TextLarge style={styles.selectedTimeText}>
            {formatKoreanDate(selectedDateTime)}
          </TextLarge>
        </View>

        {/* 웹용 DatePicker */}
        <View style={styles.datePickerContainer}>
          <DatePicker
            selected={selectedDateTime}
            onChange={(date) => date && setSelectedDateTime(date)}
            showTimeSelect
            timeFormat="HH:mm"
            timeIntervals={5}
            timeCaption="시간"
            dateFormat="yyyy년 MM월 dd일 HH:mm"
            minDate={now}
            inline
            calendarClassName="custom-datepicker"
          />
        </View>

        {/* 버튼들 */}
        <View style={styles.buttonContainer}>
          <PressableOpacity style={styles.cancelButton} onPress={onCancel}>
            <TextMedium style={styles.cancelButtonText}>
              취소
            </TextMedium>
          </PressableOpacity>
          
          <PressableOpacity style={styles.confirmButton} onPress={handleConfirm}>
            <TextMedium style={styles.confirmButtonText}>
              확인
            </TextMedium>
          </PressableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerText: {
    fontFamily: 'Pretendard_Bold',
    textAlign: 'center',
    color: '#1F2937',
  },
  selectedTimeContainer: {
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  fieldLabel: {
    color: '#6B7280',
    marginBottom: 4,
    fontFamily: 'Pretendard_Medium',
  },
  selectedTimeText: {
    color: '#3457D5',
    fontFamily: 'Pretendard_Bold',
  },
  datePickerContainer: {
    padding: 16,
    alignItems: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
  },
  cancelButtonText: {
    color: '#6B7280',
    fontFamily: 'Pretendard_Medium',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: '#3457D5',
  },
  confirmButtonText: {
    color: '#fff',
    fontFamily: 'Pretendard_Bold',
  },
});
