import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import { login } from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';
import { showSuccessToast, showErrorToast } from '@/utils/toast';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();

  const handleLogin = async () => {
    try {
      setIsLoading(true);
      const response = await login({ email, password });
      await signIn(response.token);
      showSuccessToast('Welcome back!', 'You have successfully logged in.');
    } catch (error) {
      showErrorToast('Error', 'Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="flex-1 p-6 justify-center bg-white dark:bg-gray-900">
      <Text className="text-3xl font-bold mb-8 text-center text-gray-800 dark:text-white">
        Welcome Back
      </Text>

      <TextInput
        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-4 mb-4 text-gray-900 dark:text-white"
        placeholder="Email"
        placeholderTextColor="#9CA3AF"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TextInput
        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-4 mb-6 text-gray-900 dark:text-white"
        placeholder="Password"
        placeholderTextColor="#9CA3AF"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity 
        className={`w-full ${isLoading ? 'bg-blue-400' : 'bg-blue-600'} p-4 rounded-lg mb-4`}
        onPress={handleLogin}
        disabled={isLoading}
      >
        <Text className="text-white text-center font-bold text-lg">
          {isLoading ? 'Logging in...' : 'Login'}
        </Text>
      </TouchableOpacity>

      <Link href="/register">
        <Text className="text-blue-600 text-center">Don't have an account? Register</Text>
      </Link>
    </View>
  );
}
