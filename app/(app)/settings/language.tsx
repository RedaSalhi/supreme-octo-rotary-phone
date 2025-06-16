import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from '../../../src/components/ui/Text';
import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';

interface Language {
  code: string;
  name: string;
  nativeName: string;
}

const languages: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
];

export default function LanguageScreen() {
  const [selectedLanguage, setSelectedLanguage] = useState('en');

  const changeLanguage = (code: string) => {
    setSelectedLanguage(code);
    // TODO: Implement language change logic
    console.log('Changing language to:', code);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Language',
          headerShown: true,
        }}
      />

      <View style={styles.languageList}>
        {languages.map((language) => (
          <TouchableOpacity
            key={language.code}
            style={[
              styles.languageItem,
              selectedLanguage === language.code && styles.selectedLanguage,
            ]}
            onPress={() => changeLanguage(language.code)}
          >
            <View style={styles.languageInfo}>
              <Text style={styles.languageName}>{language.name}</Text>
              <Text style={styles.languageNative}>{language.nativeName}</Text>
            </View>
            {selectedLanguage === language.code && (
              <Ionicons name="checkmark-circle" size={24} color="#007AFF" />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  languageList: {
    padding: 20,
  },
  languageItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    marginBottom: 12,
  },
  selectedLanguage: {
    backgroundColor: '#E5F2FF',
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  languageNative: {
    fontSize: 14,
    color: '#8E8E93',
  },
}); 