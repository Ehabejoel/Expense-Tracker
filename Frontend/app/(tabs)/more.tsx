import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator, Switch, ScrollView } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { showSuccessToast } from '@/utils/toast';
import { Icon } from '@/components/ui/Icon';
import { useColorScheme } from 'nativewind';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

export default function MoreScreen() {
  const { signOut, user } = useAuth();
  const { colorScheme, toggleColorScheme } = useColorScheme();
  const [remindersEnabled, setRemindersEnabled] = useState(true);

  const menuSections = [
    {
      title: 'Account',
      items: [
        {
          icon: 'person.crop.circle',
          label: 'Edit Profile',
          onPress: () => {},
          color: '#6366f1'
        },
        {
          icon: 'bell',
          label: 'Reminders',
          onPress: () => router.push('/reminders'),
          color: '#8b5cf6'
        }
      ]
    },
    {
      title: 'Preferences',
      items: [
        {
          icon: 'moon.fill',
          label: 'Dark Mode',
          onPress: toggleColorScheme,
          color: '#6b7280',
          toggle: true,
          toggleValue: colorScheme === 'dark'
        },
        {
          icon: 'dollarsign.circle',
          label: 'Default Currency',
          onPress: () => {},
          color: '#059669',
          rightText: 'FCFA'
        }
      ]
    },
    {
      title: 'Support & About',
      items: [
        {
          icon: 'questionmark.circle',
          label: 'Help Center',
          onPress: () => {},
          color: '#0ea5e9'
        },
        {
          icon: 'exclamationmark.shield',
          label: 'Privacy Policy',
          onPress: () => {},
          color: '#64748b'
        },
        {
          icon: 'doc.text',
          label: 'Terms of Service',
          onPress: () => {},
          color: '#64748b'
        }
      ]
    }
  ];

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            showSuccessToast('Logged Out', 'You have been successfully logged out');
          },
        },
      ]
    );
  };

  const renderMenuItem = (item: any) => (
    <TouchableOpacity
      key={item.label}
      onPress={item.onPress}
      className="flex-row items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg mb-2"
    >
      <View className="flex-row items-center">
        <View className="w-8 h-8 rounded-full items-center justify-center" style={{ backgroundColor: `${item.color}20` }}>
          <Icon name={item.icon} size={20} color={item.color} />
        </View>
        <Text className="ml-3 text-gray-800 dark:text-gray-200 font-medium">
          {item.label}
        </Text>
      </View>
      
      {item.toggle ? (
        <Switch
          value={item.toggleValue}
          onValueChange={item.onPress}
          trackColor={{ false: '#d1d5db', true: `${item.color}50` }}
          thumbColor={item.toggleValue ? item.color : '#f3f4f6'}
        />
      ) : item.rightText ? (
        <Text className="text-gray-600 dark:text-gray-400">{item.rightText}</Text>
      ) : (
        <Icon name="chevron.right" size={20} color="#9ca3af" />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900">
      <ScrollView className="flex-1" contentInsetAdjustmentBehavior="automatic">
        {/* Profile Section */}
        <View className="px-6 pt-4">
          {user ? (
            <View className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
              <View className="flex-row items-center">
                <View className="h-16 w-16 bg-purple-100 dark:bg-purple-900 rounded-full items-center justify-center">
                  <Text className="text-2xl text-purple-600 dark:text-purple-400">
                    {user.name[0].toUpperCase()}
                  </Text>
                </View>
                <View className="ml-4 flex-1">
                  <Text className="text-xl font-semibold text-gray-800 dark:text-white">
                    {user.name}
                  </Text>
                  <Text className="text-gray-600 dark:text-gray-400">
                    {user.email}
                  </Text>
                </View>
                <TouchableOpacity className="p-2">
                  <Icon name="pencil" size={20} color="#9333ea" />
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <ActivityIndicator size="large" className="my-2" />
          )}

          {/* Menu Sections */}
          {menuSections.map(section => (
            <View key={section.title}>
              <Text className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 px-1 mt-2">
                {section.title}
              </Text>
              {section.items.map(renderMenuItem)}
            </View>
          ))}

          {/* Logout Button and Version */}
          <View className="pb-4">
            <TouchableOpacity 
              onPress={handleLogout}
              className="flex-row items-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg mt-2"
            >
              <Icon name="rectangle.portrait.and.arrow.right" size={24} color="#EF4444" />
              <Text className="ml-3 text-red-600 dark:text-red-400 font-semibold">
                Logout
              </Text>
            </TouchableOpacity>

            <Text className="text-center text-gray-500 dark:text-gray-400 text-sm mt-4">
              Version 1.0.0
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
