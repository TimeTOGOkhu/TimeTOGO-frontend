import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

interface Props {
  label: string;
  value?: string;
  placeholder?: string;
  onPress: () => void;
}

export default function LocationInput({ label, value, placeholder, onPress }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <Pressable style={styles.inputBox} onPress={onPress}>
        <Text style={[styles.inputText, !value && styles.placeholderText]}>
          {value || placeholder || '장소를 선택해주세요'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
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
    fontSize: 16,
    color: '#000',
  },
  placeholderText: {
    color: '#999',
  },
});
