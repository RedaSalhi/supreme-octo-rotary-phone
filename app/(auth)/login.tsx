import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Link, router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { FinancialInput } from '@/components/ui/FinancialInput';
import { Text } from '@/components/ui/Text';

interface LoginFormData {
  email: string;
  password: string;
}

export default function LoginScreen() {
  const { control, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      // TODO: Implement actual login logic
      console.log('Login data:', data);
      router.replace('/(app)/dashboard');
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Financial Risk Analyzer</Text>
        <Text style={styles.subtitle}>Sign in to your account</Text>
      </View>

      <View style={styles.form}>
        <Controller
          control={control}
          rules={{
            required: 'Email is required',
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: 'Invalid email address',
            },
          }}
          name="email"
          render={({ field: { onChange, value } }) => (
            <FinancialInput
              label="Email"
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              value={value}
              onChangeText={onChange}
              error={errors.email?.message}
            />
          )}
        />

        <Controller
          control={control}
          rules={{
            required: 'Password is required',
            minLength: {
              value: 8,
              message: 'Password must be at least 8 characters',
            },
          }}
          name="password"
          render={({ field: { onChange, value } }) => (
            <FinancialInput
              label="Password"
              placeholder="Enter your password"
              secureTextEntry
              value={value}
              onChangeText={onChange}
              error={errors.password?.message}
            />
          )}
        />

        <TouchableOpacity
          style={styles.button}
          onPress={handleSubmit(onSubmit)}
        >
          <Text style={styles.buttonText}>Sign In</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <Link href="/register" asChild>
            <TouchableOpacity>
              <Text style={styles.link}>Sign Up</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  header: {
    marginTop: 60,
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  form: {
    gap: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    color: '#666',
  },
  link: {
    color: '#007AFF',
    fontWeight: '600',
  },
}); 