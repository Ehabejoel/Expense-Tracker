import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import { register } from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';
import { showSuccessToast, showErrorToast } from '@/utils/toast';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();

  const handleRegister = async () => {
    if (password !== confirmPassword) {
      showErrorToast('Error', 'Passwords do not match');
      return;
    }

    if (!email || !password || !name || !username) {
      showErrorToast('Error', 'All fields are required');
      return;
    }

    try {
      setIsLoading(true);
      const response = await register({
        name,
        username,
        email,
        password,
      });
      await signIn(response.token);
      showSuccessToast('Welcome!', 'Your account has been created successfully.');
    } catch (error: any) {
      console.error('Registration error:', error);
      showErrorToast(
        'Registration Failed',
        error.message || 'Please check your information and try again'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="flex-1 p-6 justify-center bg-white dark:bg-gray-900">
      <Text className="text-3xl font-bold mb-8 text-center text-gray-800 dark:text-white">
        Create Account
      </Text>
      
      <TextInput
        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-4 mb-4 text-gray-900 dark:text-white"
        placeholder="Full Name"
        placeholderTextColor="#9CA3AF"
        value={name}
        onChangeText={setName}
      />

      <TextInput
        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-4 mb-4 text-gray-900 dark:text-white"
        placeholder="Username"
        placeholderTextColor="#9CA3AF"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
      />

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
        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-4 mb-4 text-gray-900 dark:text-white"
        placeholder="Password"
        placeholderTextColor="#9CA3AF"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TextInput
        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-4 mb-6 text-gray-900 dark:text-white"
        placeholder="Confirm Password"
        placeholderTextColor="#9CA3AF"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
      />

      <TouchableOpacity 
        className={`w-full ${isLoading ? 'bg-blue-400' : 'bg-blue-600'} p-4 rounded-lg mb-4`}
        onPress={handleRegister}
        disabled={isLoading}
      >
        <Text className="text-white text-center font-bold text-lg">
          {isLoading ? 'Creating account...' : 'Register'}
        </Text>
      </TouchableOpacity>

      <Link href="/login">
        <Text className="text-blue-600 text-center">Already have an account? Login</Text>
      </Link>
    </View>
  );
}
