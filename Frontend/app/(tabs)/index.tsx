import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { getCashReserves, getTransactions } from '@/utils/api';
import { useRouter } from 'expo-router';
import { formatCurrency, convertToFCFA, convertFromFCFA, groupReservesByCurrency } from '@/utils/currency';
import { Transaction, CashReserve, CurrencyTotals, SpendingBreakdown } from '@/types';

export default function HomeScreen() {
  const router = useRouter();
  const [totalBalance, setTotalBalance] = useState<number>(0);
  const [monthlyIncome, setMonthlyIncome] = useState<number>(0);
  const [monthlyExpenses, setMonthlyExpenses] = useState<number>(0);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [spendingBreakdown, setSpendingBreakdown] = useState<SpendingBreakdown>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [reserves, setReserves] = useState<CashReserve[]>([]);
  const [currencyTotals, setCurrencyTotals] = useState<CurrencyTotals>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [reservesData, transactions] = await Promise.all([
        getCashReserves(),
        getTransactions()
      ]);

      setReserves(reservesData);
      
      // Group balances by currency
      const currencyGroups = groupReservesByCurrency(reservesData);
      setCurrencyTotals(currencyGroups);

      // Calculate total balance in FCFA
      const total = reservesData.reduce((sum: number, reserve: CashReserve) => {
        return sum + convertToFCFA(reserve.balance, reserve.currency);
      }, 0);
      setTotalBalance(total);

      // Get current month's transactions
      const now = new Date();
      const currentMonthTransactions = transactions.filter((t: Transaction) => {
        const transactionDate = new Date(t.date);
        return transactionDate.getMonth() === now.getMonth() &&
               transactionDate.getFullYear() === now.getFullYear();
      });

      // Calculate monthly income and expenses in FCFA
      const { income, expenses } = currentMonthTransactions.reduce((acc: { income: number, expenses: number }, t: Transaction) => {
        const amount = convertToFCFA(t.amount, t.cashReserveId.currency);
        if (t.type === 'income') acc.income += amount;
        if (t.type === 'expense') acc.expenses += amount;
        return acc;
      }, { income: 0, expenses: 0 });

      setMonthlyIncome(income);
      setMonthlyExpenses(expenses);

      // Calculate spending breakdown
      const breakdown = currentMonthTransactions
        .filter((t: Transaction) => t.type === 'expense')
        .reduce((acc: SpendingBreakdown, t: Transaction) => {
          acc[t.category] = (acc[t.category] || 0) + t.amount;
          return acc;
        }, {} as SpendingBreakdown);
      setSpendingBreakdown(breakdown);

      // Set recent transactions
      const recent = transactions
        .sort((a: Transaction, b: Transaction) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        )
        .slice(0, 4);
      setRecentTransactions(recent);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getSpendingBreakdownPercentage = (amount: number): string => {
    return ((amount / monthlyExpenses) * 100).toFixed(0);
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="pt-12 pb-6 px-5 bg-blue-600">
        <Text className="text-white text-xl font-medium">Welcome back</Text>
        <Text className="text-white text-3xl font-bold mt-1">Dashboard</Text>
      </View>

      {/* Balance Card */}
      <View className="px-5 -mt-5">
        <View className="bg-white rounded-xl shadow-md p-5">
          <Text className="text-gray-500 font-medium">Total Balance (FCFA)</Text>
          <Text className="text-3xl font-bold mt-1">{formatCurrency(totalBalance, 'FCFA')}</Text>
          
          {/* Currency breakdown */}
          <View className="mt-2">
            {Object.entries(currencyTotals).map(([currency, amount]: [string, number]) => (
              <Text key={currency} className="text-gray-600">
                {formatCurrency(amount as number, currency)}
              </Text>
            ))}
          </View>
          
          <View className="flex-row justify-between mt-4">
            <View className="px-6 py-3 bg-green-100 rounded-lg flex-1 mr-2 items-center">
              <Text className="text-green-800 font-medium">Income (FCFA)</Text>
              <Text className="text-green-800 font-bold text-xl">+{formatCurrency(monthlyIncome, 'FCFA')}</Text>
            </View>
            <View className="px-6 py-3 bg-red-100 rounded-lg flex-1 ml-2 items-center">
              <Text className="text-red-800 font-medium">Expenses (FCFA)</Text>
              <Text className="text-red-800 font-bold text-xl">-{formatCurrency(monthlyExpenses, 'FCFA')}</Text>
            </View>
          </View>
          
          <View className="mt-4 p-2 bg-blue-50 rounded-lg">
            <View className="flex-row justify-between">
              <Text className="text-blue-800 font-medium">Net Balance</Text>
              <Text className="text-blue-800 font-bold">+{formatCurrency(monthlyIncome - monthlyExpenses, 'FCFA')}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Monthly Overview */}
      <View className="px-5 mt-6">
        <Text className="text-xl font-bold mb-3">Monthly Overview</Text>
        <View className="bg-white rounded-xl shadow-md p-5">
          <View className="flex-row justify-between mb-1">
            <Text className="text-gray-600">Spent</Text>
            <Text className="font-bold">{formatCurrency(monthlyExpenses, 'FCFA')}</Text>
          </View>
          
          {/* Spending breakdown */}
          <View className="mt-4">
            <Text className="text-gray-600 mb-2">Spending breakdown</Text>
            
            {Object.entries(spendingBreakdown).map(([category, amount]: [string, number], index: number) => (
              <View key={category} className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center">
                  <View className={`w-3 h-3 rounded-full bg-${['blue', 'green', 'purple', 'yellow'][index % 4]}-500 mr-2`} />
                  <Text>{category}</Text>
                </View>
                <Text className="font-medium">
                  {formatCurrency(amount, 'FCFA')} ({getSpendingBreakdownPercentage(amount)}%)
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <View className="px-5 mt-6">
        <Text className="text-xl font-bold mb-3">Quick Actions</Text>
        
        <View className="flex-row justify-between">
          <TouchableOpacity 
            className="bg-blue-600 rounded-xl p-4 flex-1 mr-2 items-center"
            onPress={() => router.push('/(tabs)/records?openModal=true&type=expense')}
          >
            <Text className="text-white font-bold">Add Expense</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            className="bg-green-600 rounded-xl p-4 flex-1 ml-2 items-center"
            onPress={() => router.push('/(tabs)/records?openModal=true&type=income')}
          >
            <Text className="text-white font-bold">Add Income</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Transactions */}
      <View className="px-5 mt-6 mb-6">
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-xl font-bold">Recent Transactions</Text>
          <TouchableOpacity onPress={() => router.push('/')}>
            <Text className="text-blue-600">See all</Text>
          </TouchableOpacity>
        </View>

        {recentTransactions.map(transaction => (
          <View key={transaction._id} className="bg-white rounded-xl shadow-sm p-4 mb-3 flex-row justify-between items-center">
            <View>
              <Text className="font-semibold text-base">{transaction.title}</Text>
              <Text className="text-gray-500 text-sm">
                {formatDate(transaction.date)} · {transaction.category}
              </Text>
            </View>
            <Text className={`font-bold ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
              {transaction.type === 'income' ? '+' : '-'}
              {formatCurrency(transaction.amount, transaction.cashReserveId.currency)}
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
