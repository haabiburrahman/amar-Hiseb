
import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { 
  Plus, 
  Trash2, 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  X, 
  Filter,
  ArrowUpCircle,
  ArrowDownCircle,
  FileText
} from 'lucide-react';

const PersonalManager = () => {
  const { personalTransactions, addPersonalTransaction, deletePersonalTransaction } = useAppContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');
  
  const [formData, setFormData] = useState({
    type: 'expense' as 'income' | 'expense',
    amount: '',
    category: '',
    note: ''
  });

  const income = personalTransactions
    .filter(tx => tx.type === 'income')
    .reduce((sum, tx) => sum + tx.amount, 0);
    
  const expense = personalTransactions
    .filter(tx => tx.type === 'expense')
    .reduce((sum, tx) => sum + tx.amount, 0);
    
  const balance = income - expense;

  const filteredTx = personalTransactions.filter(tx => {
    if (filter === 'all') return true;
    return tx.type === filter;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || !formData.category) return;
    
    addPersonalTransaction({
      type: formData.type,
      amount: Number(formData.amount),
      category: formData.category,
      note: formData.note
    });
    
    setFormData({ type: 'expense', amount: '', category: '', note: '' });
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">পার্সোনাল হিসেব</h1>
          <p className="text-slate-500">আপনার ব্যক্তিগত আয় ও ব্যয়ের হিসাব রাখুন</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl transition-all shadow-lg"
        >
          <Plus size={20} />
          <span>এন্ট্রি যুক্ত করুন</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center space-x-4">
          <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl">
            <ArrowUpCircle size={24} />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">মোট আয়</p>
            <p className="text-xl font-bold text-slate-800">৳{income.toLocaleString()}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center space-x-4">
          <div className="p-3 bg-rose-100 text-rose-600 rounded-xl">
            <ArrowDownCircle size={24} />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">মোট ব্যয়</p>
            <p className="text-xl font-bold text-slate-800">৳{expense.toLocaleString()}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center space-x-4">
          <div className={`p-3 rounded-xl ${balance >= 0 ? 'bg-indigo-100 text-indigo-600' : 'bg-rose-100 text-rose-600'}`}>
            <Wallet size={24} />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">ব্যালেন্স</p>
            <p className={`text-xl font-bold ${balance >= 0 ? 'text-indigo-600' : 'text-rose-600'}`}>
              ৳{balance.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center space-x-2">
            <FileText size={18} className="text-slate-400" />
            <h3 className="font-bold text-slate-800">লেনদেনের তালিকা</h3>
          </div>
          <div className="flex bg-white border rounded-lg p-1">
            <button 
              onClick={() => setFilter('all')}
              className={`px-3 py-1 text-xs rounded-md transition-all ${filter === 'all' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
            >সব</button>
            <button 
              onClick={() => setFilter('income')}
              className={`px-3 py-1 text-xs rounded-md transition-all ${filter === 'income' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
            >আয়</button>
            <button 
              onClick={() => setFilter('expense')}
              className={`px-3 py-1 text-xs rounded-md transition-all ${filter === 'expense' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
            >ব্যয়</button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/80 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">তারিখ</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">ক্যাটাগরি</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">বিবরণ</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">পরিমাণ</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTx.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    কোনো তথ্য পাওয়া যায়নি
                  </td>
                </tr>
              ) : (
                filteredTx.map(tx => (
                  <tr key={tx.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {new Date(tx.date).toLocaleDateString('bn-BD')}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        tx.type === 'income' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                      }`}>
                        {tx.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {tx.note || '-'}
                    </td>
                    <td className={`px-6 py-4 text-right font-bold ${
                      tx.type === 'income' ? 'text-emerald-600' : 'text-rose-600'
                    }`}>
                      {tx.type === 'income' ? '+' : '-'} ৳{tx.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => deletePersonalTransaction(tx.id)}
                        className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl scale-up-center overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800">নতুন এন্ট্রি</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="flex bg-slate-100 p-1 rounded-xl">
                <button 
                  type="button"
                  onClick={() => setFormData({...formData, type: 'income'})}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
                    formData.type === 'income' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'
                  }`}
                >আয় (Income)</button>
                <button 
                  type="button"
                  onClick={() => setFormData({...formData, type: 'expense'})}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
                    formData.type === 'expense' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500'
                  }`}
                >ব্যয় (Expense)</button>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">পরিমাণ (৳)</label>
                <input 
                  required
                  type="number" 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-lg font-bold"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">ক্যাটাগরি</label>
                <select 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  required
                >
                  <option value="">নির্বাচন করুন</option>
                  {formData.type === 'income' ? (
                    <>
                      <option value="ব্যক্তিগত বেতন">ব্যক্তিগত বেতন</option>
                      <option value="বিনিয়োগ">বিনিয়োগ</option>
                      <option value="উপহার">উপহার</option>
                      <option value="অন্যান্য">অন্যান্য</option>
                    </>
                  ) : (
                    <>
                      <option value="বাসা ভাড়া">বাসা ভাড়া</option>
                      <option value="খাবার">খাবার</option>
                      <option value="যাতায়াত">যাতায়াত</option>
                      <option value="চিকিৎসা">চিকিৎসা</option>
                      <option value="বাজার">বাজার</option>
                      <option value="অন্যান্য">অন্যান্য</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">বিবরণ (ঐচ্ছিক)</label>
                <textarea 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                  rows={3}
                  placeholder="কিছু লিখে রাখুন..."
                  value={formData.note}
                  onChange={(e) => setFormData({...formData, note: e.target.value})}
                ></textarea>
              </div>

              <div className="pt-2">
                <button 
                  type="submit"
                  className={`w-full text-white font-bold py-4 rounded-2xl transition-all shadow-lg ${
                    formData.type === 'income' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PersonalManager;
