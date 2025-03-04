export type CategoryType = 'expense' | 'income' | 'transfer';

interface Category {
  id: string;
  name: string;
  color: string;
}

export const categories: Record<CategoryType, Category[]> = {
  expense: [
    { id: 'food', name: 'Food & Dining', color: '#FF5252' },
    { id: 'transport', name: 'Transportation', color: '#FF9800' },
    { id: 'shopping', name: 'Shopping', color: '#9C27B0' },
    { id: 'bills', name: 'Bills', color: '#2196F3' },
    { id: 'entertainment', name: 'Entertainment', color: '#4CAF50' },
    { id: 'health', name: 'Health', color: '#E91E63' },
    { id: 'other', name: 'Other', color: '#607D8B' }
  ],
  income: [
    { id: 'salary', name: 'Salary', color: '#4CAF50' },
    { id: 'freelance', name: 'Freelance', color: '#2196F3' },
    { id: 'investments', name: 'Investments', color: '#FF9800' },
    { id: 'other', name: 'Other', color: '#607D8B' }
  ],
  transfer: [
    { id: 'transfer', name: 'Transfer', color: '#3B82F6' }
  ]
};
