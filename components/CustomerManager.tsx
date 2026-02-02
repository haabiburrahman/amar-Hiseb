
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
  FileDown,
  ArrowRight
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
  const [formData, setFormData] = useState({ name: '', phone: '', upazila: '', initialDue: '0' });
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
    setFormData({ name: '', phone: '', upazila: '', initialDue: '0' });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({ 
      name: customer.name, 
      phone: customer.phone, 
      upazila: customer.upazila,
      initialDue: String(customer.totalDue)
    });
    setIsModalOpen(true);
  };

  const generatePaymentPDF = async (record: any) => {
    setIsGeneratingPdf(true);
    const element = document.getElementById('invoice-template');
    if (!element) return;

    element.innerHTML = `
      <div style="width: 794px; padding: 50px; background: white; font-family: 'Hind Siliguri', sans-serif; color: #1e293b;">
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
        <div style="margin-top: 80px; text-align: center; border-top: 1px dashed #e2e8f0; padding-top: 25px;">
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
          <div><h1 style="color: ${invoiceColor}; margin: 0; font-size: 32px; font-weight: 800;">${storeName}</h1><p style="margin: 5px 0; font-size: 14px; color: #64748b;">${storeAddress}</p><p style="margin: 3px 0; font-size: 14px; font-weight: 600;">ফোন: ${storePhone}</p></div>
          <div style="text-align: right;"><h2 style="margin: 0; color: #1e293b; font-size: 24px; font-weight: 700;">লেনদেনের স্টেটমেন্ট</h2><p style="margin: 10px 0 0 0; font-size: 14px; color: #64748b;">তারিখ: ${new Date().toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' })}</p></div>
        </div>
        <div style="margin-bottom: 30px; background: #f8fafc; padding: 25px; border-radius: 16px; border: 1px solid #f1f5f9; border-left: 8px solid ${invoiceColor};">
          <p style="margin: 0 0 5px 0; font-size: 12px; font-weight: 700; color: #94a3b8; text-transform: uppercase;">গ্রাহকের তথ্য</p>
          <h3 style="margin: 0; font-size: 22px; font-weight: 700; color: #1e293b;">${selectedCustomerForHistory.name}</h3>
          <p style="margin: 4px 0 0 0; font-size: 15px; font-weight: 500; color: #475569;">মোবাইল: ${selectedCustomerForHistory.phone}</p>
        </div>
        <table style="width: 100%; border-collapse: separate; border-spacing: 0; margin-bottom: 40px;">
          <thead>
            <tr style="background: ${invoiceColor}; color: white;">
              <th style="padding: 15px 20px; text-align: left; border-radius: 12px 0 0 12px; font-size: 14px;">তারিখ</th>
              <th style="padding: 15px 20px; text-align: left; font-size: 14px;">বিবরণ</th>
              <th style="padding: 15px 20px; text-align: right; font-size: 14px;">বিল</th>
              <th style="padding: 15px 20px; text-align: right; font-size: 14px;">জমা</th>
              <th style="padding: 15px 20px; text-align: right; border-radius: 0 12px 12px 0; font-size: 14px;">ব্যালেন্স পরিবর্তন</th>
            </tr>
          </thead>
          <tbody>
            ${customerTransactions.map((tx, index) => `
              <tr style="background: ${index % 2 === 0 ? '#ffffff' : '#f8fafc'};">
                <td style="padding: 15px 20px; border-bottom: 1px solid #f1f5f9; font-size: 13px;">${new Date(tx.date).toLocaleDateString('bn-BD')}</td>
                <td style="padding: 15px 20px; border-bottom: 1px solid #f1f5f9; font-size: 13px; font-weight: 600;">${tx.totalAmount > 0 ? 'পণ্য বিক্রয়' : 'বকেয়া জমা'}</td>
                <td style="padding: 15px 20px; border-bottom: 1px solid #f1f5f9; text-align: right; font-size: 13px;">${tx.totalAmount > 0 ? '৳' + tx.totalAmount.toLocaleString() : '-'}</td>
                <td style="padding: 15px 20px; border-bottom: 1px solid #f1f5f9; text-align: right; font-size: 13px; color: #059669; font-weight: 700;">৳${tx.paidAmount.toLocaleString()}</td>
                <td style="padding: 15px 20px; border-bottom: 1px solid #f1f5f9; text-align: right; font-size: 13px; font-weight: 800; color: ${tx.dueAmount > 0 ? '#e11d48' : '#059669'}">${tx.dueAmount > 0 ? '+' : ''}${tx.dueAmount.toLocaleString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div style="display: flex; justify-content: flex-end;"><div style="width: 300px; background: ${invoiceColor}; padding: 20px; border-radius: 12px; color: white; text-align: center;"><p style="margin: 0; font-size: 14px; font-weight: 500;">বর্তমান মোট বকেয়া</p><h2 style="margin: 5px 0 0 0; font-size: 24px; font-weight: 800;">৳${selectedCustomerForHistory.totalDue.toLocaleString()}</h2></div></div>
      </div>
    `;
    try {
      const canvas = await html2canvas(element, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      pdf.addImage(imgData, 'PNG', 0, 0, 210, (canvas.height * 210) / canvas.width);
      pdf.save(`Statement_${selectedCustomerForHistory.name}.pdf`);
    } catch (err) { console.error(err); } finally { element.innerHTML = ''; setIsGeneratingHistoryPdf(false); }
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
      items: [{ productId: 'payment_adjustment', productName: 'বকেয়া জমা', quantity: 1, unitBuyingPrice: 0, unitSellingPrice: 0, totalPrice: 0 }]
    };
    await addTransaction(transactionData);
    setLastPaymentRecord({ ...transactionData, id: crypto.randomUUID(), date: Date.now(), prevDue: selectedCustomerForPayment.totalDue, netDue: selectedCustomerForPayment.totalDue - amount });
    setIsPaymentModalOpen(false); setPaymentAmount(''); setIsSuccessModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-slate-800">কাস্টমার ম্যানেজমেন্ট</h1><p className="text-slate-500">দোকানের কাস্টমার ও লেনদেনের ইতিহাস</p></div>
        <div className="flex flex-wrap gap-2">
          <input type="file" accept=".csv" className="hidden" ref={fileInputRef} onChange={(e) => {
             const file = e.target.files?.[0]; if (!file) return;
             const reader = new FileReader();
             reader.onload = (event) => {
               const content = event.target?.result as string;
               const lines = content.split('\n');
               lines.slice(1).forEach(line => {
                 const parts = line.split(',').map(part => part.replace(/^"|"$/g, '').trim());
                 if (parts.length >= 2) addCustomer({ name: parts[0], phone: parts[1], upazila: parts[2] || 'N/A', totalDue: Number(parts[3]) || 0 });
               });
             }; reader.readAsText(file);
          }} />
          <button onClick={() => fileInputRef.current?.click()} className="flex items-center space-x-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-lg border"><Upload size={18} /><span className="hidden sm:inline font-medium text-sm">ইম্পোর্ট</span></button>
          <button onClick={handleOpenAddModal} className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg shadow-sm font-bold"><UserPlus size={18} /><span>নতুন কাস্টমার</span></button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input type="text" placeholder="নাম বা ফোন দিয়ে খুঁজুন..." className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b"><tr><th className="px-6 py-4 text-xs font-semibold text-slate-500">নাম ও ফোন</th><th className="px-6 py-4 text-xs font-semibold text-slate-500">উপজেলা</th><th className="px-6 py-4 text-xs font-semibold text-slate-500 text-right">বাকি (Due)</th><th className="px-6 py-4 text-xs font-semibold text-slate-500 text-right">অ্যাকশন</th></tr></thead>
            <tbody className="divide-y">
              {filteredCustomers.length === 0 ? (<tr><td colSpan={4} className="px-6 py-12 text-center text-slate-400">কোনো কাস্টমার পাওয়া যায়নি</td></tr>) : (
                filteredCustomers.map(customer => (
                  <tr key={customer.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4"><p className="font-bold text-slate-800">{customer.name}</p><p className="text-xs text-slate-500">{customer.phone}</p></td>
                    <td className="px-6 py-4 text-slate-600 font-medium">{customer.upazila}</td>
                    <td className="px-6 py-4 text-right"><span className={`font-bold text-lg ${customer.totalDue > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>৳{customer.totalDue.toLocaleString()}</span></td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button onClick={() => { setSelectedCustomerForHistory(customer); setIsHistoryModalOpen(true); }} className="p-2.5 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all" title="লেনদেনের ইতিহাস"><History size={20} /></button>
                        <button onClick={() => { setSelectedCustomerForPayment(customer); setIsPaymentModalOpen(true); }} className="p-2.5 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all" title="বকেয়া জমা নিন"><Banknote size={20} /></button>
                        <button onClick={() => handleOpenEditModal(customer)} className="p-2.5 text-slate-400 hover:text-indigo-600 rounded-xl transition-all"><Edit3 size={18} /></button>
                        <button onClick={() => { if(confirm('ডিলিট করতে চান?')) deleteCustomer(customer.id); }} className="p-2.5 text-slate-400 hover:text-rose-600 rounded-xl transition-all"><Trash2 size={18} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl scale-up-center">
            <div className="flex justify-between border-b pb-4 items-center"><h2 className="text-xl font-bold text-slate-800">{editingCustomer ? 'তথ্য পরিবর্তন' : 'নতুন কাস্টমার'}</h2><button onClick={() => setIsModalOpen(false)}><X size={24} className="text-slate-400" /></button></div>
            <form onSubmit={(e) => {
              e.preventDefault(); if (!formData.name || !formData.phone) return;
              if (editingCustomer) { updateCustomer(editingCustomer.id, { ...formData, totalDue: Number(formData.initialDue) }); }
              else { addCustomer({ name: formData.name, phone: formData.phone, upazila: formData.upazila, totalDue: Number(formData.initialDue) }); }
              setIsModalOpen(false);
            }} className="space-y-5">
              <div><label className="block text-sm font-bold text-slate-600 mb-1.5">পূর্ণ নাম</label><input required className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="কাস্টমারের নাম" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} /></div>
              <div><label className="block text-sm font-bold text-slate-600 mb-1.5">ফোন নম্বর</label><input required className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="০১xxxxxxxxx" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} /></div>
              <div><label className="block text-sm font-bold text-slate-600 mb-1.5">উপজেলা</label><input className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="যেমন: মিরপুর" value={formData.upazila} onChange={(e) => setFormData({...formData, upazila: e.target.value})} /></div>
              <div><label className="block text-sm font-bold text-slate-600 mb-1.5">প্রারম্ভিক বকেয়া (৳)</label><input type="number" className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="0" value={formData.initialDue} onChange={(e) => setFormData({...formData, initialDue: e.target.value})} /></div>
              <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-bold shadow-lg shadow-indigo-100 active:scale-95 transition-all text-lg">সংরক্ষণ করুন</button>
            </form>
          </div>
        </div>
      )}

      {isPaymentModalOpen && selectedCustomerForPayment && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl scale-up-center">
            <div className="flex justify-between border-b pb-4 items-center"><h2 className="text-xl font-bold text-slate-800">বকেয়া জমা নিন</h2><button onClick={() => setIsPaymentModalOpen(false)}><X size={24} className="text-slate-400" /></button></div>
            <div className="bg-indigo-50/50 p-5 rounded-2xl border border-indigo-100 flex items-center gap-4"><div className="w-12 h-12 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-md"><Banknote size={24} /></div><div><p className="text-xs text-indigo-500 font-bold uppercase tracking-wider">বর্তমান মোট বকেয়া</p><p className="text-2xl font-black text-indigo-800">৳{selectedCustomerForPayment.totalDue.toLocaleString()}</p></div></div>
            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              <div><label className="block text-sm font-bold text-slate-700 mb-1.5">জমার পরিমাণ (৳)</label><input required autoFocus type="number" className="w-full p-4 border-2 border-slate-100 rounded-2xl text-3xl font-black text-emerald-600 outline-none focus:border-indigo-500 shadow-inner bg-slate-50" placeholder="0" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value === '' ? '' : Number(e.target.value))} /></div>
              <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4.5 rounded-2xl font-bold shadow-xl shadow-emerald-100 active:scale-95 transition-all text-lg flex items-center justify-center gap-2"><CheckCircle2 size={20} /><span>জমা নিশ্চিত করুন</span></button>
            </form>
          </div>
        </div>
      )}

      {isHistoryModalOpen && selectedCustomerForHistory && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4 backdrop-blur-md">
          <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] shadow-2xl scale-up-center overflow-hidden flex flex-col">
            <div className="p-6 border-b flex justify-between items-center bg-white">
              <div><h2 className="text-xl font-bold text-slate-800 flex items-center gap-2"><History size={22} className="text-indigo-600" />লেনদেনের স্টেটমেন্ট</h2><p className="text-sm text-slate-500 mt-0.5">{selectedCustomerForHistory.name} • {selectedCustomerForHistory.phone}</p></div>
              <div className="flex items-center space-x-2">
                <button disabled={isGeneratingHistoryPdf || customerTransactions.length === 0} onClick={generateHistoryPDF} className="flex items-center gap-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white px-4 py-2.5 rounded-xl font-bold transition-all disabled:opacity-50 text-sm shadow-sm">
                  {isGeneratingHistoryPdf ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                  <span>স্টেটমেন্ট ডাউনলোড</span>
                </button>
                <button onClick={() => setIsHistoryModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={24} className="text-slate-400" /></button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/30">
              {customerTransactions.map((tx) => (
                <div key={tx.id} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-4">
                      <div className={`p-3 rounded-2xl ${tx.totalAmount > 0 ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'}`}>{tx.totalAmount > 0 ? <ArrowUpRight size={24} /> : <ArrowDownLeft size={24} />}</div>
                      <div><p className="font-bold text-slate-800 text-lg leading-tight">{tx.totalAmount > 0 ? 'পণ্য বিক্রয়' : 'বকেয়া জমা'}</p><p className="text-xs text-slate-400 mt-1">{new Date(tx.date).toLocaleDateString('bn-BD')}</p></div>
                    </div>
                    <div className="text-right"><p className={`font-black text-xl ${tx.totalAmount > 0 ? 'text-slate-800' : 'text-emerald-600'}`}>৳{tx.paidAmount.toLocaleString()}</p><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">পরিশোধিত</p></div>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-6 bg-white border-t flex justify-between items-center shadow-lg"><div className="text-slate-500 font-medium text-sm">মোট <span className="text-indigo-600 font-bold">{customerTransactions.length}</span> টি লেনদেন</div><div className="flex items-center gap-2"><span className="text-slate-400 text-sm font-bold uppercase tracking-wider">বর্তমান মোট বকেয়া:</span><span className="text-2xl font-black text-rose-600">৳{selectedCustomerForHistory.totalDue.toLocaleString()}</span></div></div>
          </div>
        </div>
      )}

      {isSuccessModalOpen && lastPaymentRecord && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-[60] p-4 backdrop-blur-md">
          <div className="bg-white rounded-[40px] w-full max-w-sm p-8 text-center space-y-6 scale-up-center shadow-2xl border border-slate-100">
            <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto animate-bounce shadow-inner"><CheckCircle2 size={48} /></div>
            <div><h2 className="text-3xl font-black text-slate-800">টাকা জমা হয়েছে!</h2><p className="text-slate-500 mt-2 font-medium">কাস্টমার: {lastPaymentRecord.customerName}</p></div>
            <div className="bg-slate-50 rounded-2xl p-5 space-y-3 border border-slate-100">
              <div className="flex justify-between text-sm"><span className="text-slate-400 font-bold uppercase text-[10px]">জমার পরিমাণ:</span><span className="font-black text-emerald-600 text-lg">৳{lastPaymentRecord.paidAmount.toLocaleString()}</span></div>
              <div className="flex justify-between text-sm pt-3 border-t border-slate-200"><span className="text-slate-400 font-bold uppercase text-[10px]">বর্তমান বকেয়া:</span><span className="font-black text-rose-500 text-lg">৳{lastPaymentRecord.netDue.toLocaleString()}</span></div>
            </div>
            <div className="space-y-3 pt-4">
              <button disabled={isGeneratingPdf} onClick={() => generatePaymentPDF(lastPaymentRecord)} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4.5 rounded-2xl font-bold flex items-center justify-center space-x-2 shadow-xl shadow-indigo-100 active:scale-95 transition-all text-lg">{isGeneratingPdf ? <Loader2 className="animate-spin" size={20} /> : <Printer size={20} />}<span>রশিদ ডাউনলোড</span></button>
              <button onClick={() => setIsSuccessModalOpen(false)} className="w-full bg-slate-100 text-slate-500 py-3.5 rounded-2xl font-bold hover:bg-slate-200 transition-colors">বন্ধ করুন</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerManager;
