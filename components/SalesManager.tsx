
import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext.tsx';
import { 
  ShoppingCart, 
  Trash2, 
  Download, 
  UserPlus, 
  X, 
  Loader2, 
  Contact,
  Plus,
  Minus,
  Edit2,
  Printer
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

const SalesManager = () => {
  const { 
    customers, products, addTransaction, addCustomer, 
    storeName, storeAddress, storePhone, invoiceColor 
  } = useAppContext();
  
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [cart, setCart] = useState<any[]>([]);
  const [paidAmount, setPaidAmount] = useState<number | ''>('');
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [lastTransaction, setLastTransaction] = useState<any>(null);

  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', upazila: '' });

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);
  const previousDue = selectedCustomer?.totalDue || 0;

  const addToCart = (product: any) => {
    const existing = cart.find(item => item.productId === product.id);
    if (existing) {
      if (existing.quantity >= product.quantity) return alert('পর্যাপ্ত স্টক নেই!');
      setCart(cart.map(item => item.productId === product.id ? { ...item, quantity: item.quantity + 1, totalPrice: (item.quantity + 1) * item.unitSellingPrice } : item));
    } else {
      if (product.quantity <= 0) return alert('আউট অফ স্টক!');
      const defaultSellingPrice = Math.round(product.buyingPrice * 1.2);
      setCart([...cart, { 
        productId: product.id, 
        productName: product.name, 
        quantity: 1, 
        unitBuyingPrice: product.buyingPrice,
        unitSellingPrice: defaultSellingPrice, 
        totalPrice: defaultSellingPrice
      }]);
    }
  };

  const updateCartItem = (productId: string, updates: any) => {
    setCart(cart.map(item => {
      if (item.productId === productId) {
        const newItem = { ...item, ...updates };
        newItem.totalPrice = newItem.quantity * newItem.unitSellingPrice;
        return newItem;
      }
      return item;
    }));
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.productId !== productId));
  };

  const currentBill = cart.reduce((sum, item) => sum + item.totalPrice, 0);
  const totalBuyingCost = cart.reduce((sum, item) => sum + (item.quantity * item.unitBuyingPrice), 0);
  const profit = currentBill - totalBuyingCost;
  const grandTotal = currentBill + previousDue;
  const actualPaid = paidAmount === '' ? 0 : Number(paidAmount);
  const finalDue = Math.max(0, grandTotal - actualPaid);

  const handleSelectFromContacts = async () => {
    if ('contacts' in navigator && 'select' in (navigator as any).contacts) {
      try {
        const props = ['name', 'tel'];
        const opts = { multiple: false };
        const contacts = await (navigator as any).contacts.select(props, opts);
        
        if (contacts && contacts.length > 0) {
          const contact = contacts[0];
          const name = contact.name?.[0] || '';
          const rawPhone = contact.tel?.[0] || '';
          const cleanPhone = rawPhone.replace(/\s+/g, '').replace(/-/g, '').replace(/\(/g, '').replace(/\)/g, '').replace(/^\+88/, '').replace(/^88/, '');
          
          setNewCustomer(prev => ({
            ...prev,
            name: name || prev.name,
            phone: cleanPhone || prev.phone
          }));
        }
      } catch (err) {
        console.error("Contact selection failed:", err);
      }
    } else {
      alert('আপনার ব্রাউজারটি কন্টাক্ট লিস্ট সাপোর্ট করে না।');
    }
  };

  const handleQuickCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomer.name || !newCustomer.phone) return;
    addCustomer({
      name: newCustomer.name,
      phone: newCustomer.phone,
      upazila: newCustomer.upazila || 'N/A'
    });
    setNewCustomer({ name: '', phone: '', upazila: '' });
    setIsCustomerModalOpen(false);
  };

  const handleCompleteSale = async () => {
    if (!selectedCustomerId || cart.length === 0) return alert('কাস্টমার এবং পণ্য সিলেক্ট করুন');
    
    const transaction = {
      customerId: selectedCustomerId,
      customerName: selectedCustomer?.name || 'Unknown',
      customerPhone: selectedCustomer?.phone || '',
      items: cart,
      totalAmount: currentBill,
      paidAmount: actualPaid,
      dueAmount: currentBill - actualPaid, 
      profit
    };

    await addTransaction(transaction);
    setLastTransaction({ 
      ...transaction, 
      id: crypto.randomUUID(), 
      date: Date.now(),
      prevDue: previousDue,
      netDue: finalDue
    });
    setIsSuccessModalOpen(true);
    setCart([]);
    setSelectedCustomerId('');
    setPaidAmount('');
  };

  const generatePDF = async (t: any) => {
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
            <h2 style="margin: 0; color: #1e293b; font-size: 28px; font-weight: 700;">ক্যাশ মেমো</h2>
            <p style="margin: 10px 0 0 0; font-size: 14px; color: #64748b;">ইনভয়েস নং: #${t.id.slice(0, 8).toUpperCase()}</p>
            <p style="margin: 4px 0 0 0; font-size: 14px; color: #64748b;">তারিখ: ${new Date(t.date).toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
        </div>

        <!-- Info Boxes -->
        <div style="display: flex; gap: 20px; margin-bottom: 40px;">
          <div style="flex: 1; background: #f8fafc; padding: 25px; border-radius: 16px; border: 1px solid #f1f5f9;">
            <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 700; color: #94a3b8; text-transform: uppercase; tracking: 1px;">বিল প্রাপক (Customer Details)</p>
            <h3 style="margin: 0; font-size: 20px; color: #1e293b; font-weight: 700;">${t.customerName}</h3>
            <p style="margin: 5px 0 0 0; font-size: 15px; color: #475569; font-weight: 500;">ফোন: ${t.customerPhone || 'N/A'}</p>
          </div>
          <div style="width: 200px; background: ${invoiceColor}10; padding: 25px; border-radius: 16px; border: 1px solid ${invoiceColor}20; text-align: center;">
            <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 700; color: ${invoiceColor}; text-transform: uppercase;">নিট বকেয়া</p>
            <h2 style="margin: 0; font-size: 24px; color: ${invoiceColor}; font-weight: 800;">৳${t.netDue.toLocaleString()}</h2>
          </div>
        </div>

        <!-- Items Table -->
        <table style="width: 100%; border-collapse: separate; border-spacing: 0; margin-bottom: 40px;">
          <thead>
            <tr style="background: ${invoiceColor}; color: white;">
              <th style="padding: 15px 20px; text-align: left; border-radius: 12px 0 0 12px; font-size: 15px;">পণ্যের নাম</th>
              <th style="padding: 15px 20px; text-align: center; font-size: 15px;">পরিমাণ</th>
              <th style="padding: 15px 20px; text-align: right; font-size: 15px;">একক মূল্য</th>
              <th style="padding: 15px 20px; text-align: right; border-radius: 0 12px 12px 0; font-size: 15px;">মোট</th>
            </tr>
          </thead>
          <tbody>
            ${t.items.map((item: any, index: number) => `
              <tr style="background: ${index % 2 === 0 ? '#ffffff' : '#f8fafc'};">
                <td style="padding: 18px 20px; border-bottom: 1px solid #f1f5f9; font-size: 15px; font-weight: 600;">${item.productName}</td>
                <td style="padding: 18px 20px; border-bottom: 1px solid #f1f5f9; text-align: center; font-size: 15px;">${item.quantity}</td>
                <td style="padding: 18px 20px; border-bottom: 1px solid #f1f5f9; text-align: right; font-size: 15px;">৳${item.unitSellingPrice.toLocaleString()}</td>
                <td style="padding: 18px 20px; border-bottom: 1px solid #f1f5f9; text-align: right; font-size: 15px; font-weight: 700;">৳${item.totalPrice.toLocaleString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <!-- Totals Section -->
        <div style="display: flex; justify-content: flex-end;">
          <div style="width: 350px;">
            <div style="display: flex; justify-content: space-between; padding: 12px 20px; font-size: 15px;">
              <span style="color: #64748b; font-weight: 500;">বর্তমান বিল:</span>
              <span style="font-weight: 700; color: #1e293b;">৳${t.totalAmount.toLocaleString()}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 12px 20px; font-size: 15px;">
              <span style="color: #64748b; font-weight: 500;">পূর্বের বকেয়া:</span>
              <span style="font-weight: 700; color: #e11d48;">৳${t.prevDue.toLocaleString()}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 12px 20px; font-size: 15px; background: #f0fdf4; border-radius: 8px; margin: 5px 0; color: #166534;">
              <span style="font-weight: 600;">নগদ জমা:</span>
              <span style="font-weight: 800;">(-) ৳${t.paidAmount.toLocaleString()}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 20px; margin-top: 10px; background: ${invoiceColor}; border-radius: 12px; color: white;">
              <span style="font-size: 18px; font-weight: 700;">নিট বকেয়া:</span>
              <span style="font-size: 22px; font-weight: 800;">৳${t.netDue.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div style="margin-top: 100px; display: flex; justify-content: space-between;">
           <div style="text-align: center; width: 220px;">
             <div style="height: 1px; background: #cbd5e1; margin-bottom: 10px;"></div>
             <div style="font-size: 14px; font-weight: 700; color: #475569;">ক্রেতার স্বাক্ষর</div>
           </div>
           <div style="text-align: center; width: 220px;">
             <div style="height: 1px; background: #cbd5e1; margin-bottom: 10px;"></div>
             <div style="font-size: 14px; font-weight: 700; color: #475569;">বিক্রেতার স্বাক্ষর</div>
           </div>
        </div>
        
        <div style="margin-top: 60px; text-align: center; border-top: 1px dashed #e2e8f0; padding-top: 25px;">
          <p style="margin: 0; font-size: 16px; font-weight: 700; color: #64748b;">আমাদের সাথে থাকার জন্য ধন্যবাদ!</p>
          <p style="margin: 5px 0 0 0; font-size: 12px; color: #94a3b8; letter-spacing: 0.5px;">সিস্টেম জেনারেটেড রশিদ - Amar Hisab</p>
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
      pdf.save(`Invoice_${t.customerName}_${new Date().getTime()}.pdf`);
    } catch (err) {
      console.error("PDF Generation Error:", err);
    } finally {
      element.innerHTML = '';
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-10">
      <div className="lg:col-span-2 space-y-6">
        <h1 className="text-2xl font-bold text-slate-800">বিক্রয় এন্ট্রি</h1>
        
        {/* Product Selection Grid */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-sm font-bold text-slate-500 mb-4 flex items-center gap-2">
             <ShoppingCart size={16}/> পণ্য নির্বাচন করুন
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {products.map(product => (
              <div 
                key={product.id} 
                onClick={() => addToCart(product)} 
                className={`p-3 border rounded-xl cursor-pointer hover:border-indigo-500 hover:shadow-md transition-all group ${product.quantity === 0 ? 'opacity-50 grayscale bg-slate-50 pointer-events-none' : 'bg-white'}`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-bold text-slate-800 text-sm line-clamp-1">{product.name}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${product.quantity < 5 ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-500'}`}>
                    স্টক: {product.quantity}
                  </span>
                </div>
                <div className="text-indigo-600 font-bold text-sm">৳{product.buyingPrice} <span className="text-[10px] text-slate-400 font-normal">(ক্রয়)</span></div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Cart Details */}
        {cart.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-4 border-b bg-slate-50/50 flex justify-between items-center">
              <span className="font-bold text-slate-700">কার্ট তালিকা ({cart.length})</span>
              <button onClick={() => setCart([])} className="text-xs text-rose-500 font-bold hover:underline">সব মুছুন</button>
            </div>
            <div className="divide-y divide-slate-50">
              {cart.map(item => (
                <div key={item.productId} className="p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1">
                    <p className="font-bold text-slate-800">{item.productName}</p>
                    <p className="text-[10px] text-slate-400">ক্রয়মূল্য: ৳{item.unitBuyingPrice}</p>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    {/* Quantity Control */}
                    <div className="flex flex-col items-center">
                      <label className="text-[10px] text-slate-400 mb-1 font-bold">পরিমাণ</label>
                      <div className="flex items-center space-x-1">
                        <button onClick={() => updateCartItem(item.productId, { quantity: Math.max(1, item.quantity - 1) })} className="p-1 bg-slate-100 rounded-lg hover:bg-slate-200"><Minus size={14}/></button>
                        <span className="w-8 text-center font-bold text-sm">{item.quantity}</span>
                        <button onClick={() => updateCartItem(item.productId, { quantity: item.quantity + 1 })} className="p-1 bg-slate-100 rounded-lg hover:bg-slate-200"><Plus size={14}/></button>
                      </div>
                    </div>

                    {/* Editable Selling Price */}
                    <div className="flex flex-col">
                      <label className="text-[10px] text-slate-400 mb-1 font-bold">বিক্রয়মূল্য (৳)</label>
                      <div className="relative">
                        <input 
                          type="number" 
                          className="w-24 p-1.5 border border-slate-200 rounded-lg text-sm font-bold bg-slate-50 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none"
                          value={item.unitSellingPrice}
                          onChange={(e) => updateCartItem(item.productId, { unitSellingPrice: Number(e.target.value) })}
                        />
                      </div>
                    </div>

                    {/* Item Total */}
                    <div className="flex flex-col items-end min-w-[80px]">
                      <label className="text-[10px] text-slate-400 mb-1 font-bold">মোট</label>
                      <span className="font-bold text-slate-800">৳{item.totalPrice}</span>
                    </div>

                    <button onClick={() => removeFromCart(item.productId)} className="p-2 text-rose-300 hover:text-rose-500 transition-colors"><Trash2 size={18} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Checkout Sidebar */}
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-2xl shadow-xl border border-slate-100 sticky top-8">
          <h3 className="text-lg font-bold text-slate-800 mb-6 border-b pb-4">পেমেন্ট ও অর্ডার</h3>
          
          <div className="space-y-4 mb-6">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-sm font-bold text-slate-600">কাস্টমার সিলেক্ট করুন</label>
                <button onClick={() => setIsCustomerModalOpen(true)} className="text-[10px] text-indigo-600 font-bold flex items-center space-x-1 px-2 py-1 bg-indigo-50 rounded-lg hover:bg-indigo-100">
                  <UserPlus size={12} />
                  <span>নতুন কাস্টমার</span>
                </button>
              </div>
              <select 
                className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-indigo-500 font-medium" 
                value={selectedCustomerId} 
                onChange={(e) => setSelectedCustomerId(e.target.value)}
              >
                <option value="">নির্বাচন করুন...</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>)}
              </select>
            </div>

            <div className="pt-4 space-y-3 bg-slate-50/50 p-4 rounded-2xl border border-slate-50">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">বর্তমান বিল:</span>
                <span className="font-bold text-slate-800">৳{currentBill}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">পূর্বের বকেয়া:</span>
                <span className="font-bold text-rose-500">৳{previousDue}</span>
              </div>
              <div className="flex justify-between font-bold text-xl text-indigo-600 pt-3 border-t border-slate-200">
                <span>মোট প্রদেয়:</span>
                <span>৳{grandTotal}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-600 mb-1">জমা (Paid Amount)</label>
              <input 
                type="number" 
                className="w-full p-4 border-2 border-slate-100 rounded-2xl text-2xl font-black text-indigo-600 outline-none focus:border-indigo-500 shadow-inner" 
                placeholder="0" 
                value={paidAmount} 
                onChange={(e) => setPaidAmount(e.target.value === '' ? '' : Number(e.target.value))} 
              />
            </div>

            <div className="flex justify-between p-3 bg-rose-50 rounded-xl border border-rose-100 font-bold text-rose-600">
              <span className="text-sm">নিট বকেয়া থাকবে:</span>
              <span className="text-lg">৳{finalDue}</span>
            </div>
          </div>
          
          <button 
            disabled={cart.length === 0 || !selectedCustomerId} 
            onClick={handleCompleteSale} 
            className="w-full bg-indigo-600 text-white py-4 rounded-[20px] font-bold text-lg shadow-lg shadow-indigo-100 disabled:opacity-50 disabled:shadow-none hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <ShoppingCart size={20}/> বিক্রয় সম্পন্ন করুন
          </button>
        </div>
      </div>

      {/* Add New Customer Modal */}
      {isCustomerModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl scale-up-center overflow-hidden">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50/50">
              <h2 className="text-xl font-bold text-slate-800">নতুন কাস্টমার যোগ করুন</h2>
              <button onClick={() => setIsCustomerModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                <X size={24} className="text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleQuickCustomerSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">পূর্ণ নাম</label>
                <div className="flex gap-2">
                  <input required className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="কাস্টমারের নাম" value={newCustomer.name} onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})} />
                  <button type="button" onClick={handleSelectFromContacts} className="p-3 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100 hover:bg-indigo-100 transition-colors">
                    <Contact size={24} />
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">ফোন নম্বর</label>
                <input required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="০১৭xxxxxxxx" value={newCustomer.phone} onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">উপজেলা (ঐচ্ছিক)</label>
                <input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="ঠিকানা/উপজেলা" value={newCustomer.upazila} onChange={(e) => setNewCustomer({...newCustomer, upazila: e.target.value})} />
              </div>
              <button type="submit" className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold shadow-lg hover:bg-indigo-700 transition-all">সংরক্ষণ করুন</button>
            </form>
          </div>
        </div>
      )}

      {/* Sale Success Modal */}
      {isSuccessModalOpen && lastTransaction && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-[70] p-4 backdrop-blur-md">
          <div className="bg-white rounded-[40px] w-full max-w-sm p-8 text-center space-y-6 scale-up-center shadow-2xl border border-slate-100">
            <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto animate-bounce shadow-inner">
               <ShoppingCart size={48} />
            </div>
            <div>
              <h2 className="text-3xl font-black text-slate-800">অর্ডার সম্পন্ন!</h2>
              <p className="text-slate-500 mt-2 font-medium">কাস্টমার: {lastTransaction.customerName}</p>
            </div>
            
            <div className="bg-slate-50 rounded-2xl p-4 space-y-2">
               <div className="flex justify-between text-sm">
                  <span className="text-slate-400">মোট বিল:</span>
                  <span className="font-bold text-slate-700">৳{lastTransaction.totalAmount.toLocaleString()}</span>
               </div>
               <div className="flex justify-between text-sm">
                  <span className="text-slate-400">জমা হয়েছে:</span>
                  <span className="font-bold text-emerald-600">৳{lastTransaction.paidAmount.toLocaleString()}</span>
               </div>
               <div className="flex justify-between text-sm pt-2 border-t border-slate-200">
                  <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">নিট বকেয়া:</span>
                  <span className="font-black text-rose-500">৳{lastTransaction.netDue.toLocaleString()}</span>
               </div>
            </div>

            <div className="space-y-3 pt-4">
              <button 
                disabled={isGeneratingPdf} 
                onClick={() => generatePDF(lastTransaction)} 
                className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center space-x-2 shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50"
              >
                {isGeneratingPdf ? <Loader2 className="animate-spin" size={20} /> : <Printer size={20} />}
                <span>{isGeneratingPdf ? 'রশিদ তৈরি হচ্ছে...' : 'মানি রশিদ ডাউনলোড'}</span>
              </button>
              <button 
                onClick={() => setIsSuccessModalOpen(false)} 
                className="w-full bg-slate-100 text-slate-500 py-3.5 rounded-2xl font-bold hover:bg-slate-200 transition-colors"
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

export default SalesManager;
