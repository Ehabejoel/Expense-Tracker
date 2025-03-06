import { View, Text, TextInput, TouchableOpacity, Animated, Platform, ScrollView, Dimensions } from 'react-native';
import { Link } from 'expo-router';
import { useState, useRef, useEffect } from 'react';
import { login } from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';
import { showSuccessToast, showErrorToast } from '@/utils/toast';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

const { width } = Dimensions.get('window');

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();
  
  const slideUp = useRef(new Animated.Value(50)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideUp, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(cardScale, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      showErrorToast('Missing Information', 'Please enter both email and password');
      return;
    }
    
    try {
      setIsLoading(true);
      const response = await login({ email, password });
      await signIn(response.token);
      showSuccessToast('Welcome back!', 'You have successfully logged in.');
    } catch (error) {
      showErrorToast('Authentication Failed', 'Please check your credentials and try again');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-indigo-50 dark:bg-gray-900">
      <StatusBar style={Platform.OS === 'ios' ? 'dark' : 'auto'} />
      <ScrollView 
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Decorative elements - adjusted positions */}
        <View className="absolute top-0 left-0 right-0">
          <View className="h-72 w-72 rounded-full bg-blue-500 absolute top-0 -left-20 opacity-30" />
          <View className="h-60 w-60 rounded-full bg-purple-500 absolute top-20 -right-20 opacity-20" />
        </View>

        <View className="flex-1 justify-center px-6 pt-4">
          <Animated.View 
            style={{ 
              transform: [{ translateY: slideUp }, { scale: cardScale }],
              opacity: opacity,
            }}
            className="justify-center items-center mb-8"
          >
            <View className="flex-row items-center mb-2">
              <MaterialCommunityIcons name="chart-timeline-variant" size={40} color="#4f46e5" />
              <Text className="text-4xl font-extrabold ml-2 text-indigo-600 dark:text-indigo-400">
                FinTrack
              </Text>
            </View>
            <Text className="text-gray-600 dark:text-gray-300 text-lg mb-2 italic text-center px-4">
              Your Financial Journey, Simplified
            </Text>
          </Animated.View>
          
          <Animated.View
            style={{ 
              transform: [{ translateY: slideUp }, { scale: cardScale }],
              opacity: opacity,
            }}
            className="mb-8"
          >
            <BlurView intensity={Platform.OS === 'ios' ? 60 : 100} tint="light" className="overflow-hidden rounded-3xl">
              <View className="bg-white/70 dark:bg-gray-800/70 rounded-3xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
                <Text className="text-center text-2xl font-bold mb-6 text-gray-800 dark:text-white">
                  Sign In
                </Text>
                
                {/* Email Input */}
                <View className="mb-6">
                  <Text className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1 ml-1">
                    Email
                  </Text>
                  <View className="border-b-2 border-gray-300 dark:border-gray-600 flex-row items-center py-2">
                    <Ionicons name="mail-outline" size={24} color="#6366f1" />
                    <TextInput
                      className="flex-1 ml-3 text-base text-gray-800 dark:text-white py-2"
                      placeholder="Enter your email"
                      placeholderTextColor="#9ca3af"
                      value={email}
                      onChangeText={setEmail}
                      autoCapitalize="none"
                      keyboardType="email-address"
                    />
                  </View>
                </View>
                
                {/* Password Input */}
                <View className="mb-8">
                  <Text className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1 ml-1">
                    Password
                  </Text>
                  <View className="border-b-2 border-gray-300 dark:border-gray-600 flex-row items-center py-2">
                    <Ionicons name="lock-closed-outline" size={24} color="#6366f1" />
                    <TextInput
                      className="flex-1 ml-3 text-base text-gray-800 dark:text-white py-2"
                      placeholder="Enter your password"
                      placeholderTextColor="#9ca3af"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry
                    />
                  </View>
                </View>

                {/* Login Button */}
                <TouchableOpacity 
                  onPress={handleLogin}
                  disabled={isLoading}
                  activeOpacity={0.8}
                  className="mb-4"
                >
                  <View className={`${isLoading ? 'bg-indigo-400' : 'bg-indigo-600'} py-4 rounded-xl shadow`}>
                    {isLoading ? (
                      <View className="flex-row justify-center items-center">
                        <Text className="text-white font-bold text-lg mr-2">Processing</Text>
                        <Animated.View
                          style={{
                            transform: [{
                              rotate: opacity.interpolate({
                                inputRange: [0, 1],
                                outputRange: ['0deg', '360deg']
                              })
                            }]
                          }}
                        >
                          <Ionicons name="reload-outline" size={20} color="white" />
                        </Animated.View>
                      </View>
                    ) : (
                      <Text className="text-white text-center font-bold text-lg">Sign In</Text>
                    )}
                  </View>
                </TouchableOpacity>

                {/* Forgot Password */}
                <TouchableOpacity className="mb-2">
                  <Text className="text-indigo-600 dark:text-indigo-400 text-center text-sm">
                    Forgot password?
                  </Text>
                </TouchableOpacity>
              </View>
            </BlurView>
          </Animated.View>

          {/* Create Account Link */}
          <Animated.View 
            style={{ opacity }}
            className="flex-row justify-center items-center"
          >
            <Text className="text-gray-600 dark:text-gray-400">Don't have an account? </Text>
            <Link href="/register" asChild>
              <TouchableOpacity>
                <Text className="text-indigo-600 dark:text-indigo-400 font-semibold">Create one</Text>
              </TouchableOpacity>
            </Link>
          </Animated.View>

          {/* Footer */}
          <View className="mt-auto pb-4">
            <Text className="text-center text-xs text-gray-500 dark:text-gray-400">
              © {new Date().getFullYear()} FinTrack • Secure login
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
