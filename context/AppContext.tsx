import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Customer, Product, Transaction, PersonalTransaction, Supplier, SupplierTransaction } from '../types';
import { useAuth } from './AuthContext';
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
  suppliers: Supplier[];
  supplierTransactions: SupplierTransaction[];
  storeName: string;
  storeAddress: string;
  storePhone: string;
  storeLogo: string;
  invoiceColor: string;
  invoiceFont: string;
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt'>) => Promise<void>;
  updateCustomer: (id: string, updates: Partial<Customer>) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  addProduct: (product: Omit<Product, 'id' | 'createdAt'>) => Promise<void>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'date'>) => Promise<void>;
  addPersonalTransaction: (transaction: Omit<PersonalTransaction, 'id' | 'date'>) => Promise<void>;
  deletePersonalTransaction: (id: string) => Promise<void>;
  addSupplier: (supplier: Omit<Supplier, 'id' | 'createdAt'>) => Promise<void>;
  updateSupplier: (id: string, updates: Partial<Supplier>) => Promise<void>;
  deleteSupplier: (id: string) => Promise<void>;
  addSupplierTransaction: (transaction: Omit<SupplierTransaction, 'id' | 'date'>) => Promise<void>;
  deleteSupplierTransaction: (id: string) => Promise<void>;
  updateStoreDetails: (details: { name: string; address: string; phone: string; logo?: string; color?: string; font?: string }) => Promise<void>;
  loadDemoData: () => Promise<void>;
  clearAllData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();

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
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [supplierTransactions, setSupplierTransactions] = useState<SupplierTransaction[]>([]);

  useEffect(() => {
    if (!user) {
      setCustomers([]);
      setProducts([]);
      setTransactions([]);
      setPersonalTransactions([]);
      setSuppliers([]);
      setSupplierTransactions([]);
      return;
    }

    const userPath = `users/${user.uid}`;

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

    const qCustomers = query(collection(db, userPath, 'customers'), orderBy('createdAt', 'desc'));
    const unsubCustomers = onSnapshot(qCustomers, (snapshot) => {
      setCustomers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer)));
    });

    const qProducts = query(collection(db, userPath, 'products'), orderBy('createdAt', 'desc'));
    const unsubProducts = onSnapshot(qProducts, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
    });

    const qTransactions = query(collection(db, userPath, 'transactions'), orderBy('date', 'desc'));
    const unsubTransactions = onSnapshot(qTransactions, (snapshot) => {
      setTransactions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction)));
    });

    const qPersonal = query(collection(db, userPath, 'personalTransactions'), orderBy('date', 'desc'));
    const unsubPersonal = onSnapshot(qPersonal, (snapshot) => {
      setPersonalTransactions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PersonalTransaction)));
    });

    const qSuppliers = query(collection(db, userPath, 'suppliers'), orderBy('createdAt', 'desc'));
    const unsubSuppliers = onSnapshot(qSuppliers, (snapshot) => {
      setSuppliers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Supplier)));
    });

    const qSupplierTx = query(collection(db, userPath, 'supplierTransactions'), orderBy('date', 'desc'));
    const unsubSupplierTx = onSnapshot(qSupplierTx, (snapshot) => {
      setSupplierTransactions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SupplierTransaction)));
    });

    return () => {
      unsubSettings();
      unsubCustomers();
      unsubProducts();
      unsubTransactions();
      unsubPersonal();
      unsubSuppliers();
      unsubSupplierTx();
    };
  }, [user]);

  const updateStoreDetails = async (details: { name: string; address: string; phone: string; logo?: string; color?: string; font?: string }) => {
    if (!user) return;
    await setDoc(doc(db, "users", user.uid, "config", "settings"), details, { merge: true });
  };

  const addCustomer = async (data: Omit<Customer, 'id' | 'createdAt'>) => {
    if (!user) return;
    await addDoc(collection(db, "users", user.uid, "customers"), {
      ...data,
      totalDue: data.totalDue || 0,
      createdAt: Date.now()
    });
  };

  const updateCustomer = async (id: string, updates: Partial<Customer>) => {
    if (!user) return;
    await updateDoc(doc(db, "users", user.uid, "customers", id), updates);
  };

  const deleteCustomer = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, "users", user.uid, "customers", id));
    } catch (err) {
      console.error("Delete Error:", err);
      alert('ডিলিট করা যায়নি!');
    }
  };

  const addProduct = async (data: Omit<Product, 'id' | 'createdAt'>) => {
    if (!user) return;
    await addDoc(collection(db, "users", user.uid, "products"), {
      ...data,
      createdAt: Date.now()
    });
  };

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    if (!user) return;
    await updateDoc(doc(db, "users", user.uid, "products", id), updates);
  };

  const deleteProduct = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, "users", user.uid, "products", id));
    } catch (err) {
      console.error("Delete Error:", err);
    }
  };

  const addTransaction = async (data: Omit<Transaction, 'id' | 'date'>) => {
    if (!user) return;
    const batch = writeBatch(db);
    const userRef = `users/${user.uid}`;
    
    const newTxRef = doc(collection(db, userRef, "transactions"));
    batch.set(newTxRef, {
      ...data,
      date: Date.now()
    });

    const customerRef = doc(db, userRef, "customers", data.customerId);
    const currentCustomer = customers.find(c => c.id === data.customerId);
    if (currentCustomer) {
      batch.update(customerRef, {
        totalDue: (currentCustomer.totalDue || 0) + data.dueAmount
      });
    }

    data.items.forEach(item => {
      if (item.productId === 'payment_adjustment') return;
      const productRef = doc(db, userRef, "products", item.productId);
      const currentProduct = products.find(p => p.id === item.productId);
      if (currentProduct) {
        batch.update(productRef, {
          quantity: Math.max(0, (currentProduct.quantity || 0) - item.quantity)
        });
      }
    });

    await batch.commit();
  };

  const addPersonalTransaction = async (data: Omit<PersonalTransaction, 'id' | 'date'>) => {
    if (!user) return;
    await addDoc(collection(db, "users", user.uid, "personalTransactions"), {
      ...data,
      date: Date.now()
    });
  };

  const deletePersonalTransaction = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, "users", user.uid, "personalTransactions", id));
    } catch (err) {
      console.error("Delete Error:", err);
    }
  };

  const addSupplier = async (data: Omit<Supplier, 'id' | 'createdAt'>) => {
    if (!user) return;
    await addDoc(collection(db, "users", user.uid, "suppliers"), {
      ...data,
      totalDue: data.totalDue || 0,
      createdAt: Date.now()
    });
  };

  const updateSupplier = async (id: string, updates: Partial<Supplier>) => {
    if (!user) return;
    await updateDoc(doc(db, "users", user.uid, "suppliers", id), updates);
  };

  const deleteSupplier = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, "users", user.uid, "suppliers", id));
    } catch (err) {
      console.error("Delete Error:", err);
    }
  };

  const addSupplierTransaction = async (data: Omit<SupplierTransaction, 'id' | 'date'>) => {
    if (!user) return;
    const batch = writeBatch(db);
    const userRef = `users/${user.uid}`;
    
    const newTxRef = doc(collection(db, userRef, "supplierTransactions"));
    batch.set(newTxRef, {
      ...data,
      date: Date.now()
    });

    const supplierRef = doc(db, userRef, "suppliers", data.supplierId);
    const currentSupplier = suppliers.find(s => s.id === data.supplierId);
    if (currentSupplier) {
      const adjustment = data.type === 'purchase' ? data.amount : -data.amount;
      batch.update(supplierRef, {
        totalDue: (currentSupplier.totalDue || 0) + adjustment
      });
    }

    await batch.commit();
  };

  const deleteSupplierTransaction = async (id: string) => {
    if (!user) return;
    const tx = supplierTransactions.find(t => t.id === id);
    if (!tx) return;

    const batch = writeBatch(db);
    const userRef = `users/${user.uid}`;
    
    batch.delete(doc(db, userRef, "supplierTransactions", id));

    const supplierRef = doc(db, userRef, "suppliers", tx.supplierId);
    const currentSupplier = suppliers.find(s => s.id === tx.supplierId);
    if (currentSupplier) {
      const adjustment = tx.type === 'purchase' ? -tx.amount : tx.amount;
      batch.update(supplierRef, {
        totalDue: (currentSupplier.totalDue || 0) + adjustment
      });
    }

    await batch.commit();
  };

  const clearAllData = async () => {
    if (!user) return;
    if (!confirm("আপনি কি নিশ্চিত যে আপনি সকল ডাটা মুছে ফেলতে চান? এটি আর ফিরিয়ে আনা সম্ভব নয়।")) return;

    try {
      const batch = writeBatch(db);
      const userRef = `users/${user.uid}`;

      customers.forEach(c => batch.delete(doc(db, userRef, 'customers', c.id)));
      products.forEach(p => batch.delete(doc(db, userRef, 'products', p.id)));
      transactions.forEach(t => batch.delete(doc(db, userRef, 'transactions', t.id)));
      personalTransactions.forEach(pt => batch.delete(doc(db, userRef, 'personalTransactions', pt.id)));
      suppliers.forEach(s => batch.delete(doc(db, userRef, 'suppliers', s.id)));
      supplierTransactions.forEach(st => batch.delete(doc(db, userRef, 'supplierTransactions', st.id)));

      await batch.commit();
      alert("আপনার সকল ডাটা সফলভাবে মুছে ফেলা হয়েছে।");
    } catch (error: any) {
      console.error("Clear data error:", error);
      alert("ডাটা মুছতে সমস্যা হয়েছে: " + error.message);
    }
  };

  const loadDemoData = async () => {
    if (!user) return;
    const batch = writeBatch(db);
    const userRef = `users/${user.uid}`;

    const demoCustomers = [
      { name: 'রহিম উল্লাহ', phone: '01712345678', upazila: 'মিরপুর', totalDue: 500, createdAt: Date.now() },
      { name: 'করিম শেখ', phone: '01887654321', upazila: 'উত্তরা', totalDue: 0, createdAt: Date.now() }
    ];

    const demoProducts = [
      { name: 'স্মার্টফোন X', category: 'ইলেকট্রনিক্স', quantity: 15, buyingPrice: 12000, unit: 'pcs', createdAt: Date.now() },
      { name: 'হেডফোন প্রো', category: 'এক্সেসরিজ', quantity: 5, buyingPrice: 800, unit: 'pcs', createdAt: Date.now() }
    ];

    const demoSuppliers = [
      { name: 'করিম এন্টারপ্রাইজ', phone: '01911223344', company: 'স্যামসাং ডিস্ট্রিবিউশন', totalDue: 15000, createdAt: Date.now() },
      { name: 'জসিম ট্রেডার্স', phone: '01755667788', company: 'এক্সেসরিজ ওয়ার্ল্ড', totalDue: 0, createdAt: Date.now() }
    ];

    demoCustomers.forEach(c => {
      const ref = doc(collection(db, userRef, 'customers'));
      batch.set(ref, c);
    });

    demoProducts.forEach(p => {
      const ref = doc(collection(db, userRef, 'products'));
      batch.set(ref, p);
    });

    demoSuppliers.forEach(s => {
      const ref = doc(collection(db, userRef, 'suppliers'));
      batch.set(ref, s);
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
      suppliers,
      supplierTransactions,
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
      addSupplier,
      updateSupplier,
      deleteSupplier,
      addSupplierTransaction,
      deleteSupplierTransaction,
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
