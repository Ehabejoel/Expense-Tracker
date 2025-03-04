import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Modal } from 'react-native';
import { Icon } from '@/components/ui/Icon';
import { createCashReserve, getCashReserves } from '@/utils/api';
import { showSuccessToast, showErrorToast } from '@/utils/toast';
import { formatCurrency, groupReservesByCurrency, convertToFCFA } from '@/utils/currency';

interface CashReserve {
  _id: string; // Changed from id to _id to match MongoDB
  name: string;
  type: string;
  currency: string;
  balance: number;
  color: string;
  icon: string;
}

export default function CashReservesScreen() {
  const [reserves, setReserves] = useState<CashReserve[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newReserve, setNewReserve] = useState({
    name: 'Cash',
    type: 'cash', // 'cash', 'momo', 'bank'
    currency: 'FCFA',
    balance: '',
    color: 'blue',
    icon: 'banknote'
  });

  useEffect(() => {
    loadReserves();
  }, []);

  const loadReserves = async () => {
    try {
      const data = await getCashReserves();
      setReserves(data);
    } catch (error) {
      showErrorToast('Error', 'Failed to load reserves');
    }
  };

  const handleAddReserve = async () => {
    try {
      const data = {
        ...newReserve,
        balance: parseFloat(newReserve.balance)
      };
      await createCashReserve(data);
      await loadReserves();
      setShowAddModal(false);
      showSuccessToast('Success', 'Reserve added successfully');
    } catch (error) {
      showErrorToast('Error', 'Failed to add reserve');
    }
  };

  // Available options
  const typeOptions = [
    { value: 'cash', label: 'Cash' },
    { value: 'momo', label: 'Mobile Money' },
    { value: 'bank', label: 'Bank Account' }
  ];
  
  const currencyOptions = [
    { value: 'FCFA', label: 'FCFA (CFA Franc)' },
    { value: 'USD', label: 'USD (US Dollar)' },
    { value: 'NGN', label: 'NGN (Nigerian Naira)' },
    { value: 'EUR', label: 'EUR (Euro)' },
    { value: 'GBP', label: 'GBP (British Pound)' }
  ];
  
  const colorOptions = [
    { value: 'blue', label: 'Blue', hex: '#3b82f6' },
    { value: 'green', label: 'Green', hex: '#10b981' },
    { value: 'red', label: 'Red', hex: '#ef4444' },
    { value: 'purple', label: 'Purple', hex: '#8b5cf6' },
    { value: 'yellow', label: 'Yellow', hex: '#f59e0b' },
    { value: 'indigo', label: 'Indigo', hex: '#6366f1' }
  ];
  
  const iconOptions = [
    { value: 'banknote', label: 'Banknote' },
    { value: 'creditcard', label: 'Credit Card' },
    { value: 'wallet.pass', label: 'Wallet' },
    { value: 'building.columns', label: 'Bank' },
    { value: 'dollarsign.circle', label: 'Dollar' },
    { value: 'smartphone', label: 'Mobile Phone' }
  ];

  const calculateTotal = () => {
    return reserves.reduce((sum, reserve) => 
      sum + convertToFCFA(reserve.balance, reserve.currency), 0);
  };

  const renderTotalBalance = () => {
    const groupedBalances = groupReservesByCurrency(reserves);
    
    return (
      <View className="bg-white rounded-lg shadow-md p-6 mb-4">
        <Text className="text-gray-500 mb-1">Total Balance</Text>
        <Text className="text-3xl font-bold mb-2">
          {formatCurrency(calculateTotal(), 'FCFA')}
        </Text>
        <View className="border-t border-gray-200 pt-2">
          {Object.entries(groupedBalances).map(([currency, balance]) => (
            <Text key={currency} className="text-sm text-gray-600">
              {formatCurrency(balance as number, currency)}
            </Text>
          ))}
        </View>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-gray-50">
      <View className="pt-12 pb-4 px-4 bg-green-500">
        <View className="flex-row justify-between items-center">
          <Text className="text-2xl font-bold text-white">Cash Reserves</Text>
          <TouchableOpacity 
            className="bg-white w-9 h-9 rounded-full items-center justify-center"
            onPress={() => setShowAddModal(true)}
          >
            <Icon name="plus" size={20} color="#10b981" />
          </TouchableOpacity>
        </View>
      </View>
      
      <ScrollView className="flex-1">
        <View className="p-4">
          {renderTotalBalance()}
          
          <Text className="text-xl font-semibold mt-4 mb-3">My Reserves</Text>
          
          {reserves.map(reserve => (
            <View key={reserve._id} className={`bg-white rounded-lg shadow-md p-4 mb-3 border-l-4`} style={{ borderLeftColor: colorOptions.find(c => c.value === reserve.color)?.hex }}>
              <View className="flex-row items-center">
                <View className={`w-10 h-10 rounded-full items-center justify-center mr-3`} style={{ backgroundColor: colorOptions.find(c => c.value === reserve.color)?.hex + '20' }}>
                  <Icon name={reserve.icon} size={20} color={colorOptions.find(c => c.value === reserve.color)?.hex ?? '#000000'} />
                </View>
                <View className="flex-1">
                  <Text className="text-lg font-semibold">{reserve.name}</Text>
                  <Text className="text-gray-500 text-sm">{typeOptions.find(t => t.value === reserve.type)?.label}</Text>
                </View>
                <View>
                  <Text className="text-xl font-bold">{formatCurrency(reserve.balance, reserve.currency)}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Add New Reserve Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showAddModal}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-5">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-xl font-bold">New Cash Reserve</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Icon name="xmark.circle.fill" size={24} color="#9ca3af" />
              </TouchableOpacity>
            </View>

            {/* Reserve Name */}
            <Text className="font-medium mb-1">Name</Text>
            <TextInput
              className="border border-gray-300 rounded-lg p-2 mb-4"
              placeholder="Enter name"
              value={newReserve.name}
              onChangeText={(text) => setNewReserve({...newReserve, name: text})}
            />

            {/* Reserve Type */}
            <Text className="font-medium mb-2">Type</Text>
            <View className="flex-row flex-wrap mb-4">
              {typeOptions.map(option => (
                <TouchableOpacity 
                  key={option.value}
                  className={`py-2 px-4 mr-2 mb-2 rounded-lg ${newReserve.type === option.value ? 'bg-green-500' : 'bg-gray-200'}`}
                  onPress={() => setNewReserve({...newReserve, type: option.value})}
                >
                  <Text className={`${newReserve.type === option.value ? 'text-white' : 'text-gray-800'}`}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Currency */}
            <Text className="font-medium mb-2">Currency</Text>
            <View className="flex-row flex-wrap mb-4">
              {currencyOptions.map(option => (
                <TouchableOpacity 
                  key={option.value}
                  className={`py-2 px-4 mr-2 mb-2 rounded-lg ${newReserve.currency === option.value ? 'bg-green-500' : 'bg-gray-200'}`}
                  onPress={() => setNewReserve({...newReserve, currency: option.value})}
                >
                  <Text className={`${newReserve.currency === option.value ? 'text-white' : 'text-gray-800'}`}>
                    {option.value}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Balance Amount */}
            <Text className="font-medium mb-1">Balance Amount</Text>
            <TextInput
              className="border border-gray-300 rounded-lg p-2 mb-4"
              placeholder="Enter amount"
              keyboardType="numeric"
              value={newReserve.balance}
              onChangeText={(text) => setNewReserve({...newReserve, balance: text})}
            />

            {/* Color Palette */}
            <Text className="font-medium mb-2">Color</Text>
            <View className="flex-row flex-wrap mb-4">
              {colorOptions.map(color => (
                <TouchableOpacity 
                  key={color.value}
                  style={{ backgroundColor: color.hex }}
                  className={`w-10 h-10 rounded-full mr-3 mb-2 ${newReserve.color === color.value ? 'border-2 border-black' : ''}`}
                  onPress={() => setNewReserve({...newReserve, color: color.value})}
                />
              ))}
            </View>

            {/* Icon Selection */}
            <Text className="font-medium mb-2">Icon</Text>
            <View className="flex-row flex-wrap mb-6">
              {iconOptions.map(icon => (
                <TouchableOpacity 
                  key={icon.value}
                  style={{ backgroundColor: colorOptions.find(c => c.value === newReserve.color)?.hex + '20' }}
                  className={`w-12 h-12 rounded-lg mr-3 mb-2 items-center justify-center ${newReserve.icon === icon.value ? 'border-2 border-black' : ''}`}
                  onPress={() => setNewReserve({...newReserve, icon: icon.value})}
                >
                  <Icon 
                    name={icon.value} 
                    size={24} 
                    color={colorOptions.find(c => c.value === newReserve.color)?.hex ?? '#000000'} 
                  />
                </TouchableOpacity>
              ))}
            </View>

            {/* Add Button */}
            <TouchableOpacity 
              className="bg-green-500 py-3 rounded-lg items-center"
              onPress={handleAddReserve}
            >
              <Text className="text-white font-bold text-lg">Add Reserve</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
