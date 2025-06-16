import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { Text } from '../../src/components/ui/Text';
import { TouchableOpacity } from 'react-native';
import { router } from 'expo-router';

export default function OnboardingScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Image
          source={require('../../assets/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>Welcome to Financial Risk Analyzer</Text>
        <Text style={styles.subtitle}>
          Your professional-grade portfolio optimization and risk analysis tool
        </Text>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push('/onboarding/step1')}
        >
          <Text style={styles.buttonText}>Get Started</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.skipButton}
          onPress={() => router.replace('/(app)/portfolio')}
        >
          <Text style={styles.skipButtonText}>Skip</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  footer: {
    padding: 20,
    paddingBottom: 40,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  skipButton: {
    padding: 16,
    alignItems: 'center',
  },
  skipButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
}); 