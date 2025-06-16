import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Text } from '../../../src/components/ui/Text';
import { FinancialInput } from '../../../src/components/ui/FinancialInput';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface ApiKey {
  id: string;
  name: string;
  provider: string;
  key: string;
  isVisible: boolean;
}

const sampleApiKeys: ApiKey[] = [
  {
    id: '1',
    name: 'Alpha Vantage',
    provider: 'Market Data',
    key: '••••••••••••••••••••••••••••••••',
    isVisible: false,
  },
  {
    id: '2',
    name: 'Financial Modeling Prep',
    provider: 'Financial Data',
    key: '••••••••••••••••••••••••••••••••',
    isVisible: false,
  },
];

export default function ApiKeysScreen() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>(sampleApiKeys);
  const [isAddingKey, setIsAddingKey] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyProvider, setNewKeyProvider] = useState('');
  const [newKeyValue, setNewKeyValue] = useState('');

  const toggleKeyVisibility = (id: string) => {
    setApiKeys(keys =>
      keys.map(key =>
        key.id === id ? { ...key, isVisible: !key.isVisible } : key
      )
    );
  };

  const deleteApiKey = (id: string) => {
    Alert.alert(
      'Delete API Key',
      'Are you sure you want to delete this API key?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setApiKeys(keys => keys.filter(key => key.id !== id));
          },
        },
      ]
    );
  };

  const addNewKey = () => {
    if (!newKeyName || !newKeyProvider || !newKeyValue) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const newKey: ApiKey = {
      id: Date.now().toString(),
      name: newKeyName,
      provider: newKeyProvider,
      key: newKeyValue,
      isVisible: false,
    };

    setApiKeys([...apiKeys, newKey]);
    setIsAddingKey(false);
    setNewKeyName('');
    setNewKeyProvider('');
    setNewKeyValue('');
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'API Keys',
          headerShown: true,
        }}
      />

      <View style={styles.apiKeysList}>
        {apiKeys.map((apiKey) => (
          <View key={apiKey.id} style={styles.apiKeyItem}>
            <View style={styles.apiKeyInfo}>
              <Text style={styles.apiKeyName}>{apiKey.name}</Text>
              <Text style={styles.apiKeyProvider}>{apiKey.provider}</Text>
              <Text style={styles.apiKeyValue}>
                {apiKey.isVisible ? apiKey.key : '••••••••••••••••••••••••••••••••'}
              </Text>
            </View>
            <View style={styles.apiKeyActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => toggleKeyVisibility(apiKey.id)}
              >
                <Ionicons
                  name={apiKey.isVisible ? 'eye-off' : 'eye'}
                  size={24}
                  color="#007AFF"
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => deleteApiKey(apiKey.id)}
              >
                <Ionicons name="trash" size={24} color="#FF3B30" />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>

      {isAddingKey ? (
        <View style={styles.addKeyForm}>
          <FinancialInput
            label="API Key Name"
            placeholder="Enter API key name"
            value={newKeyName}
            onChangeText={setNewKeyName}
          />
          <FinancialInput
            label="Provider"
            placeholder="Enter provider name"
            value={newKeyProvider}
            onChangeText={setNewKeyProvider}
          />
          <FinancialInput
            label="API Key"
            placeholder="Enter API key"
            value={newKeyValue}
            onChangeText={setNewKeyValue}
            secureTextEntry
          />
          <View style={styles.formActions}>
            <TouchableOpacity
              style={[styles.formButton, styles.cancelButton]}
              onPress={() => setIsAddingKey(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.formButton, styles.addButton]}
              onPress={addNewKey}
            >
              <Text style={styles.addButtonText}>Add Key</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setIsAddingKey(true)}
        >
          <Ionicons name="add" size={24} color="#fff" />
          <Text style={styles.addButtonText}>Add New API Key</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  apiKeysList: {
    padding: 20,
  },
  apiKeyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    marginBottom: 12,
  },
  apiKeyInfo: {
    flex: 1,
  },
  apiKeyName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  apiKeyProvider: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 8,
  },
  apiKeyValue: {
    fontSize: 14,
    fontFamily: 'monospace',
  },
  apiKeyActions: {
    flexDirection: 'row',
    gap: 16,
  },
  actionButton: {
    padding: 8,
  },
  addKeyForm: {
    padding: 20,
    gap: 16,
  },
  formActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  formButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F2F2F7',
  },
  cancelButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  addButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    margin: 20,
    padding: 16,
    borderRadius: 12,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 