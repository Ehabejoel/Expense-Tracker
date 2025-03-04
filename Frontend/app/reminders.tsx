import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, TextInput, Platform, Alert } from 'react-native';
import { Icon } from '@/components/ui/Icon';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { createReminder, getReminders, getCashReserves, Reminder, handleReminderAction } from '@/utils/api';
import { showSuccessToast, showErrorToast } from '@/utils/toast';
import { categories } from '@/constants/categories';
import { formatCurrency } from '@/utils/currency';
import { socketService } from '@/utils/socket';

export default function RemindersScreen() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [cashReserves, setCashReserves] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [pickerConfig, setPickerConfig] = useState({
    show: false,
    mode: 'date' as 'date' | 'time',
    androidPickerVisible: false
  });
  const [newReminder, setNewReminder] = useState({
    title: '',
    amount: '',
    type: 'expense' as 'expense' | 'income',
    category: '',
    cashReserveId: '',
    date: new Date(),
    time: format(new Date(), 'HH:mm'),
    cycle: 'monthly' as 'daily' | 'weekly' | 'monthly' | 'yearly',
    notes: ''
  });

  useEffect(() => {
    loadData();
    
    // Set up WebSocket connection
    const socket = socketService.connect();
    
    socket.on('reminderNotifications', (notifications) => {
    interface ReminderNotification {
        title: string;
        message: string;
        data: {
            reminderId: string;
        };
    }

    notifications.forEach((notification: ReminderNotification) => {
        showReminderAlert(notification);
    });
    });

    return () => {
      socketService.disconnect();
    };
  }, []);

  const loadData = async () => {
    try {
      const [remindersData, reservesData] = await Promise.all([
        getReminders(),
        getCashReserves()
      ]);
      setReminders(remindersData);
      setCashReserves(reservesData);
    } catch (error) {
      showErrorToast('Error', 'Failed to load data');
    }
  };

  const handleAddReminder = async () => {
    try {
      if (!newReminder.title || !newReminder.amount || !newReminder.cashReserveId || !newReminder.category) {
        showErrorToast('Error', 'Please fill in all required fields');
        return;
      }

      const reminderData = {
        ...newReminder,
        amount: parseFloat(newReminder.amount)
      };

      await createReminder(reminderData);
      await loadData();
      setShowAddModal(false);
      showSuccessToast('Success', 'Reminder created successfully');
    } catch (error) {
      showErrorToast('Error', 'Failed to create reminder');
    }
  };

  const handlePickerPress = (mode: 'date' | 'time') => {
    if (Platform.OS === 'ios') {
      setPickerConfig(prev => ({
        ...prev,
        show: true,
        mode
      }));
    } else {
      setPickerConfig(prev => ({
        ...prev,
        androidPickerVisible: true,
        mode
      }));
    }
  };

  const handlePickerChange = (event: any, selected?: Date) => {
    if (Platform.OS === 'android') {
      setPickerConfig(prev => ({ ...prev, androidPickerVisible: false }));
      if (event.type === 'set' && selected) {
        updateDateTime(selected);
      }
    } else {
      if (event.type === 'set' && selected) {
        updateDateTime(selected);
      }
    }
  };

  const updateDateTime = (selected: Date) => {
    if (pickerConfig.mode === 'date') {
      setNewReminder(prev => ({
        ...prev,
        date: selected
      }));
    } else {
      setNewReminder(prev => ({
        ...prev,
        time: format(selected, 'HH:mm')
      }));
    }
  };

  const showReminderAlert = (notification: any) => {
    Alert.alert(
      notification.title,
      notification.message,
      [
        {
          text: 'Create Transaction',
          onPress: () => handleReminderAlert(notification.data.reminderId, 'create')
        },
        {
          text: 'Remind Later',
          onPress: () => handleReminderAlert(notification.data.reminderId, 'postpone')
        },
        {
          text: 'Dismiss',
          style: 'cancel'
        }
      ]
    );
  };

  const handleReminderAlert = async (reminderId: string, action: 'create' | 'postpone') => {
    try {
      await handleReminderAction(reminderId, action);
      if (action === 'create') {
        showSuccessToast('Success', 'Transaction created successfully');
      } else {
        showSuccessToast('Success', 'Reminder postponed by 1 hour');
      }
      loadData(); // Refresh reminders list
    } catch (error) {
      showErrorToast('Error', 'Failed to handle reminder action');
    }
  };

  const cycleOptions: { value: 'daily' | 'weekly' | 'monthly' | 'yearly', label: string }[] = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'yearly', label: 'Yearly' }
  ];

  return (
    <View className="flex-1 bg-gray-50">
      <View className="pt-12 pb-4 px-4 bg-purple-500">
        <View className="flex-row justify-between items-center">
          <Text className="text-2xl font-bold text-white">Reminders</Text>
          <TouchableOpacity 
            className="bg-white w-9 h-9 rounded-full items-center justify-center"
            onPress={() => setShowAddModal(true)}
          >
            <Icon name="plus" size={20} color="#8b5cf6" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1 px-4 pt-4">
        {reminders.map(reminder => (
          <View key={reminder._id} className="bg-white rounded-lg shadow-md p-4 mb-3 border-l-4 border-purple-500">
            <View className="flex-row justify-between items-center">
              <View>
                <Text className="text-lg font-semibold">{reminder.title}</Text>
                <Text className="text-gray-500">
                  {reminder.category} • {format(new Date(reminder.date), 'MMM dd')} at {reminder.time}
                </Text>
                <Text className="text-gray-600 text-sm capitalize">{reminder.cycle}</Text>
              </View>
              <Text className={`text-lg font-bold ${reminder.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                {reminder.type === 'income' ? '+' : '-'}
                {formatCurrency(reminder.amount, 'FCFA')}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Add Reminder Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showAddModal}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-5">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-xl font-bold">New Reminder</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Icon name="xmark.circle.fill" size={24} color="#9ca3af" />
              </TouchableOpacity>
            </View>

            {/* Transaction Type */}
            <View className="flex-row mb-4 border border-gray-200 rounded-lg overflow-hidden">
              <TouchableOpacity 
                className={`flex-1 py-3 ${newReminder.type === 'expense' ? 'bg-red-500' : 'bg-white'}`}
                onPress={() => setNewReminder({...newReminder, type: 'expense'})}
              >
                <Text className={`text-center font-medium ${newReminder.type === 'expense' ? 'text-white' : 'text-gray-800'}`}>
                  Expense
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                className={`flex-1 py-3 ${newReminder.type === 'income' ? 'bg-green-500' : 'bg-white'}`}
                onPress={() => setNewReminder({...newReminder, type: 'income'})}
              >
                <Text className={`text-center font-medium ${newReminder.type === 'income' ? 'text-white' : 'text-gray-800'}`}>
                  Income
                </Text>
              </TouchableOpacity>
            </View>

            {/* Title */}
            <Text className="font-medium mb-1">Title</Text>
            <TextInput
              className="border border-gray-300 rounded-lg p-2 mb-4"
              placeholder="Enter reminder title"
              value={newReminder.title}
              onChangeText={(text) => setNewReminder({...newReminder, title: text})}
            />

            {/* Amount */}
            <Text className="font-medium mb-1">Amount</Text>
            <TextInput
              className="border border-gray-300 rounded-lg p-2 mb-4"
              placeholder="0.00"
              keyboardType="numeric"
              value={newReminder.amount}
              onChangeText={(text) => setNewReminder({...newReminder, amount: text})}
            />

            {/* Cash Reserve */}
            <Text className="font-medium mb-2">Cash Reserve</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
              {cashReserves.map(reserve => (
                <TouchableOpacity 
                  key={reserve._id}
                  className={`py-2 px-4 mr-2 rounded-lg ${
                    newReminder.cashReserveId === reserve._id 
                      ? 'bg-purple-500' 
                      : 'bg-gray-200'
                  }`}
                  onPress={() => setNewReminder({...newReminder, cashReserveId: reserve._id})}
                >
                  <Text className={newReminder.cashReserveId === reserve._id ? 'text-white' : 'text-gray-800'}>
                    {reserve.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Category */}
            <Text className="font-medium mb-2">Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
              {categories[newReminder.type].map(category => (
                <TouchableOpacity 
                  key={category.id}
                  className={`py-2 px-4 mr-2 rounded-lg ${
                    newReminder.category === category.name 
                      ? 'bg-purple-500' 
                      : 'bg-gray-200'
                  }`}
                  onPress={() => setNewReminder({...newReminder, category: category.name})}
                >
                  <Text className={newReminder.category === category.name ? 'text-white' : 'text-gray-800'}>
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Date and Time */}
            <View className="flex-row mb-4">
              <View className="flex-1 mr-2">
                <Text className="font-medium mb-1">Date</Text>
                <TouchableOpacity 
                  className="border border-gray-300 rounded-lg p-2"
                  onPress={() => handlePickerPress('date')}
                >
                  <Text>{format(newReminder.date, 'MMM dd, yyyy')}</Text>
                </TouchableOpacity>
              </View>
              <View className="flex-1 ml-2">
                <Text className="font-medium mb-1">Time</Text>
                <TouchableOpacity 
                  className="border border-gray-300 rounded-lg p-2"
                  onPress={() => handlePickerPress('time')}
                >
                  <Text>{newReminder.time}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Cycle */}
            <Text className="font-medium mb-2">Repeat Cycle</Text>
            <View className="flex-row flex-wrap mb-4">
              {cycleOptions.map(option => (
                <TouchableOpacity 
                  key={option.value}
                  className={`py-2 px-4 mr-2 mb-2 rounded-lg ${
                    newReminder.cycle === option.value 
                      ? 'bg-purple-500' 
                      : 'bg-gray-200'
                  }`}
                  onPress={() => setNewReminder({...newReminder, cycle: option.value})}
                >
                  <Text className={newReminder.cycle === option.value ? 'text-white' : 'text-gray-800'}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Notes */}
            <Text className="font-medium mb-1">Notes (Optional)</Text>
            <TextInput
              className="border border-gray-300 rounded-lg p-2 mb-6"
              placeholder="Add any additional details"
              multiline
              numberOfLines={2}
              value={newReminder.notes}
              onChangeText={(text) => setNewReminder({...newReminder, notes: text})}
            />

            {/* Save Button */}
            <TouchableOpacity 
              className="bg-purple-500 py-3 rounded-lg items-center"
              onPress={handleAddReminder}
            >
              <Text className="text-white font-bold text-lg">Create Reminder</Text>
            </TouchableOpacity>

            {/* Add the DateTimePicker here, just before the closing View tag */}
            {Platform.OS === 'ios' && pickerConfig.show && (
              <View className="absolute bottom-0 left-0 right-0 bg-white">
                <View className="flex-row justify-end p-2 border-b border-gray-200">
                  <TouchableOpacity 
                    onPress={() => setPickerConfig(prev => ({ ...prev, show: false }))}
                    className="px-4 py-2"
                  >
                    <Text className="text-purple-500 font-medium">Done</Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={pickerConfig.mode === 'time' 
                    ? new Date(`2000-01-01T${newReminder.time}:00`) 
                    : newReminder.date
                  }
                  mode={pickerConfig.mode}
                  display="spinner"
                  onChange={handlePickerChange}
                  style={{ height: 200 }}
                />
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Only keep Android picker outside modal */}
      {Platform.OS === 'android' && pickerConfig.androidPickerVisible && (
        <DateTimePicker
          value={pickerConfig.mode === 'time' 
            ? new Date(`2000-01-01T${newReminder.time}:00`) 
            : newReminder.date
          }
          mode={pickerConfig.mode}
          is24Hour={true}
          display="default"
          onChange={handlePickerChange}
        />
      )}
    </View>
  );
}
