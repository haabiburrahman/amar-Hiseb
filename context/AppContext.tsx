import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Customer, Product, Transaction, PersonalTransaction } from '../types';
import { useAuth } from './AuthContext.tsx';
import { db } from '../lib/firebase';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  setDoc, 
  query, 
  orderBy, 
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';

interface AppContextType {
  customers: Customer[];
  products: Product[];
  transactions: Transaction[];
  personalTransactions: PersonalTransaction[];
  storeName: string;
  storeAddress: string;
  storePhone: string;
  storeLogo: string;
  invoiceColor: string;
  invoiceFont: string;
  addCustomer: (customer: Omit<Customer, 'id' | 'totalDue' | 'createdAt'>) => Promise<void>;
  updateCustomer: (id: string, updates: Partial<Customer>) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  addProduct: (product: Omit<Product, 'id' | 'createdAt'>) => Promise<void>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'date'>) => Promise<void>;
  addPersonalTransaction: (transaction: Omit<PersonalTransaction, 'id' | 'date'>) => Promise<void>;
  deletePersonalTransaction: (id: string) => Promise<void>;
  updateStoreDetails: (details: { name: string; address: string; phone: string; logo?: string; color?: string; font?: string }) => Promise<void>;
  loadDemoData: () => Promise<void>;
  clearAllData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  // Local States
  const [storeName, setStoreName] = useState('Amar Hisab');
  const [storeAddress, setStoreAddress] = useState('ঢাকা, বাংলাদেশ');
  const [storePhone, setStorePhone] = useState('০১xxxxxxxxx');
  const [storeLogo, setStoreLogo] = useState('');
  const [invoiceColor, setInvoiceColor] = useState('#4f46e5');
  const [invoiceFont, setInvoiceFont] = useState("'Hind Siliguri', sans-serif");

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [personalTransactions, setPersonalTransactions] = useState<PersonalTransaction[]>([]);

  // Setup Firestore Realtime Listeners when user is logged in
  useEffect(() => {
    if (!user) {
      setCustomers([]);
      setProducts([]);
      setTransactions([]);
      setPersonalTransactions([]);
      return;
    }

    const userPath = `users/${user.uid}`;

    // Listen to Settings
    const unsubSettings = onSnapshot(doc(db, userPath, 'config', 'settings'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setStoreName(data.name || 'Amar Hisab');
        setStoreAddress(data.address || 'ঢাকা, বাংলাদেশ');
        setStorePhone(data.phone || '০১xxxxxxxxx');
        setStoreLogo(data.logo || '');
        setInvoiceColor(data.color || '#4f46e5');
        setInvoiceFont(data.font || "'Hind Siliguri', sans-serif");
      }
    });

    // Listen to Customers
    const qCustomers = query(collection(db, userPath, 'customers'), orderBy('createdAt', 'desc'));
    const unsubCustomers = onSnapshot(qCustomers, (snapshot) => {
      setCustomers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer)));
    });

    // Listen to Products
    const qProducts = query(collection(db, userPath, 'products'), orderBy('createdAt', 'desc'));
    const unsubProducts = onSnapshot(qProducts, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
    });

    // Listen to Transactions
    const qTransactions = query(collection(db, userPath, 'transactions'), orderBy('date', 'desc'));
    const unsubTransactions = onSnapshot(qTransactions, (snapshot) => {
      setTransactions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction)));
    });

    // Listen to Personal Transactions
    const qPersonal = query(collection(db, userPath, 'personalTransactions'), orderBy('date', 'desc'));
    const unsubPersonal = onSnapshot(qPersonal, (snapshot) => {
      setPersonalTransactions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PersonalTransaction)));
    });

    return () => {
      unsubSettings();
      unsubCustomers();
      unsubProducts();
      unsubTransactions();
      unsubPersonal();
    };
  }, [user]);

  const updateStoreDetails = async (details: { name: string; address: string; phone: string; logo?: string; color?: string; font?: string }) => {
    if (!user) return;
    await setDoc(doc(db, `users/${user.uid}/config`, 'settings'), details, { merge: true });
  };

  const addCustomer = async (data: Omit<Customer, 'id' | 'totalDue' | 'createdAt'>) => {
    if (!user) return;
    await addDoc(collection(db, `users/${user.uid}`, 'customers'), {
      ...data,
      totalDue: 0,
      createdAt: Date.now()
    });
  };

  const updateCustomer = async (id: string, updates: Partial<Customer>) => {
    if (!user) return;
    await updateDoc(doc(db, `users/${user.uid}`, 'customers', id), updates);
  };

  const deleteCustomer = async (id: string) => {
    if (!user) return;
    await deleteDoc(doc(db, `users/${user.uid}`, 'customers', id));
  };

  const addProduct = async (data: Omit<Product, 'id' | 'createdAt'>) => {
    if (!user) return;
    await addDoc(collection(db, `users/${user.uid}`, 'products'), {
      ...data,
      createdAt: Date.now()
    });
  };

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    if (!user) return;
    await updateDoc(doc(db, `users/${user.uid}`, 'products', id), updates);
  };

  const deleteProduct = async (id: string) => {
    if (!user) return;
    await deleteDoc(doc(db, `users/${user.uid}`, 'products', id));
  };

  const addTransaction = async (data: Omit<Transaction, 'id' | 'date'>) => {
    if (!user) return;
    const batch = writeBatch(db);
    const userPath = `users/${user.uid}`;
    
    // 1. Add the transaction
    const newTxRef = doc(collection(db, userPath, 'transactions'));
    batch.set(newTxRef, {
      ...data,
      date: Date.now()
    });

    // 2. Update Customer's totalDue
    const customerRef = doc(db, userPath, 'customers', data.customerId);
    const currentCustomer = customers.find(c => c.id === data.customerId);
    if (currentCustomer) {
      batch.update(customerRef, {
        totalDue: currentCustomer.totalDue + data.dueAmount
      });
    }

    // 3. Update Products quantities
    data.items.forEach(item => {
      const productRef = doc(db, userPath, 'products', item.productId);
      const currentProduct = products.find(p => p.id === item.productId);
      if (currentProduct) {
        batch.update(productRef, {
          quantity: Math.max(0, currentProduct.quantity - item.quantity)
        });
      }
    });

    await batch.commit();
  };

  const addPersonalTransaction = async (data: Omit<PersonalTransaction, 'id' | 'date'>) => {
    if (!user) return;
    await addDoc(collection(db, `users/${user.uid}`, 'personalTransactions'), {
      ...data,
      date: Date.now()
    });
  };

  const deletePersonalTransaction = async (id: string) => {
    if (!user) return;
    await deleteDoc(doc(db, `users/${user.uid}`, 'personalTransactions', id));
  };

  const clearAllData = async () => {
    // For safety, only implement if really needed, normally not recommended for cloud apps without caution
    alert("Cloud data clearing is restricted. Please delete items individually.");
  };

  const loadDemoData = async () => {
    if (!user) return;
    const batch = writeBatch(db);
    const userPath = `users/${user.uid}`;

    const demoCustomers = [
      { name: 'রহিম উল্লাহ', phone: '01712345678', upazila: 'মিরপুর', totalDue: 0, createdAt: Date.now() },
      { name: 'করিম শেখ', phone: '01887654321', upazila: 'উত্তরা', totalDue: 0, createdAt: Date.now() }
    ];

    const demoProducts = [
      { name: 'স্মার্টফোন X', category: 'ইলেকট্রনিক্স', quantity: 15, buyingPrice: 12000, createdAt: Date.now() },
      { name: 'হেডফোন প্রো', category: 'এক্সেসরিজ', quantity: 5, buyingPrice: 800, createdAt: Date.now() }
    ];

    demoCustomers.forEach(c => {
      const ref = doc(collection(db, userPath, 'customers'));
      batch.set(ref, c);
    });

    demoProducts.forEach(p => {
      const ref = doc(collection(db, userPath, 'products'));
      batch.set(ref, p);
    });

    await batch.commit();
    await updateStoreDetails({ name: 'স্মার্ট ইলেকট্রনিক্স', address: 'ঢাকা, বাংলাদেশ', phone: '০১xxxxxxxxx' });
  };

  return (
    <AppContext.Provider value={{
      customers,
      products,
      transactions,
      personalTransactions,
      storeName,
      storeAddress,
      storePhone,
      storeLogo,
      invoiceColor,
      invoiceFont,
      addCustomer,
      updateCustomer,
      deleteCustomer,
      addProduct,
      updateProduct,
      deleteProduct,
      addTransaction,
      addPersonalTransaction,
      deletePersonalTransaction,
      updateStoreDetails,
      loadDemoData,
      clearAllData,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
};