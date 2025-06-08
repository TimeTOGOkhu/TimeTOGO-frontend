import React from 'react';
import { View, StyleSheet } from 'react-native';
import {
  TextMedium,
} from "@components/TextSize";
import PressableOpacity from "@/components/PressableOpacity";

interface Props {
  label: string;
  value?: string;
  placeholder?: string;
  onPress: () => void;
}

export default function LocationInput({ label, value, placeholder, onPress }: Props) {
  return (
    <View style={styles.container}>
      <TextMedium style={[styles.label,!label && { height: 0, marginBottom: 0, padding: 0, fontSize: 0 }]}>{label}</TextMedium>
      <PressableOpacity style={styles.inputBox} onPress={onPress}>
        <TextMedium style={[styles.inputText, !value && styles.placeholderText]}>
          {value || placeholder || '장소를 선택해주세요'}
        </TextMedium>
      </PressableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
  },
  label: {
    fontFamily: 'Pretendard_Bold',
    marginBottom: 0,
    color: '#333',
  },
  inputBox: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
  },
  inputText: {
    color: '#000',
  },
  placeholderText: {
    color: '#999',
  },
});
