import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, TextInput } from 'react-native';
import { Icon } from '@/components/ui/Icon';
import DateTimePicker, { Event } from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { createTransaction, getTransactions, getCashReserves } from '@/utils/api';
import { showSuccessToast, showErrorToast } from '@/utils/toast';
import { formatCurrency, getCurrencySymbol } from '@/utils/currency';
import type { Transaction } from '@/utils/api';
import { categories, CategoryType } from '@/constants/categories';
import { useLocalSearchParams } from 'expo-router';

interface CashReserve {
  _id: string;
  name: string;
  currency: string;
  // ...other properties...
}

export default function RecordsScreen() {
  const params = useLocalSearchParams();
  const [records, setRecords] = useState<Transaction[]>([]);
  const [cashReserves, setCashReserves] = useState<CashReserve[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [transactionType, setTransactionType] = useState<CategoryType>('expense'); // 'expense', 'income', 'transfer'
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // Form state for new transaction
  const [transaction, setTransaction] = useState({
    title: '',
    amount: '',
    category: '',
    cashReserve: '',
    targetReserve: '', // For transfers
    date: new Date(),
    notes: '',
  });

  useEffect(() => {
    loadData();
    // Check URL parameters and open modal if needed
    if (params.openModal === 'true') {
      setShowAddModal(true);
      if (params.type) {
        setTransactionType(params.type as CategoryType);
      }
    }
  }, [params.openModal, params.type]);

  const loadData = async () => {
    try {
      const [transactionsData, reservesData] = await Promise.all([
        getTransactions(),
        getCashReserves()
      ]);
      setRecords(transactionsData);
      setCashReserves(reservesData);
    } catch (error) {
      showErrorToast('Error', 'Failed to load data');
    }
  };

  const handleDateChange = (_event: Event, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setTransaction({ ...transaction, date: selectedDate });
    }
  };

  const resetForm = () => {
    setTransaction({
      title: '',
      amount: '',
      category: '',
      cashReserve: '',
      targetReserve: '',
      date: new Date(),
      notes: '',
    });
    setTransactionType('expense');
  };

  const handleAddTransaction = async () => {
    try {
      // Validate required fields
      if (!transaction.title || !transaction.amount || !transaction.cashReserve || !transaction.category) {
        showErrorToast('Error', 'Please fill in all required fields');
        return;
      }

      // Additional validation for transfers
      if (transactionType === 'transfer') {
        if (!transaction.targetReserve) {
          showErrorToast('Error', 'Please select a target account');
          return;
        }
        
        // Check if source and target are different
        if (transaction.cashReserve === transaction.targetReserve) {
          showErrorToast('Error', 'Source and target accounts must be different');
          return;
        }
      }

      const amount = parseFloat(transaction.amount);
      if (isNaN(amount) || amount <= 0) {
        showErrorToast('Error', 'Please enter a valid amount');
        return;
      }

      const transactionData = {
        title: transaction.title,
        type: transactionType,
        amount,
        category: transaction.category,
        cashReserveId: transaction.cashReserve,
        date: transaction.date,
        notes: transaction.notes || undefined
      };

      // Add targetReserveId only for transfers
      if (transactionType === 'transfer' && transaction.targetReserve) {
        Object.assign(transactionData, { targetReserveId: transaction.targetReserve });
      }

      console.log('Creating transaction:', transactionData);

      await createTransaction(transactionData);
      await loadData();
      setShowAddModal(false);
      showSuccessToast('Success', 'Transaction added successfully');
      resetForm();
    } catch (err) {
      console.error('Add transaction error:', err);
      const error = err as Error;
      showErrorToast('Error', error.message || 'Failed to add transaction');
    }
  };

  const getReserveCurrency = (reserveId: string): string => {
    const reserve = cashReserves.find(r => r._id === reserveId);
    return reserve ? reserve.currency : 'USD';
  };

  // Helper function to safely access nested properties
  const safelyGetCurrency = (record: Transaction): string => {
    if (!record.cashReserveId) return 'USD';
    return typeof record.cashReserveId === 'object' && record.cashReserveId !== null 
      ? (record.cashReserveId.currency || 'USD')
      : 'USD';
  };

  // Helper function to safely get reserve name
  const safelyGetReserveName = (reserveId: any): string => {
    if (!reserveId) return 'Unknown Account';
    return typeof reserveId === 'object' && reserveId !== null 
      ? (reserveId.name || 'Unknown Account') 
      : 'Unknown Account';
  };

  return (
    <View className="flex-1 bg-gray-50">
      <View className="pt-12 pb-4 px-4 bg-blue-500">
        <View className="flex-row justify-between items-center">
          <Text className="text-2xl font-bold text-white">Transactions</Text>
          <TouchableOpacity 
            className="bg-white w-9 h-9 rounded-full items-center justify-center"
            onPress={() => {
              resetForm();
              setShowAddModal(true);
            }}
          >
            <Icon name="plus" size={20} color="#3b82f6" />
          </TouchableOpacity>
        </View>
      </View>
      
      <ScrollView className="flex-1 px-4 pt-4">
        {records.map(record => (
          <View key={record._id} className={`bg-white rounded-lg shadow-md p-4 mb-3 border-l-4 ${
            record.type === 'income' ? 'border-green-500' : 
            record.type === 'transfer' ? 'border-blue-500' : 
            'border-red-500'
          }`}>
            <View className="flex-row justify-between">
              <View>
                <Text className="text-lg font-semibold">{record.title}</Text>
                <View className="flex-row items-center">
                  <Text className="text-gray-500">{record.category}</Text>
                  {record.targetReserveId && (
                    <Text className="text-gray-500"> • To: {safelyGetReserveName(record.targetReserveId)}</Text>
                  )}
                  <Text className="text-gray-500"> • {format(new Date(record.date), 'MMM dd')}</Text>
                </View>
                <Text className="text-gray-600 text-sm">{safelyGetReserveName(record.cashReserveId)}</Text>
              </View>
              <Text className={`text-lg font-bold ${
                record.type === 'income' ? 'text-green-600' : 
                record.type === 'expense' ? 'text-red-600' : 
                'text-blue-600'
              }`}>
                {record.type === 'income' ? '+' : ''}
                {formatCurrency(record.amount, safelyGetCurrency(record))}
              </Text>
            </View>
          </View>
        ))}
        
        <Text className="text-center text-gray-400 my-4">• End of Records •</Text>
      </ScrollView>

      {/* Add Transaction Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showAddModal}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-5">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-xl font-bold">Add Transaction</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Icon name="xmark.circle.fill" size={24} color="#9ca3af" />
              </TouchableOpacity>
            </View>

            {/* Transaction Type Selection */}
            <View className="flex-row mb-4 border border-gray-200 rounded-lg overflow-hidden">
              <TouchableOpacity 
                className={`flex-1 py-3 ${transactionType === 'expense' ? 'bg-red-500' : 'bg-white'}`}
                onPress={() => setTransactionType('expense')}
              >
                <Text className={`text-center font-medium ${transactionType === 'expense' ? 'text-white' : 'text-gray-800'}`}>
                  Expense
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                className={`flex-1 py-3 ${transactionType === 'income' ? 'bg-green-500' : 'bg-white'}`}
                onPress={() => setTransactionType('income')}
              >
                <Text className={`text-center font-medium ${transactionType === 'income' ? 'text-white' : 'text-gray-800'}`}>
                  Income
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                className={`flex-1 py-3 ${transactionType === 'transfer' ? 'bg-blue-500' : 'bg-white'}`}
                onPress={() => setTransactionType('transfer')}
              >
                <Text className={`text-center font-medium ${transactionType === 'transfer' ? 'text-white' : 'text-gray-800'}`}>
                  Transfer
                </Text>
              </TouchableOpacity>
            </View>

            {/* Title */}
            <Text className="font-medium mb-1">Title</Text>
            <TextInput
              className="border border-gray-300 rounded-lg p-2 mb-4"
              placeholder={`${transactionType === 'expense' ? 'e.g., Groceries' : 
                transactionType === 'income' ? 'e.g., Salary' : 'e.g., To Savings'}`}
              value={transaction.title}
              onChangeText={(text) => setTransaction({...transaction, title: text})}
            />

            {/* Amount */}
            <Text className="font-medium mb-1">Amount</Text>
            <View className="flex-row items-center border border-gray-300 rounded-lg mb-4">
              <Text className="text-gray-500 pl-3">
                {transaction.cashReserve ? getCurrencySymbol(getReserveCurrency(transaction.cashReserve)) : '$'}
              </Text>
              <TextInput
                className="flex-1 p-2"
                placeholder="0.00"
                keyboardType="numeric"
                value={transaction.amount}
                onChangeText={(text) => setTransaction({...transaction, amount: text})}
              />
            </View>

            {/* Cash Reserve */}
            <Text className="font-medium mb-2">{transactionType === 'transfer' ? 'From Account' : 'Cash Reserve'}</Text>
            <View className="flex-row flex-wrap mb-4">
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {cashReserves.map(reserve => (
                  <TouchableOpacity 
                    key={reserve._id}
                    className={`py-2 px-4 mr-2 mb-2 rounded-lg ${
                      transaction.cashReserve === reserve._id 
                        ? transactionType === 'expense' ? 'bg-red-500' 
                        : transactionType === 'income' ? 'bg-green-500' 
                        : 'bg-blue-500' 
                        : 'bg-gray-200'
                    }`}
                    onPress={() => setTransaction({...transaction, cashReserve: reserve._id})}
                  >
                    <Text className={`${transaction.cashReserve === reserve._id ? 'text-white' : 'text-gray-800'}`}>
                      {reserve.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Target Reserve (Only for transfers) */}
            {transactionType === 'transfer' && (
              <>
                <Text className="font-medium mb-2">To Account</Text>
                <View className="flex-row flex-wrap mb-4">
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {cashReserves.filter(reserve => reserve._id !== transaction.cashReserve).map(reserve => (
                      <TouchableOpacity 
                        key={reserve._id}
                        className={`py-2 px-4 mr-2 mb-2 rounded-lg ${
                          transaction.targetReserve === reserve._id ? 'bg-blue-500' : 'bg-gray-200'
                        }`}
                        onPress={() => setTransaction({...transaction, targetReserve: reserve._id})}
                      >
                        <Text className={`${transaction.targetReserve === reserve._id ? 'text-white' : 'text-gray-800'}`}>
                          {reserve.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </>
            )}

            {/* Category */}
            <Text className="font-medium mb-2">Category</Text>
            <View className="flex-row flex-wrap mb-4">
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {(categories[transactionType] || []).map(category => (
                  <TouchableOpacity 
                    key={category.id}
                    style={{ backgroundColor: transaction.category === category.name ? category.color : '#f3f4f6' }}
                    className={`py-2 px-4 mr-2 rounded-lg flex-row items-center`}
                    onPress={() => setTransaction({...transaction, category: category.name})}
                  >
                    <View className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: category.color }} />
                    <Text className={transaction.category === category.name ? 'text-white' : 'text-gray-800'}>
                      {category.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Date */}
            <Text className="font-medium mb-1">Date</Text>
            <TouchableOpacity 
              onPress={() => setShowDatePicker(true)}
              className="border border-gray-300 rounded-lg p-2 mb-4"
            >
              <Text>{format(transaction.date, 'MMM dd, yyyy')}</Text>
            </TouchableOpacity>
            
            {showDatePicker && (
              <DateTimePicker
                value={transaction.date}
                mode="date"
                display="default"
                onChange={handleDateChange}
              />
            )}

            {/* Notes (optional) */}
            <Text className="font-medium mb-1">Notes (Optional)</Text>
            <TextInput
              className="border border-gray-300 rounded-lg p-2 mb-6"
              placeholder="Add any additional details"
              multiline
              numberOfLines={2}
              value={transaction.notes}
              onChangeText={(text) => setTransaction({...transaction, notes: text})}
            />

            {/* Save Button */}
            <TouchableOpacity 
              className={`py-3 rounded-lg items-center ${
                transactionType === 'expense' ? 'bg-red-500' : 
                transactionType === 'income' ? 'bg-green-500' : 
                'bg-blue-500'
              }`}
              onPress={handleAddTransaction}
            >
              <Text className="text-white font-bold text-lg">
                {transactionType === 'expense' ? 'Add Expense' : 
                 transactionType === 'income' ? 'Add Income' : 
                 'Make Transfer'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
