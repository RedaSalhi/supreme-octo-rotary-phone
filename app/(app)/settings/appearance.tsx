import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { Text } from '../../../src/components/ui/Text';
import { Stack } from 'expo-router';

interface ThemeOption {
  id: string;
  name: string;
  description: string;
}

const themes: ThemeOption[] = [
  {
    id: 'system',
    name: 'System Default',
    description: 'Follow system appearance settings',
  },
  {
    id: 'light',
    name: 'Light',
    description: 'Always use light mode',
  },
  {
    id: 'dark',
    name: 'Dark',
    description: 'Always use dark mode',
  },
];

export default function AppearanceScreen() {
  const [selectedTheme, setSelectedTheme] = useState('system');
  const [isDarkMode, setIsDarkMode] = useState(false);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    // TODO: Implement dark mode toggle logic
    console.log('Dark mode:', !isDarkMode);
  };

  const changeTheme = (themeId: string) => {
    setSelectedTheme(themeId);
    // TODO: Implement theme change logic
    console.log('Changing theme to:', themeId);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Appearance',
          headerShown: true,
        }}
      />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Theme</Text>
        {themes.map((theme) => (
          <TouchableOpacity
            key={theme.id}
            style={[
              styles.themeItem,
              selectedTheme === theme.id && styles.selectedTheme,
            ]}
            onPress={() => changeTheme(theme.id)}
          >
            <View style={styles.themeInfo}>
              <Text style={styles.themeName}>{theme.name}</Text>
              <Text style={styles.themeDescription}>{theme.description}</Text>
            </View>
            {selectedTheme === theme.id && (
              <View style={styles.checkmark} />
            )}
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Display</Text>
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingName}>Dark Mode</Text>
            <Text style={styles.settingDescription}>
              Enable dark mode for the app
            </Text>
          </View>
          <Switch
            value={isDarkMode}
            onValueChange={toggleDarkMode}
            trackColor={{ false: '#E5E5EA', true: '#34C759' }}
            thumbColor="#fff"
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  themeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    marginBottom: 12,
  },
  selectedTheme: {
    backgroundColor: '#E5F2FF',
  },
  themeInfo: {
    flex: 1,
  },
  themeName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  themeDescription: {
    fontSize: 14,
    color: '#8E8E93',
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#007AFF',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
  },
  settingInfo: {
    flex: 1,
  },
  settingName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#8E8E93',
  },
}); 