
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { 
  Users, 
  Package, 
  TrendingUp, 
  Wallet, 
  AlertCircle, 
  Database, 
  ArrowRight, 
  Truck,
  ChevronRight,
  Search,
  X,
  Phone,
  MessageSquare,
  Banknote,
  MapPin,
  ExternalLink,
  Copy,
  Check,
  Printer
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { Customer } from '../types';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: any;
  color: string;
  subValue?: string;
  onClick?: () => void;
  clickableHint?: string;
  badge?: string;
}

const MetricCard = ({ title, value, icon: Icon, color, subValue, onClick, clickableHint, badge }: MetricCardProps) => (
  <div 
    onClick={onClick}
    className={`bg-white p-6 rounded-xl shadow-sm border border-slate-100 transition-all ${
      onClick 
        ? 'cursor-pointer hover:shadow-md hover:border-indigo-200 active:scale-[0.99] group' 
        : ''
    }`}
  >
    <div className="flex items-center justify-between mb-4">
      <div className={`p-3 rounded-lg ${color} group-hover:scale-105 transition-transform`}>
        <Icon size={24} className="text-white" />
      </div>
      <div className="text-right">
        <span className="text-2xl font-bold text-slate-800">{value}</span>
        {badge && (
          <span className="block text-[11px] font-semibold text-rose-600 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-md mt-1">
            {badge}
          </span>
        )}
      </div>
    </div>
    <div className="flex items-center justify-between">
      <h3 className="text-slate-500 font-medium">{title}</h3>
      {onClick && (
        <span className="text-xs text-indigo-600 font-bold opacity-75 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
          {clickableHint || 'লিস্ট দেখুন'}
          <ChevronRight size={14} />
        </span>
      )}
    </div>
    {subValue && <p className="text-sm text-slate-400 mt-1">{subValue}</p>}
  </div>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const { customers, products, transactions, suppliers, storeName, loadDemoData, addTransaction } = useAppContext();

  const [isDueModalOpen, setIsDueModalOpen] = useState(false);
  const [dueSearchTerm, setDueSearchTerm] = useState('');
  const [dueSort, setDueSort] = useState<'highest' | 'lowest' | 'name'>('highest');
  const [quickPayCustomer, setQuickPayCustomer] = useState<Customer | null>(null);
  const [quickPayAmount, setQuickPayAmount] = useState<number | ''>('');
  const [copiedPhoneId, setCopiedPhoneId] = useState<string | null>(null);

  const totalSales = transactions.reduce((sum, t) => sum + t.totalAmount, 0);
  const totalProfit = transactions.reduce((sum, t) => sum + t.profit, 0);
  const totalDue = customers.reduce((sum, c) => sum + c.totalDue, 0);
  const totalSupplierDue = suppliers.reduce((sum, s) => sum + s.totalDue, 0);

  // Filter and sort customers with dues
  const dueCustomers = useMemo(() => {
    return customers.filter(c => c.totalDue > 0);
  }, [customers]);

  const filteredDueCustomers = useMemo(() => {
    const term = dueSearchTerm.toLowerCase();
    const list = dueCustomers.filter(c => 
      c.name.toLowerCase().includes(term) ||
      c.phone.includes(dueSearchTerm) ||
      (c.upazila && c.upazila.toLowerCase().includes(term))
    );

    if (dueSort === 'highest') {
      list.sort((a, b) => b.totalDue - a.totalDue);
    } else if (dueSort === 'lowest') {
      list.sort((a, b) => a.totalDue - b.totalDue);
    } else if (dueSort === 'name') {
      list.sort((a, b) => a.name.localeCompare(b.name, 'bn'));
    }
    return list;
  }, [dueCustomers, dueSearchTerm, dueSort]);

  const handleQuickPaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickPayCustomer || !quickPayAmount) return;
    const amount = Number(quickPayAmount);
    await addTransaction({
      customerId: quickPayCustomer.id,
      customerName: quickPayCustomer.name,
      customerPhone: quickPayCustomer.phone,
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
    });
    setQuickPayCustomer(null);
    setQuickPayAmount('');
  };

  const handleSendReminder = (c: Customer) => {
    const text = `আসসালামু আলাইকুম ${c.name}, ${storeName}-এ আপনার বকেয়া হিসাব রয়েছে ৳${c.totalDue.toLocaleString()}। অনুগ্রহ করে সুবিধাজনক সময়ে পরিশোধ করার জন্য অনুরোধ করা হলো। ধন্যবাদ।`;
    const cleanPhone = c.phone.replace(/[^0-9]/g, '');
    const intlPhone = cleanPhone.startsWith('0') ? '88' + cleanPhone : cleanPhone;
    const url = `https://wa.me/${intlPhone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleCopyReminder = (c: Customer) => {
    const text = `আসসালামু আলাইকুম ${c.name}, ${storeName}-এ আপনার বকেয়া হিসাব রয়েছে ৳${c.totalDue.toLocaleString()}। অনুগ্রহ করে সুবিধাজনক সময়ে পরিশোধ করার জন্য অনুরোধ করা হলো। ধন্যবাদ।`;
    navigator.clipboard.writeText(text);
    setCopiedPhoneId(c.id);
    setTimeout(() => setCopiedPhoneId(null), 2500);
  };

  const handlePrintDueList = () => {
    window.print();
  };

  if (transactions.length === 0 && products.length === 0 && customers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 bg-white rounded-3xl border border-dashed border-slate-200">
        <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-6">
          <Database size={40} />
        </div>
        <h1 className="text-3xl font-bold text-slate-800 mb-2">আপনার অ্যাপটি বর্তমানে খালি</h1>
        <p className="text-slate-500 max-w-md mb-8">
          ম্যানেজমেন্ট সিস্টেমটি শুরু করার জন্য পণ্য ও কাস্টমার যোগ করুন অথবা নিচের বাটনে ক্লিক করে ডিমো ডেটা লোড করুন।
        </p>
        <button 
          onClick={loadDemoData}
          className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 py-4 rounded-2xl transition-all shadow-xl shadow-indigo-100 active:scale-95"
        >
          <span>ডিমো ডেটা লোড করুন</span>
          <ArrowRight size={20} />
        </button>
      </div>
    );
  }

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dayStr = d.toLocaleDateString('bn-BD', { weekday: 'short' });
    const daySales = transactions
      .filter(t => new Date(t.date).toDateString() === d.toDateString())
      .reduce((sum, t) => sum + t.totalAmount, 0);
    return { name: dayStr, sales: daySales };
  }).reverse();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">ব্যবসায়িক পর্যালোচনা</h1>
        <p className="text-slate-500">স্বাগতম {storeName} ড্যাশবোর্ডে</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          title="মোট কাস্টমার" 
          value={customers.length} 
          icon={Users} 
          color="bg-blue-500" 
          onClick={() => navigate('/customers')}
          clickableHint="কাস্টমার দেখুন"
        />
        <MetricCard 
          title="মোট বিক্রয়" 
          value={`৳${totalSales.toLocaleString()}`} 
          icon={TrendingUp} 
          color="bg-emerald-500" 
          onClick={() => navigate('/sales')}
          clickableHint="বিক্রয় করুন"
        />
        <MetricCard 
          title="মোট লাভ" 
          value={`৳${totalProfit.toLocaleString()}`} 
          icon={Wallet} 
          color="bg-indigo-500" 
          onClick={() => navigate('/reports')}
          clickableHint="রিপোর্ট দেখুন"
        />
        <MetricCard 
          title="মোট বাকি (Due)" 
          value={`৳${totalDue.toLocaleString()}`} 
          icon={AlertCircle} 
          color="bg-rose-500" 
          subValue={`${dueCustomers.length} জন বাকি আছেন`}
          onClick={() => setIsDueModalOpen(true)}
          clickableHint="লিস্ট দেখুন"
          badge="ট্যাপ করে দেখুন"
        />
        <MetricCard 
          title="সাপ্লায়ার বকেয়া" 
          value={`৳${totalSupplierDue.toLocaleString()}`} 
          icon={Truck} 
          color="bg-orange-500" 
          subValue={`${suppliers.filter(s => s.totalDue > 0).length} জন পাওনাদার`}
          onClick={() => navigate('/suppliers')}
          clickableHint="সাপ্লায়ার দেখুন"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-6">গত ৭ দিনের বিক্রয়</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={last7Days}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => [`৳${value}`, 'বিক্রয়']}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="sales" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-6">সতর্কতা: স্টক কম</h3>
          <div className="space-y-4">
            {products.filter(p => p.quantity < 5).length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-slate-400">
                <Package size={48} className="mb-2 opacity-20" />
                <p>সব আইটেম পর্যাপ্ত আছে</p>
              </div>
            ) : (
              products.filter(p => p.quantity < 5).map(p => (
                <div key={p.id} className="flex items-center justify-between p-3 bg-rose-50 rounded-lg">
                  <div>
                    <p className="font-medium text-slate-800">{p.name}</p>
                    <p className="text-xs text-rose-500">{p.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-rose-600">{p.quantity} পিস</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Due Customers Modal (যাদের কাছে বাকি আছে তাদের লিস্ট) */}
      {isDueModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-3 sm:p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-slate-100 bg-gradient-to-r from-rose-50/50 via-white to-indigo-50/30 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-rose-500 text-white rounded-2xl shadow-md shadow-rose-200">
                  <AlertCircle size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800">যাদের কাছে বাকি আছে</h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                    বকেয়াদার কাস্টমারদের বিস্তারিত তালিকা ও তাগাদা
                  </p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setIsDueModalOpen(false);
                  setQuickPayCustomer(null);
                }}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Total Summary Banner */}
            <div className="px-5 sm:px-6 py-3.5 bg-rose-50/80 border-b border-rose-100/70 flex flex-wrap items-center justify-between gap-3 text-sm">
              <div className="flex items-center space-x-2 text-rose-800">
                <span className="font-medium text-slate-600">মোট বাকিদার:</span>
                <span className="font-bold bg-white px-2.5 py-0.5 rounded-lg border border-rose-200 text-rose-700">
                  {dueCustomers.length} জন
                </span>
              </div>
              <div className="flex items-center space-x-2 text-rose-800">
                <span className="font-medium text-slate-600">মোট বকেয়া টাকা:</span>
                <span className="font-black text-lg text-rose-700">
                  ৳{totalDue.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Search and Sort Filter Bar */}
            <div className="p-4 border-b border-slate-100 bg-slate-50/60 flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text"
                  placeholder="নাম, ফোন বা ঠিকানা দিয়ে খুঁজুন..."
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-rose-500 font-medium text-slate-800 placeholder-slate-400"
                  value={dueSearchTerm}
                  onChange={(e) => setDueSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <select 
                  value={dueSort} 
                  onChange={(e: any) => setDueSort(e.target.value)}
                  className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-rose-500"
                >
                  <option value="highest">সর্বোচ্চ বাকি আগে</option>
                  <option value="lowest">সর্বনিম্ন বাকি আগে</option>
                  <option value="name">নাম অনুযায়ী (A-Z)</option>
                </select>
                {dueSearchTerm && (
                  <button 
                    onClick={() => setDueSearchTerm('')}
                    className="text-xs text-slate-500 hover:text-slate-800 px-2 py-1 bg-slate-200/70 rounded-lg"
                  >
                    ক্লিয়ার
                  </button>
                )}
              </div>
            </div>

            {/* Customer List */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 divide-y divide-slate-100 space-y-3">
              {filteredDueCustomers.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Check size={32} />
                  </div>
                  <h4 className="text-slate-800 font-bold text-lg">
                    {dueCustomers.length === 0 ? 'কোনো কাস্টমারের কাছে বাকি নেই!' : 'খোঁজা কাস্টমার পাওয়া যায়নি'}
                  </h4>
                  <p className="text-slate-400 text-sm mt-1">
                    {dueCustomers.length === 0 
                      ? 'দোকানের সকল কাস্টমারের বকেয়া পরিশোধিত রয়েছে।' 
                      : 'অন্য নাম বা মোবাইল নম্বর দিয়ে অনুসন্ধান করে দেখুন।'}
                  </p>
                </div>
              ) : (
                filteredDueCustomers.map((customer) => (
                  <div 
                    key={customer.id} 
                    className="pt-3 first:pt-0 pb-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 p-3 rounded-2xl transition-all border border-transparent hover:border-slate-100"
                  >
                    <div className="flex items-start space-x-3.5">
                      <div className="w-11 h-11 rounded-2xl bg-rose-100 text-rose-700 font-black flex items-center justify-center text-lg shrink-0">
                        {customer.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-800 text-base">{customer.name}</h4>
                          {customer.upazila && (
                            <span className="inline-flex items-center gap-0.5 text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md font-medium">
                              <MapPin size={10} />
                              {customer.upazila}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <a 
                            href={`tel:${customer.phone}`} 
                            className="inline-flex items-center gap-1 text-xs text-indigo-600 font-semibold hover:underline bg-indigo-50/60 px-2 py-0.5 rounded"
                          >
                            <Phone size={11} />
                            <span>{customer.phone}</span>
                          </a>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 pl-14 sm:pl-0">
                      <div className="text-left sm:text-right">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">বকেয়ার পরিমাণ</span>
                        <span className="text-xl font-black text-rose-600">
                          ৳{customer.totalDue.toLocaleString()}
                        </span>
                      </div>

                      <div className="flex items-center space-x-1.5">
                        {/* Quick Pay Button */}
                        <button 
                          onClick={() => {
                            setQuickPayCustomer(customer);
                            setQuickPayAmount(customer.totalDue);
                          }}
                          className="flex items-center space-x-1 bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1.5 rounded-xl font-bold text-xs shadow-sm transition-all active:scale-95"
                          title="বকেয়া জমা নিন"
                        >
                          <Banknote size={14} />
                          <span className="hidden sm:inline">জমা নিন</span>
                        </button>

                        {/* WhatsApp / SMS Reminder */}
                        <button 
                          onClick={() => handleSendReminder(customer)}
                          className="p-1.5 text-emerald-600 hover:bg-emerald-50 border border-emerald-200 rounded-xl transition-all"
                          title="হোয়াটসঅ্যাপে তাগাদা মেসেজ পাঠান"
                        >
                          <MessageSquare size={16} />
                        </button>

                        {/* Copy SMS */}
                        <button 
                          onClick={() => handleCopyReminder(customer)}
                          className="p-1.5 text-slate-500 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all"
                          title="তাগাদা মেসেজ কপি করুন"
                        >
                          {copiedPhoneId === customer.id ? (
                            <Check size={16} className="text-emerald-600" />
                          ) : (
                            <Copy size={16} />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Quick Payment Drawer / Section */}
            {quickPayCustomer && (
              <div className="p-4 bg-indigo-50/70 border-t border-indigo-100 animate-in slide-in-from-bottom duration-150">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-indigo-700">বকেয়া জমা গ্রহণ:</span>
                    <span className="text-sm font-black text-slate-800">{quickPayCustomer.name}</span>
                    <span className="text-xs text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded">
                      বর্তমান বাকি: ৳{quickPayCustomer.totalDue.toLocaleString()}
                    </span>
                  </div>
                  <button 
                    onClick={() => {
                      setQuickPayCustomer(null);
                      setQuickPayAmount('');
                    }}
                    className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                  >
                    বাতিল
                  </button>
                </div>
                <form onSubmit={handleQuickPaySubmit} className="flex gap-2">
                  <div className="relative flex-1">
                    <input 
                      type="number"
                      min="1"
                      required
                      placeholder="জমার পরিমাণ (টাকা)"
                      className="w-full pl-7 pr-3 py-2 bg-white border border-indigo-200 rounded-xl font-bold text-slate-800 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                      value={quickPayAmount}
                      onChange={(e) => setQuickPayAmount(e.target.value === '' ? '' : Number(e.target.value))}
                      autoFocus
                    />
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">৳</span>
                  </div>
                  <button 
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-md transition-all whitespace-nowrap active:scale-95"
                  >
                    জমা নিশ্চিত করুন
                  </button>
                </form>
              </div>
            )}

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 border-t border-slate-100 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <button 
                onClick={() => {
                  setIsDueModalOpen(false);
                  navigate('/customers?filter=due');
                }}
                className="flex items-center justify-center space-x-2 text-indigo-600 hover:bg-indigo-50 border border-indigo-200 font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl transition-all"
              >
                <ExternalLink size={16} />
                <span>কাস্টমার ম্যানেজমেন্ট পেজে সম্পূর্ণ তালিকা দেখুন</span>
              </button>

              <div className="flex items-center justify-end space-x-2">
                <button 
                  onClick={handlePrintDueList}
                  className="flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs px-3 py-2 rounded-xl transition-all"
                  title="প্রিন্ট করুন"
                >
                  <Printer size={15} />
                  <span>প্রিন্ট</span>
                </button>
                <button 
                  onClick={() => setIsDueModalOpen(false)}
                  className="bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all"
                >
                  বন্ধ করুন
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

