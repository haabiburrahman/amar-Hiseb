
export interface Customer {
  id: string;
  name: string;
  phone: string;
  upazila: string;
  totalDue: number;
  createdAt: number;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  quantity: number;
  buyingPrice: number;
  createdAt: number;
}

export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  unitBuyingPrice: number;
  unitSellingPrice: number;
  totalPrice: number;
}

export interface Transaction {
  id: string;
  customerId: string;
  customerName: string;
  items: SaleItem[];
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  profit: number;
  date: number;
}

export interface PersonalTransaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  note: string;
  date: number;
}

export interface MonthlyReport {
  month: string;
  totalBuy: number;
  totalSell: number;
  totalProfit: number;
}
