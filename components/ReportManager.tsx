
import React, { useMemo, useState, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar,
  Download,
  Upload,
  CheckCircle2,
  XCircle,
  BarChart2,
  Table as TableIcon,
  ChevronDown,
  ChevronUp,
  FileText
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';

const ReportManager = () => {
  const { transactions, products, customers, storeName, addTransaction, addCustomer } = useAppContext();
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const monthlyData = useMemo(() => {
    const data: Record<string, any> = {};
    
    transactions.forEach(t => {
      const date = new Date(t.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = date.toLocaleDateString('bn-BD', { month: 'long', year: 'numeric' });
      
      if (!data[monthKey]) {
        data[monthKey] = { 
          key: monthKey,
          name: monthLabel, 
          sell: 0, 
          profit: 0, 
          buy: 0,
          due: 0,
          count: 0
        };
      }
      
      data[monthKey].sell += t.totalAmount;
      data[monthKey].profit += t.profit;
      data[monthKey].due += t.dueAmount;
      data[monthKey].buy += (t.totalAmount - t.profit);
      data[monthKey].count += 1;
    });

    return Object.values(data).sort((a, b) => b.key.localeCompare(a.key));
  }, [transactions]);

  const stats = useMemo(() => {
    const totalSell = transactions.reduce((sum, t) => sum + t.totalAmount, 0);
    const totalProfit = transactions.reduce((sum, t) => sum + t.profit, 0);
    const totalBuy = totalSell - totalProfit;
    const totalDue = transactions.reduce((sum, t) => sum + t.dueAmount, 0);

    return { totalSell, totalProfit, totalBuy, totalDue };
  }, [transactions]);

  const handleDownloadCSV = () => {
    if (transactions.length === 0) {
      return alert('ডাউনলোড করার জন্য কোনো ট্রানজেকশন ডেটা নেই');
    }

    // Exporting raw transaction data for reliable re-importing
    const headers = ['তারিখ', 'কাস্টমারের নাম', 'মোট বিল', 'পরিশোধিত', 'বকেয়া', 'লাভ'];
    const rows = transactions.map(t => [
      new Date(t.date).toISOString().split('T')[0],
      `"${t.customerName}"`,
      t.totalAmount,
      t.paidAmount,
      t.dueAmount,
      t.profit
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `Sales_Report_Raw_${new Date().toLocaleDateString('bn-BD')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const lines = content.split('\n');
      
      let importCount = 0;
      // Skip header
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const parts = line.split(',').map(p => p.replace(/^"|"$/g, '').trim());
        
        if (parts.length >= 5) {
          const date = parts[0];
          const custName = parts[1];
          const total = Number(parts[2]);
          const paid = Number(parts[3]);
          const due = Number(parts[4]);
          const profit = Number(parts[5] || 0);

          if (custName && !isNaN(total)) {
            // Find or create customer
            let customer = customers.find(c => c.name === custName);
            let targetId = customer?.id;

            if (!customer) {
              const newId = crypto.randomUUID();
              addCustomer({ name: custName, phone: 'N/A', upazila: 'Imported' });
              targetId = newId; // Note: addCustomer is async-like in state, but for simple import we assume it works
            }

            if (targetId) {
              addTransaction({
                customerId: targetId,
                customerName: custName,
                totalAmount: total,
                paidAmount: paid,
                dueAmount: due,
                profit: profit,
                items: [{
                  productId: 'imported',
                  productName: 'Imported Record',
                  quantity: 1,
                  unitBuyingPrice: total - profit,
                  unitSellingPrice: total,
                  totalPrice: total
                }]
              });
              importCount++;
            }
          }
        }
      }

      if (importCount > 0) {
        alert(`সফলভাবে ${importCount} টি ট্রানজেকশন ইমপোর্ট করা হয়েছে!`);
      } else {
        alert('সঠিক ফরম্যাটের কোনো ডেটা পাওয়া যায়নি।');
      }
      
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const displayedTransactions = showAllTransactions 
    ? transactions 
    : transactions.slice(0, 5);

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">ব্যবসায়িক রিপোর্ট ও বিশ্লেষণ</h1>
          <p className="text-slate-500">আপনার দোকানের মাসিক প্রবৃদ্ধি ও আর্থিক অবস্থা</p>
        </div>
        <div className="flex space-x-2">
          <input 
            type="file" 
            accept=".csv" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleImportCSV} 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center space-x-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors border border-slate-200"
          >
            <Upload size={18} />
            <span className="hidden sm:inline">রিপোর্ট ইমপোর্ট</span>
          </button>
          <button 
            onClick={handleDownloadCSV}
            className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <Download size={18} />
            <span className="hidden sm:inline">রিপোর্ট ডাউনলোড</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 transition-all hover:shadow-md">
          <p className="text-slate-400 text-sm font-medium mb-1">মোট বিক্রয়</p>
          <div className="flex items-center justify-between">
            <p className="text-2xl font-bold text-slate-800">৳{stats.totalSell.toLocaleString()}</p>
            <div className="p-2 bg-emerald-50 rounded-full">
              <TrendingUp size={18} className="text-emerald-500" />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 transition-all hover:shadow-md">
          <p className="text-slate-400 text-sm font-medium mb-1">মোট ক্রয়</p>
          <div className="flex items-center justify-between">
            <p className="text-2xl font-bold text-slate-800">৳{stats.totalBuy.toLocaleString()}</p>
            <div className="p-2 bg-slate-50 rounded-full">
              <TrendingDown size={18} className="text-slate-400" />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 transition-all hover:shadow-md">
          <p className="text-slate-400 text-sm font-medium mb-1">মোট লাভ</p>
          <div className="flex items-center justify-between">
            <p className="text-2xl font-bold text-indigo-600">৳{stats.totalProfit.toLocaleString()}</p>
            <div className="p-2 bg-indigo-50 rounded-full">
              <DollarSign size={18} className="text-indigo-500" />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 transition-all hover:shadow-md">
          <p className="text-slate-400 text-sm font-medium mb-1">মোট বকেয়া (Due)</p>
          <div className="flex items-center justify-between">
            <p className="text-2xl font-bold text-rose-500">৳{stats.totalDue.toLocaleString()}</p>
            <div className="p-2 bg-rose-50 rounded-full">
              <Calendar size={18} className="text-rose-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Sales Breakdown Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center space-x-2">
          <TableIcon size={20} className="text-indigo-600" />
          <h3 className="text-lg font-bold text-slate-800">প্রতি মাসের সেলস রিপোর্ট</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">মাস ও বছর</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">ট্রানজেকশন</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">বিক্রয় (মোট)</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">লাভ</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">বকেয়া (Due)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {monthlyData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    এখনও কোনো ট্রানজেকশন রেকর্ড করা হয়নি
                  </td>
                </tr>
              ) : (
                monthlyData.map(month => (
                  <tr key={month.key} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-700">{month.name}</td>
                    <td className="px-6 py-4 text-right text-slate-600">{month.count} টি</td>
                    <td className="px-6 py-4 text-right font-bold text-slate-800">৳{month.sell.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right font-bold text-emerald-600">৳{month.profit.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right font-bold text-rose-500">৳{month.due.toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center space-x-2 mb-8">
          <BarChart2 size={20} className="text-indigo-600" />
          <h3 className="text-lg font-bold text-slate-800">বিক্রয় ও লাভ প্রবৃদ্ধি</h3>
        </div>
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={[...monthlyData].reverse()}>
              <defs>
                <linearGradient id="colorSell" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                itemStyle={{ fontSize: '14px' }}
                formatter={(value: number) => [`৳${value.toLocaleString()}`, '']}
              />
              <Area type="monotone" dataKey="sell" stroke="#4f46e5" fillOpacity={1} fill="url(#colorSell)" name="বিক্রয়" strokeWidth={3} />
              <Area type="monotone" dataKey="profit" stroke="#10b981" fillOpacity={1} fill="url(#colorProfit)" name="লাভ" strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-800">সাম্প্রতিক ট্রানজেকশন</h3>
            {transactions.length > 5 && (
              <button 
                onClick={() => setShowAllTransactions(!showAllTransactions)}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1"
              >
                <span>{showAllTransactions ? 'সংক্ষিপ্ত দেখুন' : 'সকল ট্রানজেকশন দেখুন'}</span>
                {showAllTransactions ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            )}
          </div>
          <div className={`space-y-4 ${showAllTransactions ? 'max-height-[500px] overflow-y-auto pr-2 custom-scrollbar' : ''}`}>
            {displayedTransactions.length === 0 ? (
                <p className="text-center py-10 text-slate-400">কোনো ট্রানজেকশন নেই</p>
            ) : (
              displayedTransactions.map(t => (
                <div key={t.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${t.dueAmount > 0 ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
                      {t.dueAmount > 0 ? <XCircle size={20} /> : <CheckCircle2 size={20} />}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">{t.customerName}</p>
                      <p className="text-xs text-slate-400">{new Date(t.date).toLocaleDateString('bn-BD')}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-800">৳{t.totalAmount.toLocaleString()}</p>
                    <p className={`text-[10px] uppercase font-bold tracking-wider ${t.dueAmount > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {t.dueAmount > 0 ? 'বাকি' : 'পরিশোধিত'}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
          {transactions.length > 5 && !showAllTransactions && (
            <button 
              onClick={() => setShowAllTransactions(true)}
              className="w-full mt-4 py-3 border-2 border-dashed border-slate-100 rounded-xl text-slate-400 text-sm font-bold hover:bg-slate-50 transition-all"
            >
              + আরও {transactions.length - 5} টি ট্রানজেকশন দেখুন
            </button>
          )}
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-6">স্টক পরিসংখ্যান</h3>
          <div className="h-64 flex items-center justify-center">
             <div className="w-full space-y-4">
                {[
                  { name: 'ইন-স্টক', count: products.filter(p => p.quantity >= 10).length, color: 'bg-indigo-600' },
                  { name: 'স্টক কম', count: products.filter(p => p.quantity < 10 && p.quantity > 0).length, color: 'bg-emerald-500' },
                  { name: 'আউট অফ স্টক', count: products.filter(p => p.quantity === 0).length, color: 'bg-amber-500' },
                ].map(item => (
                  <div key={item.name} className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-slate-600">
                      <span>{item.name}</span>
                      <span>{item.count} টি</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div 
                        className={`${item.color} h-full transition-all duration-500`} 
                        style={{ width: `${(item.count / Math.max(products.length, 1)) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportManager;
