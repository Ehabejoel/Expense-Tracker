export interface CashReserve {
  _id: string;
  name: string;
  balance: number;
  currency: string;
}

export interface Transaction {
  _id: string;
  title: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string;
  cashReserveId: CashReserve;
}

export interface CurrencyTotals {
  [key: string]: number;
}

export interface SpendingBreakdown {
  [category: string]: number;
}
