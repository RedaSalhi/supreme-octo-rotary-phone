import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text } from '../../../src/components/ui/Text';
import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';

interface SettingItem {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
}

const settings: SettingItem[] = [
  {
    title: 'Language',
    icon: 'language',
    route: '/settings/language',
  },
  {
    title: 'Appearance',
    icon: 'color-palette',
    route: '/settings/appearance',
  },
  {
    title: 'API Keys',
    icon: 'key',
    route: '/settings/api-keys',
  },
  {
    title: 'Notifications',
    icon: 'notifications',
    route: '/settings/notifications',
  },
  {
    title: 'About',
    icon: 'information-circle',
    route: '/settings/about',
  },
];

export default function SettingsScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      <View style={styles.settingsList}>
        {settings.map((setting) => (
          <Link key={setting.title} href={setting.route} asChild>
            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Ionicons name={setting.icon} size={24} color="#007AFF" />
                <Text style={styles.settingTitle}>{setting.title}</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#C7C7CC" />
            </TouchableOpacity>
          </Link>
        ))}
      </View>

      <TouchableOpacity style={styles.logoutButton}>
        <Ionicons name="log-out" size={24} color="#FF3B30" />
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  settingsList: {
    padding: 20,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    margin: 20,
    padding: 16,
    backgroundColor: '#FFE5E5',
    borderRadius: 12,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF3B30',
  },
}); 