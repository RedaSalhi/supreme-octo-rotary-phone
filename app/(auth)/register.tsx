import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Link, router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { FinancialInput } from '@/components/ui/FinancialInput';
import { Text } from '@/components/ui/Text';

interface RegisterFormData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export default function RegisterScreen() {
  const { control, handleSubmit, watch, formState: { errors } } = useForm<RegisterFormData>({
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const password = watch('password');

  const onSubmit = async (data: RegisterFormData) => {
    try {
      // TODO: Implement actual registration logic
      console.log('Registration data:', data);
      router.replace('/(app)/dashboard');
    } catch (error) {
      console.error('Registration error:', error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Join Financial Risk Analyzer</Text>
      </View>

      <View style={styles.form}>
        <Controller
          control={control}
          rules={{
            required: 'Full name is required',
            minLength: {
              value: 2,
              message: 'Name must be at least 2 characters',
            },
          }}
          name="fullName"
          render={({ field: { onChange, value } }) => (
            <FinancialInput
              label="Full Name"
              placeholder="Enter your full name"
              value={value}
              onChangeText={onChange}
              error={errors.fullName?.message}
            />
          )}
        />

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
              placeholder="Create a password"
              secureTextEntry
              value={value}
              onChangeText={onChange}
              error={errors.password?.message}
            />
          )}
        />

        <Controller
          control={control}
          rules={{
            required: 'Please confirm your password',
            validate: value => value === password || 'Passwords do not match',
          }}
          name="confirmPassword"
          render={({ field: { onChange, value } }) => (
            <FinancialInput
              label="Confirm Password"
              placeholder="Confirm your password"
              secureTextEntry
              value={value}
              onChangeText={onChange}
              error={errors.confirmPassword?.message}
            />
          )}
        />

        <TouchableOpacity
          style={styles.button}
          onPress={handleSubmit(onSubmit)}
        >
          <Text style={styles.buttonText}>Create Account</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <Link href="/login" asChild>
            <TouchableOpacity>
              <Text style={styles.link}>Sign In</Text>
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