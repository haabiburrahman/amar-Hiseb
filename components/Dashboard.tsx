
import React from 'react';
import { useAppContext } from '../context/AppContext';
import { 
  Users, 
  Package, 
  TrendingUp, 
  Wallet,
  AlertCircle,
  Database,
  ArrowRight
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

const MetricCard = ({ title, value, icon: Icon, color, subValue }: any) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
    <div className="flex items-center justify-between mb-4">
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon size={24} className="text-white" />
      </div>
      <span className="text-2xl font-bold text-slate-800">{value}</span>
    </div>
    <h3 className="text-slate-500 font-medium">{title}</h3>
    {subValue && <p className="text-sm text-slate-400 mt-1">{subValue}</p>}
  </div>
);

const Dashboard = () => {
  const { customers, products, transactions, storeName, loadDemoData } = useAppContext();

  const totalSales = transactions.reduce((sum, t) => sum + t.totalAmount, 0);
  const totalProfit = transactions.reduce((sum, t) => sum + t.profit, 0);
  const totalDue = customers.reduce((sum, c) => sum + c.totalDue, 0);

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
        />
        <MetricCard 
          title="মোট বিক্রয়" 
          value={`৳${totalSales.toLocaleString()}`} 
          icon={TrendingUp} 
          color="bg-emerald-500" 
        />
        <MetricCard 
          title="মোট লাভ" 
          value={`৳${totalProfit.toLocaleString()}`} 
          icon={Wallet} 
          color="bg-indigo-500" 
        />
        <MetricCard 
          title="মোট বাকি (Due)" 
          value={`৳${totalDue.toLocaleString()}`} 
          icon={AlertCircle} 
          color="bg-rose-500" 
          subValue={`${customers.filter(c => c.totalDue > 0).length} জন বাকি আছেন`}
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
    </div>
  );
};

export default Dashboard;
