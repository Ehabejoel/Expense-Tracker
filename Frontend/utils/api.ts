import { LoginData, RegisterData, AuthResponse, User } from '@/types/auth';
import { authStore } from '@/utils/authStore';
import { API_URL } from '@/config/api';

export const login = async (data: LoginData): Promise<AuthResponse> => {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    throw new Error('Login failed');
  }
  
  return response.json();
};

export const register = async (data: RegisterData): Promise<AuthResponse> => {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Registration failed');
  }

  return response.json();
};

export const getUserProfile = async (): Promise<User> => {
  const token = await authStore.getToken();
  const response = await fetch(`${API_URL}/auth/me`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch user profile');
  }

  return response.json();
};

export const createCashReserve = async (data: {
  name: string;
  type: string;
  currency: string;
  balance: number;
  color: string;
  icon: string;
}) => {
  const token = await authStore.getToken();
  const response = await fetch(`${API_URL}/reserves`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create cash reserve');
  }

  return response.json();
};

export const getCashReserves = async () => {
  const token = await authStore.getToken();
  const response = await fetch(`${API_URL}/reserves`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch cash reserves');
  }

  return response.json();
};

export interface TransactionBase {
  title: string;
  type: 'expense' | 'income' | 'transfer';
  amount: number;
  category: string;
  cashReserveId: string;
  date: Date;
  notes?: string;
}

export interface TransactionWithTarget extends TransactionBase {
  type: 'transfer';
  targetReserveId: string;
}

export type TransactionCreate = TransactionBase | TransactionWithTarget;

export interface TransactionResponse extends Omit<TransactionBase, 'cashReserveId'> {
  _id: string;
  cashReserveId: {
    _id: string;
    name: string;
    currency: string;
    balance?: number; // Add balance to handle updated response
  };
  targetReserveId?: {
    _id: string;
    name: string;
    currency: string;
    balance?: number; // Add balance to handle updated response
  };
}

export const createTransaction = async (data: TransactionCreate): Promise<TransactionResponse> => {
  const token = await authStore.getToken();
  try {
    const response = await fetch(`${API_URL}/transactions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Transaction creation failed:', error);
      throw new Error(error.message || 'Failed to create transaction');
    }

    return response.json();
  } catch (error) {
    console.error('Transaction creation error:', error);
    throw error;
  }
};

export const getTransactions = async () => {
  const token = await authStore.getToken();
  const response = await fetch(`${API_URL}/transactions`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch transactions');
  }

  return response.json();
};

export const updateTransaction = async (id: string, data: TransactionCreate): Promise<TransactionResponse> => {
  const token = await authStore.getToken();
  try {
    const response = await fetch(`${API_URL}/transactions/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Transaction update failed:', error);
      throw new Error(error.message || 'Failed to update transaction');
    }

    return response.json();
  } catch (error) {
    console.error('Transaction update error:', error);
    throw error;
  }
};

export const deleteTransaction = async (id: string): Promise<void> => {
  const token = await authStore.getToken();
  try {
    const response = await fetch(`${API_URL}/transactions/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Transaction deletion failed:', error);
      throw new Error(error.message || 'Failed to delete transaction');
    }
  } catch (error) {
    console.error('Transaction deletion error:', error);
    throw error;
  }
};

export interface Budget {
  _id?: string;
  name: string;
  category: string;
  amount: number;
  spent: number;
  cycle: 'daily' | 'weekly' | 'monthly';
  cashReserveId: string;
}

export const createBudget = async (data: Omit<Budget, '_id' | 'spent'>): Promise<Budget> => {
  const token = await authStore.getToken();
  const response = await fetch(`${API_URL}/budgets`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create budget');
  }

  return response.json();
};

export const getBudgets = async (): Promise<Budget[]> => {
  const token = await authStore.getToken();
  const response = await fetch(`${API_URL}/budgets`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch budgets');
  }

  return response.json();
};

export const updateBudget = async (id: string, data: Partial<Budget>): Promise<Budget> => {
  const token = await authStore.getToken();
  const response = await fetch(`${API_URL}/budgets/${id}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update budget');
  }

  return response.json();
};

export const deleteBudget = async (id: string): Promise<void> => {
  const token = await authStore.getToken();
  const response = await fetch(`${API_URL}/budgets/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete budget');
  }
};

export interface Reminder {
  _id?: string;
  title: string;
  amount: number;
  type: 'expense' | 'income';
  category: string;
  cashReserveId: string;
  date: Date;
  time: string;
  cycle: 'daily' | 'weekly' | 'monthly' | 'yearly';
  notes?: string;
  isActive: boolean;
}

export const createReminder = async (data: Omit<Reminder, '_id' | 'isActive'>): Promise<Reminder> => {
  const token = await authStore.getToken();
  const response = await fetch(`${API_URL}/reminders`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create reminder');
  }

  return response.json();
};

export const getReminders = async (): Promise<Reminder[]> => {
  const token = await authStore.getToken();
  const response = await fetch(`${API_URL}/reminders`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch reminders');
  }

  return response.json();
};

export const updateReminder = async (id: string, data: Partial<Reminder>): Promise<Reminder> => {
  const token = await authStore.getToken();
  const response = await fetch(`${API_URL}/reminders/${id}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update reminder');
  }

  return response.json();
};

export const deleteReminder = async (id: string): Promise<void> => {
  const token = await authStore.getToken();
  const response = await fetch(`${API_URL}/reminders/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete reminder');
  }
};

export const handleReminderAction = async (reminderId: string, action: 'create' | 'postpone'): Promise<void> => {
  const token = await authStore.getToken();
  const response = await fetch(`${API_URL}/reminders/${reminderId}/action`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || `Failed to ${action} reminder`);
  }

  return response.json();
};
