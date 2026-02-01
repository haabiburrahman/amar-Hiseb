
import React, { useState, useRef, useMemo } from 'react';
import { useAppContext } from '../context/AppContext.tsx';
import { 
  Search, 
  UserPlus, 
  Trash2, 
  Edit3, 
  X, 
  Download, 
  Upload, 
  Banknote,
  CheckCircle2,
  FileText,
  Loader2,
  Contact,
  History,
  Calendar,
  ArrowUpRight,
  ArrowDownLeft,
  Printer,
  FileDown
} from 'lucide-react';
import { Customer, Transaction } from '../types.ts';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

const CustomerManager = () => {
  const { 
    customers, addCustomer, deleteCustomer, updateCustomer, addTransaction,
    transactions, storeName, storeAddress, storePhone, invoiceColor 
  } = useAppContext();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isGeneratingHistoryPdf, setIsGeneratingHistoryPdf] = useState(false);
  
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [selectedCustomerForPayment, setSelectedCustomerForPayment] = useState<Customer | null>(null);
  const [selectedCustomerForHistory, setSelectedCustomerForHistory] = useState<Customer | null>(null);
  const [lastPaymentRecord, setLastPaymentRecord] = useState<any>(null);
  
  const [paymentAmount, setPaymentAmount] = useState<number | ''>('');
  const [formData, setFormData] = useState({ name: '', phone: '', upazila: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredCustomers = customers.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.phone.includes(searchTerm);
    return matchesSearch;
  });

  const customerTransactions = useMemo(() => {
    if (!selectedCustomerForHistory) return [];
    return transactions
      .filter(t => t.customerId === selectedCustomerForHistory.id)
      .sort((a, b) => b.date - a.date);
  }, [transactions, selectedCustomerForHistory]);

  const handleOpenAddModal = () => {
    setEditingCustomer(null);
    setFormData({ name: '', phone: '', upazila: '' });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({ 
      name: customer.name, 
      phone: customer.phone, 
      upazila: customer.upazila 
    });
    setIsModalOpen(true);
  };

  const generatePaymentPDF = async (record: any) => {
    setIsGeneratingPdf(true);
    const element = document.getElementById('invoice-template');
    if (!element) return;

    element.innerHTML = `
      <div style="width: 794px; padding: 50px; background: white; font-family: 'Hind Siliguri', sans-serif; color: #1e293b;">
        <!-- Header -->
        <div style="display: flex; justify-content: space-between; border-bottom: 4px solid ${invoiceColor}; padding-bottom: 30px; margin-bottom: 40px;">
          <div>
            <h1 style="color: ${invoiceColor}; margin: 0; font-size: 36px; font-weight: 800; letter-spacing: -1px;">${storeName}</h1>
            <p style="margin: 8px 0 0 0; font-size: 15px; color: #64748b; max-width: 300px;">${storeAddress}</p>
            <p style="margin: 4px 0 0 0; font-size: 15px; font-weight: 600; color: #475569;">মোবাইল: ${storePhone}</p>
          </div>
          <div style="text-align: right;">
            <h2 style="margin: 0; color: #1e293b; font-size: 28px; font-weight: 700;">টাকা প্রাপ্তির রশিদ</h2>
            <p style="margin: 10px 0 0 0; font-size: 14px; color: #64748b;">রশিদ নং: #${record.id.slice(0, 8).toUpperCase()}</p>
            <p style="margin: 4px 0 0 0; font-size: 14px; color: #64748b;">তারিখ: ${new Date(record.date).toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
        </div>

        <div style="margin-bottom: 40px; background: #f8fafc; padding: 25px; border-radius: 16px; border: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <p style="margin: 0 0 5px 0; font-size: 12px; font-weight: 700; color: #94a3b8; text-transform: uppercase;">কাস্টমার (Customer)</p>
            <h3 style="margin: 0; font-size: 20px; color: #1e293b; font-weight: 700;">${record.customerName}</h3>
            <p style="margin: 4px 0 0 0; font-size: 15px; color: #475569; font-weight: 500;">ফোন: ${record.customerPhone || 'N/A'}</p>
          </div>
          <div style="text-align: right;">
             <p style="margin: 0 0 5px 0; font-size: 12px; font-weight: 700; color: #94a3b8; text-transform: uppercase;">প্রাপ্ত টাকার পরিমাণ</p>
             <h2 style="margin: 0; font-size: 32px; color: #059669; font-weight: 800;">৳${record.paidAmount.toLocaleString()}</h2>
          </div>
        </div>

        <div style="margin-bottom: 40px;">
          <table style="width: 100%; border-collapse: separate; border-spacing: 0;">
            <thead>
              <tr style="background: ${invoiceColor}; color: white;">
                <th style="padding: 18px 25px; text-align: left; border-radius: 12px 0 0 12px; font-size: 16px;">লেনদেনের বিবরণ</th>
                <th style="padding: 18px 25px; text-align: right; border-radius: 0 12px 12px 0; font-size: 16px;">পরিমাণ (৳)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="padding: 25px; border-bottom: 2px solid #f1f5f9; font-size: 17px; font-weight: 600; color: #334155;">বকেয়া জমা (Previous Due Payment)</td>
                <td style="padding: 25px; border-bottom: 2px solid #f1f5f9; text-align: right; font-size: 20px; font-weight: 800; color: #059669;">৳${record.paidAmount.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style="display: flex; justify-content: flex-end;">
          <div style="width: 350px; background: #f8fafc; padding: 30px; border-radius: 20px; border: 1px solid #f1f5f9;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 15px; color: #64748b;">
              <span>পূর্বের মোট বকেয়া:</span>
              <span style="font-weight: 700; color: #1e293b;">৳${record.prevDue.toLocaleString()}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 15px; font-size: 15px; color: #059669; font-weight: bold;">
              <span>আজকের জমা:</span>
              <span>(-) ৳${record.paidAmount.toLocaleString()}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding-top: 15px; border-top: 2px dashed #cbd5e1; font-size: 20px; font-weight: 800; color: ${invoiceColor};">
              <span>বর্তমান বকেয়া:</span>
              <span>৳${record.netDue.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div style="margin-top: 100px; display: flex; justify-content: space-between;">
           <div style="text-align: center; width: 220px;">
             <div style="height: 1px; background: #cbd5e1; margin-bottom: 10px;"></div>
             <div style="font-size: 14px; font-weight: 700; color: #475569;">ক্রেতার স্বাক্ষর</div>
           </div>
           <div style="text-align: center; width: 220px;">
             <div style="height: 1px; background: #cbd5e1; margin-bottom: 10px;"></div>
             <div style="font-size: 14px; font-weight: 700; color: #475569;">কর্তৃপক্ষের স্বাক্ষর</div>
           </div>
        </div>
        
        <div style="margin-top: 60px; text-align: center; border-top: 1px dashed #e2e8f0; padding-top: 25px;">
          <p style="margin: 0; font-size: 16px; font-weight: 700; color: #64748b;">ধন্যবাদ, পুনরায় আসার আমন্ত্রণ রইলো।</p>
          <p style="margin: 5px 0 0 0; font-size: 12px; color: #94a3b8;">সিস্টেম জেনারেটেড রশিদ - Amar Hisab</p>
        </div>
      </div>
    `;

    try {
      const canvas = await html2canvas(element, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Receipt_${record.customerName}_${new Date().getTime()}.pdf`);
    } catch (err) {
      console.error("PDF Generation Error:", err);
      alert('পিডিএফ তৈরি করতে সমস্যা হয়েছে।');
    } finally {
      element.innerHTML = '';
      setIsGeneratingPdf(false);
    }
  };

  const generateHistoryPDF = async () => {
    if (!selectedCustomerForHistory || customerTransactions.length === 0) return;
    setIsGeneratingHistoryPdf(true);
    
    const element = document.getElementById('invoice-template');
    if (!element) return;

    element.innerHTML = `
      <div style="width: 794px; padding: 50px; background: white; font-family: 'Hind Siliguri', sans-serif; color: #1e293b;">
        <div style="display: flex; justify-content: space-between; border-bottom: 4px solid ${invoiceColor}; padding-bottom: 30px; margin-bottom: 40px;">
          <div>
            <h1 style="color: ${invoiceColor}; margin: 0; font-size: 32px; font-weight: 800;">${storeName}</h1>
            <p style="margin: 5px 0; font-size: 14px; color: #64748b;">${storeAddress}</p>
            <p style="margin: 3px 0; font-size: 14px; font-weight: 600;">ফোন: ${storePhone}</p>
          </div>
          <div style="text-align: right;">
            <h2 style="margin: 0; color: #1e293b; font-size: 24px; font-weight: 700;">লেনদেনের স্টেটমেন্ট</h2>
            <p style="margin: 10px 0 0 0; font-size: 14px; color: #64748b;">তারিখ: ${new Date().toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
        </div>

        <div style="margin-bottom: 30px; background: #f8fafc; padding: 25px; border-radius: 16px; border: 1px solid #f1f5f9; border-left: 6px solid ${invoiceColor};">
          <p style="margin: 0 0 5px 0; font-size: 12px; font-weight: 700; color: #94a3b8; text-transform: uppercase;">গ্রাহকের তথ্য (Customer Details)</p>
          <h3 style="margin: 0; font-size: 20px; font-weight: 700;">${selectedCustomerForHistory.name}</h3>
          <p style="margin: 4px 0 0 0; font-size: 15px; font-weight: 500; color: #475569;">মোবাইল: ${selectedCustomerForHistory.phone}</p>
        </div>

        <table style="width: 100%; border-collapse: separate; border-spacing: 0; margin-bottom: 30px;">
          <thead>
            <tr style="background: ${invoiceColor}; color: white;">
              <th style="padding: 15px; text-align: left; border-radius: 8px 0 0 8px; font-size: 14px;">তারিখ</th>
              <th style="padding: 15px; text-align: left; font-size: 14px;">বিবরণ</th>
              <th style="padding: 15px; text-align: right; font-size: 14px;">মোট বিল</th>
              <th style="padding: 15px; text-align: right; font-size: 14px;">জমা</th>
              <th style="padding: 15px; text-align: right; border-radius: 0 8px 8px 0; font-size: 14px;">ব্যালেন্স পরিবর্তন</th>
            </tr>
          </thead>
          <tbody>
            ${customerTransactions.map((tx, index) => `
              <tr style="background: ${index % 2 === 0 ? '#ffffff' : '#f8fafc'};">
                <td style="padding: 15px; border-bottom: 1px solid #f1f5f9; font-size: 13px;">${new Date(tx.date).toLocaleDateString('bn-BD')}</td>
                <td style="padding: 15px; border-bottom: 1px solid #f1f5f9; font-size: 13px; font-weight: 600;">${tx.totalAmount > 0 ? 'পণ্য বিক্রয়' : 'বকেয়া জমা'}</td>
                <td style="padding: 15px; border-bottom: 1px solid #f1f5f9; text-align: right; font-size: 13px;">${tx.totalAmount > 0 ? '৳' + tx.totalAmount.toLocaleString() : '-'}</td>
                <td style="padding: 15px; border-bottom: 1px solid #f1f5f9; text-align: right; font-size: 13px; color: #059669; font-weight: 700;">৳${tx.paidAmount.toLocaleString()}</td>
                <td style="padding: 15px; border-bottom: 1px solid #f1f5f9; text-align: right; font-size: 13px; font-weight: 700; color: ${tx.dueAmount > 0 ? '#e11d48' : '#059669'}">
                  ${tx.dueAmount > 0 ? '+' : ''}${tx.dueAmount.toLocaleString()}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div style="display: flex; justify-content: flex-end;">
          <div style="width: 300px; background: ${invoiceColor}; padding: 20px; border-radius: 12px; color: white; text-align: center;">
            <p style="margin: 0; font-size: 14px; font-weight: 500;">বর্তমান মোট বকেয়া</p>
            <h2 style="margin: 5px 0 0 0; font-size: 24px; font-weight: 800;">৳${selectedCustomerForHistory.totalDue.toLocaleString()}</h2>
          </div>
        </div>

        <div style="margin-top: 50px; text-align: center; color: #94a3b8; font-size: 11px; border-top: 1px dashed #e2e8f0; padding-top: 20px;">
          স্টেটমেন্টটি সফলভাবে তৈরি করা হয়েছে। Amar Hisab - ব্যবসার স্মার্ট সমাধান।
        </div>
      </div>
    `;

    try {
      const canvas = await html2canvas(element, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Statement_${selectedCustomerForHistory.name}.pdf`);
    } catch (err) {
      console.error("History PDF Generation Error:", err);
    } finally {
      element.innerHTML = '';
      setIsGeneratingHistoryPdf(false);
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerForPayment || !paymentAmount) return;
    const amount = Number(paymentAmount);
    
    const transactionData = {
      customerId: selectedCustomerForPayment.id,
      customerName: selectedCustomerForPayment.name,
      customerPhone: selectedCustomerForPayment.phone,
      totalAmount: 0,
      paidAmount: amount,
      dueAmount: -amount,
      profit: 0,
      items: [{
        productId: 'payment_adjustment',
        productName: 'বকেয়া জমা',
        quantity: 1,
        unitBuyingPrice: 0,
        unitSellingPrice: 0,
        totalPrice: 0
      }]
    };

    await addTransaction(transactionData);
    
    setLastPaymentRecord({
      ...transactionData,
      id: crypto.randomUUID(),
      date: Date.now(),
      prevDue: selectedCustomerForPayment.totalDue,
      netDue: selectedCustomerForPayment.totalDue - amount
    });
    
    setIsPaymentModalOpen(false);
    setPaymentAmount('');
    setIsSuccessModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">কাস্টমার ম্যানেজমেন্ট</h1>
          <p className="text-slate-500">দোকানের কাস্টমার ও লেনদেনের ইতিহাস</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input type="file" accept=".csv" className="hidden" ref={fileInputRef} onChange={(e) => {
             const file = e.target.files?.[0];
             if (!file) return;
             const reader = new FileReader();
             reader.onload = (event) => {
               const content = event.target?.result as string;
               const lines = content.split('\n');
               lines.slice(1).forEach(line => {
                 const parts = line.split(',').map(part => part.replace(/^"|"$/g, '').trim());
                 if (parts.length >= 2) addCustomer({ name: parts[0], phone: parts[1], upazila: parts[2] || 'N/A' });
               });
               if (fileInputRef.current) fileInputRef.current.value = '';
             };
             reader.readAsText(file);
          }} />
          <button onClick={() => fileInputRef.current?.click()} className="flex items-center space-x-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-lg border">
            <Upload size={18} />
            <span className="hidden sm:inline font-medium text-sm">ইম্পোর্ট</span>
          </button>
          <button onClick={() => {
            if (customers.length === 0) return alert('ডাউনলোড করার জন্য কোনো কাস্টমার নেই');
            const headers = ['নাম', 'ফোন', 'উপজেলা', 'বকেয়া (৳)'];
            const rows = customers.map(c => [`"${c.name}"`, `"${c.phone}"`, `"${c.upazila}"`, c.totalDue]);
            const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
            const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.setAttribute('href', URL.createObjectURL(blob));
            link.setAttribute('download', `Customer_List_${new Date().toLocaleDateString('bn-BD')}.csv`);
            link.click();
          }} className="flex items-center space-x-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-lg border">
            <Download size={18} />
            <span className="hidden sm:inline font-medium text-sm">ডাউনলোড</span>
          </button>
          <button onClick={handleOpenAddModal} className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg shadow-sm font-bold">
            <UserPlus size={18} />
            <span>নতুন কাস্টমার</span>
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input type="text" placeholder="নাম বা ফোন দিয়ে খুঁজুন..." className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500">নাম ও ফোন</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500">উপজেলা</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 text-right">বাকি (Due)</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-slate-400">কোনো কাস্টমার পাওয়া যায়নি</td>
                </tr>
              ) : (
                filteredCustomers.map(customer => (
                  <tr key={customer.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800">{customer.name}</p>
                      <p className="text-xs text-slate-500">{customer.phone}</p>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{customer.upazila}</td>
                    <td className="px-6 py-4 text-right">
                      <span className={`font-bold ${customer.totalDue > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        ৳{customer.totalDue.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button 
                          onClick={() => { setSelectedCustomerForHistory(customer); setIsHistoryModalOpen(true); }} 
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="লেনদেনের ইতিহাস"
                        >
                          <History size={18} />
                        </button>
                        <button 
                          onClick={() => { setSelectedCustomerForPayment(customer); setIsPaymentModalOpen(true); }} 
                          className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="টাকা জমা নিন"
                        >
                          <Banknote size={18} />
                        </button>
                        <button onClick={() => handleOpenEditModal(customer)} className="p-2 text-indigo-400 hover:text-indigo-600 transition-colors"><Edit3 size={18} /></button>
                        <button onClick={() => { if(confirm('আপনি কি এই কাস্টমার ডিলিট করতে চান?')) deleteCustomer(customer.id); }} className="p-2 text-rose-300 hover:text-rose-600 transition-colors"><Trash2 size={18} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* History Modal */}
      {isHistoryModalOpen && selectedCustomerForHistory && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4 backdrop-blur-md">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] shadow-2xl scale-up-center overflow-hidden flex flex-col">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50/50">
              <div>
                <h2 className="text-xl font-bold text-slate-800">লেনদেনের ইতিহাস</h2>
                <p className="text-sm text-slate-500">{selectedCustomerForHistory.name} ({selectedCustomerForHistory.phone})</p>
              </div>
              <div className="flex items-center space-x-2">
                <button 
                  disabled={isGeneratingHistoryPdf || customerTransactions.length === 0}
                  onClick={generateHistoryPDF}
                  className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-50"
                  title="হিস্ট্রি ডাউনলোড"
                >
                  {isGeneratingHistoryPdf ? <Loader2 size={24} className="animate-spin" /> : <FileDown size={24} />}
                </button>
                <button onClick={() => setIsHistoryModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                  <X size={24} className="text-slate-400 hover:text-slate-600" />
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {customerTransactions.length === 0 ? (
                <div className="text-center py-20 text-slate-400">
                  <FileText size={48} className="mx-auto mb-4 opacity-20" />
                  <p>এখনো কোনো লেনদেন রেকর্ড করা হয়নি</p>
                </div>
              ) : (
                customerTransactions.map((tx) => (
                  <div key={tx.id} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-xl ${tx.totalAmount > 0 ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'}`}>
                          {tx.totalAmount > 0 ? <ArrowUpRight size={20} /> : <ArrowDownLeft size={20} />}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">
                            {tx.totalAmount > 0 ? 'পণ্য বিক্রয়' : 'বকেয়া জমা'}
                          </p>
                          <div className="flex items-center space-x-2 text-xs text-slate-400">
                            <Calendar size={12} />
                            <span>{new Date(tx.date).toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold text-lg ${tx.totalAmount > 0 ? 'text-slate-800' : 'text-emerald-600'}`}>
                          ৳{tx.paidAmount.toLocaleString()}
                        </p>
                        <p className="text-xs text-slate-400">পরিশোধিত</p>
                      </div>
                    </div>
                    
                    {tx.items && tx.items.length > 0 && tx.items[0].productId !== 'payment_adjustment' && (
                      <div className="mt-3 pt-3 border-t border-slate-50">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">পণ্যের তালিকা</p>
                        <div className="space-y-1">
                          {tx.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-sm">
                              <span className="text-slate-600">{item.productName} x {item.quantity}</span>
                              <span className="font-medium text-slate-800">৳{item.totalPrice.toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                        <div className="mt-3 pt-2 border-t border-dashed flex justify-between font-bold text-slate-800">
                          <span>মোট বিল</span>
                          <span>৳{tx.totalAmount.toLocaleString()}</span>
                        </div>
                      </div>
                    )}
                    
                    <div className="mt-2 flex justify-end">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${tx.dueAmount > 0 ? 'bg-rose-50 text-rose-600' : tx.dueAmount < 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>
                        {tx.dueAmount > 0 ? `বকেয়া: ৳${tx.dueAmount}` : tx.dueAmount < 0 ? `বকেয়া কমেছে: ৳${Math.abs(tx.dueAmount)}` : 'পরিশোধিত'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <div className="p-6 bg-slate-50 border-t flex justify-between items-center">
              <div className="text-slate-500 text-sm">মোট {customerTransactions.length} টি লেনদেন</div>
              <div className="font-bold text-rose-600">মোট বকেয়া: ৳{selectedCustomerForHistory.totalDue.toLocaleString()}</div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Success Modal */}
      {isSuccessModalOpen && lastPaymentRecord && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-[60] p-4 backdrop-blur-md">
          <div className="bg-white rounded-[32px] w-full max-w-sm p-8 text-center space-y-6 scale-up-center shadow-2xl border border-slate-100">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto animate-bounce">
              <CheckCircle2 size={40} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800">টাকা জমা হয়েছে!</h2>
              <p className="text-slate-500 mt-1">কাস্টমার: {lastPaymentRecord.customerName}</p>
            </div>
            
            <div className="bg-slate-50 rounded-2xl p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">জমার পরিমাণ:</span>
                <span className="font-bold text-emerald-600">৳{lastPaymentRecord.paidAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t border-slate-200">
                <span className="text-slate-500">বর্তমান বকেয়া:</span>
                <span className="font-bold text-rose-500">৳{lastPaymentRecord.netDue.toLocaleString()}</span>
              </div>
            </div>

            <div className="space-y-3 pt-4">
              <button 
                disabled={isGeneratingPdf} 
                onClick={() => generatePaymentPDF(lastPaymentRecord)} 
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-bold flex items-center justify-center space-x-2 shadow-lg shadow-indigo-100 transition-all active:scale-95 disabled:opacity-50"
              >
                {isGeneratingPdf ? <Loader2 className="animate-spin" size={20} /> : <Printer size={20} />}
                <span>{isGeneratingPdf ? 'রশিদ তৈরি হচ্ছে...' : 'রশিদ ডাউনলোড করুন'}</span>
              </button>
              <button 
                onClick={() => setIsSuccessModalOpen(false)} 
                className="w-full bg-slate-100 text-slate-600 py-3.5 rounded-2xl font-bold hover:bg-slate-200 transition-colors"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerManager;
