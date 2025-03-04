import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Modal, Alert } from 'react-native';
import { Icon } from '@/components/ui/Icon';
import { formatCurrency } from '@/utils/currency';
import { createBudget, getBudgets, deleteBudget, getCashReserves, Budget as ApiBudget, updateBudget } from '@/utils/api';
import { showSuccessToast, showErrorToast } from '@/utils/toast';

interface CashReserve {
  _id: string;
  name: string;
  currency: string;
}

interface Budget extends Omit<ApiBudget, 'cashReserveId'> {
  cashReserveId: CashReserve;
}

export default function BudgetsScreen() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [reserves, setReserves] = useState<CashReserve[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [newBudget, setNewBudget] = useState<{
    name: string;
    category: string;
    amount: string;
    cycle: 'daily' | 'weekly' | 'monthly';
    cashReserveId: string;
  }>({
    name: '',
    category: '',
    amount: '',
    cycle: 'monthly',
    cashReserveId: ''
  });
  const [editingBudget, setEditingBudget] = useState<{
    name: string;
    category: string;
    amount: string;
    cycle: 'daily' | 'weekly' | 'monthly';
    cashReserveId: string;
  }>({
    name: '',
    category: '',
    amount: '',
    cycle: 'monthly',
    cashReserveId: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [budgetsData, reservesData] = await Promise.all([
        getBudgets(),
        getCashReserves()
      ]);
      
      // Transform the API response to match our component's Budget interface
      const transformedBudgets = budgetsData.map(budget => ({
        ...budget,
        cashReserveId: typeof budget.cashReserveId === 'string' 
          ? reservesData.find((r: CashReserve) => r._id === budget.cashReserveId) || {
              _id: budget.cashReserveId,
              name: 'Unknown',
              currency: 'FCFA'
            }
          : budget.cashReserveId
      }));
      
      setBudgets(transformedBudgets);
      setReserves(reservesData);
    } catch (error) {
      showErrorToast('Error', 'Failed to load data');
    }
  };

  const handleAddBudget = async () => {
    try {
      await createBudget({
        ...newBudget,
        amount: parseFloat(newBudget.amount)
      });
      await loadData();
      setShowAddModal(false);
      showSuccessToast('Success', 'Budget added successfully');
      setNewBudget({
        name: '',
        category: '',
        amount: '',
        cycle: 'monthly',
        cashReserveId: ''
      });
    } catch (error) {
      showErrorToast('Error', 'Failed to add budget');
    }
  };

  const handleEditBudget = async () => {
    try {
      if (!selectedBudget?._id) return;
      
      await updateBudget(selectedBudget._id, {
        ...editingBudget,
        amount: parseFloat(editingBudget.amount)
      });
      
      await loadData();
      setShowEditModal(false);
      showSuccessToast('Success', 'Budget updated successfully');
    } catch (error) {
      showErrorToast('Error', 'Failed to update budget');
    }
  };

  const handleDeleteBudget = async (id: string) => {
    Alert.alert(
      'Delete Budget',
      'Are you sure you want to delete this budget?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteBudget(id);
              await loadData();
              showSuccessToast('Success', 'Budget deleted successfully');
            } catch (error) {
              showErrorToast('Error', 'Failed to delete budget');
            }
          }
        }
      ]
    );
  };

  const openEditModal = (budget: Budget) => {
    setSelectedBudget(budget);
    setEditingBudget({
      name: budget.name,
      category: budget.category,
      amount: budget.amount.toString(),
      cycle: budget.cycle,
      cashReserveId: budget.cashReserveId._id
    });
    setShowEditModal(true);
  };

  const categoryOptions = [
    'Food', 'Transport', 'Entertainment', 'Shopping', 
    'Bills', 'Health', 'Education', 'Other'
  ];

  const cycleOptions: Array<{value: 'daily' | 'weekly' | 'monthly'; label: string}> = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' }
  ];

  const getBudgetProgress = (budget: Budget) => {
    return Math.min((budget.spent / budget.amount) * 100, 100);
  };

  const renderBudgetCard = (budget: Budget) => (
    <View key={budget._id} className="bg-white rounded-lg shadow-md p-4 mb-3">
      <View className="flex-row justify-between items-center mb-2">
        <View>
          <Text className="text-lg font-semibold">{budget.name}</Text>
          <Text className="text-gray-500">{budget.category}</Text>
        </View>
        <View className="flex-row">
          <TouchableOpacity 
            onPress={() => openEditModal(budget)}
            className="p-2 mr-2"
          >
            <Icon name="pencil" size={20} color="#9333ea" />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => handleDeleteBudget(budget._id!)}
            className="p-2"
          >
            <Icon name="trash" size={20} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>

      <View className="mb-2">
        <Text className="text-gray-600 mb-1">
          {formatCurrency(budget.spent, budget.cashReserveId.currency)} of {' '}
          {formatCurrency(budget.amount, budget.cashReserveId.currency)}
        </Text>
        <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <View 
            className="h-full rounded-full"
            style={{
              width: `${getBudgetProgress(budget)}%`,
              backgroundColor: getBudgetProgress(budget) > 90 ? '#ef4444' : '#10b981'
            }}
          />
        </View>
      </View>

      <View className="flex-row justify-between items-center">
        <Text className="text-gray-500">{budget.cashReserveId.name}</Text>
        <Text className="text-gray-500 capitalize">{budget.cycle}</Text>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-gray-50">
      <View className="pt-12 pb-4 px-4 bg-purple-500">
        <View className="flex-row justify-between items-center">
          <Text className="text-2xl font-bold text-white">Budgets</Text>
          <TouchableOpacity 
            className="bg-white w-9 h-9 rounded-full items-center justify-center"
            onPress={() => setShowAddModal(true)}
          >
            <Icon name="plus" size={20} color="#9333ea" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1 p-4">
        {budgets.map(renderBudgetCard)}
      </ScrollView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={showAddModal}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-5">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-xl font-bold">New Budget</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Icon name="xmark.circle.fill" size={24} color="#9ca3af" />
              </TouchableOpacity>
            </View>

            <TextInput
              className="border border-gray-300 rounded-lg p-2 mb-4"
              placeholder="Budget Name"
              value={newBudget.name}
              onChangeText={(text) => setNewBudget({...newBudget, name: text})}
            />

            <Text className="font-medium mb-2">Category</Text>
            <View className="flex-row flex-wrap mb-4">
              {categoryOptions.map(category => (
                <TouchableOpacity 
                  key={category}
                  className={`py-2 px-4 mr-2 mb-2 rounded-lg ${
                    newBudget.category === category ? 'bg-purple-500' : 'bg-gray-200'
                  }`}
                  onPress={() => setNewBudget({...newBudget, category})}
                >
                  <Text className={newBudget.category === category ? 'text-white' : 'text-gray-800'}>
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              className="border border-gray-300 rounded-lg p-2 mb-4"
              placeholder="Amount"
              keyboardType="numeric"
              value={newBudget.amount}
              onChangeText={(text) => setNewBudget({...newBudget, amount: text})}
            />

            <Text className="font-medium mb-2">Cash Reserve</Text>
            <View className="flex-row flex-wrap mb-4">
              {reserves.map(reserve => (
                <TouchableOpacity 
                  key={reserve._id}
                  className={`py-2 px-4 mr-2 mb-2 rounded-lg ${
                    newBudget.cashReserveId === reserve._id ? 'bg-purple-500' : 'bg-gray-200'
                  }`}
                  onPress={() => setNewBudget({...newBudget, cashReserveId: reserve._id})}
                >
                  <Text className={newBudget.cashReserveId === reserve._id ? 'text-white' : 'text-gray-800'}>
                    {reserve.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text className="font-medium mb-2">Cycle</Text>
            <View className="flex-row flex-wrap mb-6">
              {cycleOptions.map(option => (
                <TouchableOpacity 
                  key={option.value}
                  className={`py-2 px-4 mr-2 mb-2 rounded-lg ${
                    newBudget.cycle === option.value ? 'bg-purple-500' : 'bg-gray-200'
                  }`}
                  onPress={() => setNewBudget({...newBudget, cycle: option.value})}
                >
                  <Text className={newBudget.cycle === option.value ? 'text-white' : 'text-gray-800'}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity 
              className="bg-purple-500 py-3 rounded-lg items-center"
              onPress={handleAddBudget}
            >
              <Text className="text-white font-bold text-lg">Add Budget</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        visible={showEditModal}
        onRequestClose={() => setShowEditModal(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-5">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-xl font-bold">Edit Budget</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Icon name="xmark.circle.fill" size={24} color="#9ca3af" />
              </TouchableOpacity>
            </View>

            <TextInput
              className="border border-gray-300 rounded-lg p-2 mb-4"
              placeholder="Budget Name"
              value={editingBudget.name}
              onChangeText={(text) => setEditingBudget({...editingBudget, name: text})}
            />

            <Text className="font-medium mb-2">Category</Text>
            <View className="flex-row flex-wrap mb-4">
              {categoryOptions.map(category => (
                <TouchableOpacity 
                  key={category}
                  className={`py-2 px-4 mr-2 mb-2 rounded-lg ${
                    editingBudget.category === category ? 'bg-purple-500' : 'bg-gray-200'
                  }`}
                  onPress={() => setEditingBudget({...editingBudget, category})}
                >
                  <Text className={editingBudget.category === category ? 'text-white' : 'text-gray-800'}>
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              className="border border-gray-300 rounded-lg p-2 mb-4"
              placeholder="Amount"
              keyboardType="numeric"
              value={editingBudget.amount}
              onChangeText={(text) => setEditingBudget({...editingBudget, amount: text})}
            />

            <Text className="font-medium mb-2">Cash Reserve</Text>
            <View className="flex-row flex-wrap mb-4">
              {reserves.map(reserve => (
                <TouchableOpacity 
                  key={reserve._id}
                  className={`py-2 px-4 mr-2 mb-2 rounded-lg ${
                    editingBudget.cashReserveId === reserve._id ? 'bg-purple-500' : 'bg-gray-200'
                  }`}
                  onPress={() => setEditingBudget({...editingBudget, cashReserveId: reserve._id})}
                >
                  <Text className={editingBudget.cashReserveId === reserve._id ? 'text-white' : 'text-gray-800'}>
                    {reserve.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text className="font-medium mb-2">Cycle</Text>
            <View className="flex-row flex-wrap mb-6">
              {cycleOptions.map(option => (
                <TouchableOpacity 
                  key={option.value}
                  className={`py-2 px-4 mr-2 mb-2 rounded-lg ${
                    editingBudget.cycle === option.value ? 'bg-purple-500' : 'bg-gray-200'
                  }`}
                  onPress={() => setEditingBudget({...editingBudget, cycle: option.value})}
                >
                  <Text className={editingBudget.cycle === option.value ? 'text-white' : 'text-gray-800'}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity 
              className="bg-purple-500 py-3 rounded-lg items-center"
              onPress={handleEditBudget}
            >
              <Text className="text-white font-bold text-lg">Update Budget</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
