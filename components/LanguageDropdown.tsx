import React, { useState } from 'react';
import { View, StyleSheet, Pressable, ScrollView } from 'react-native';
import { TextMedium, TextNormal } from './TextSize';
import { useSettingsStore, Language } from '../store/settingsStore';
import { LANGUAGE_OPTIONS } from '@constants/Languages';

interface LanguageDropdownProps {
  style?: any;
}

export default function LanguageDropdown({ style }: LanguageDropdownProps) {
  const { language, setLanguage } = useSettingsStore();
  const [isOpen, setIsOpen] = useState(false);

  const currentLanguage = LANGUAGE_OPTIONS.find(option => option.code === language);

  const handleLanguageSelect = (selectedLanguage: Language) => {
    setLanguage(selectedLanguage);
    setIsOpen(false);
  };

  return (
    <View style={[styles.container, style]}>
      {/* 선택된 언어 표시 버튼 */}
      <Pressable 
        style={[styles.selector, isOpen && styles.selectorOpen]}
        onPress={() => setIsOpen(!isOpen)}
      >
        <View style={styles.selectedItem}>
          <TextNormal style={styles.flag}>{currentLanguage?.flag}</TextNormal>
          <TextMedium style={styles.languageName}>{currentLanguage?.name}</TextMedium>
        </View>
        <TextMedium style={styles.arrow}>{isOpen ? '▲' : '▼'}</TextMedium>
      </Pressable>

      {/* 드롭다운 목록 */}
      {isOpen && (
        <View style={styles.dropdown}>
          <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
            {LANGUAGE_OPTIONS.map((option) => (
              <Pressable
                key={option.code}
                style={[
                  styles.dropdownItem,
                  language === option.code && styles.selectedDropdownItem
                ]}
                onPress={() => handleLanguageSelect(option.code)}
              >
                <View style={styles.dropdownItemContent}>
                  <TextNormal style={styles.flag}>{option.flag}</TextNormal>
                  <TextMedium 
                    style={[
                      styles.languageName,
                      language === option.code && styles.selectedLanguageName
                    ]}
                  >
                    {option.name}
                  </TextMedium>
                </View>
                {language === option.code && (
                  <TextMedium style={styles.checkmark}>✓</TextMedium>
                )}
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 1000,
  },
  selector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderColor: '#D0D0D0',
    borderWidth: 1,
    borderRadius: 6,
    backgroundColor: '#f8f8f8',
    minWidth: 120,
  },
  selectorOpen: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderBottomColor: 'transparent',
  },
  selectedItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flag: {
    marginRight: 8,
  },
  languageName: {
    color: '#333',
  },
  arrow: {
    color: '#666',
    marginLeft: 8,
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#D0D0D0',
    borderTopWidth: 0,
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
    maxHeight: 200,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 1001,
  },
  dropdownScroll: {
    maxHeight: 200,
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  selectedDropdownItem: {
    backgroundColor: '#F0F7FF',
  },
  dropdownItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedLanguageName: {
    color: '#3457D5',
    fontFamily: 'Pretendard_Bold',
  },
  checkmark: {
    color: '#3457D5',
    fontFamily: 'Pretendard_Bold',
  },
});
