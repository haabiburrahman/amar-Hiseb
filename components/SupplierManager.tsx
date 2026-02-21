import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { 
  Truck, 
  Plus, 
  Search, 
  Phone, 
  Building2, 
  Trash2, 
  X, 
  History,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Wallet
} from 'lucide-react';

const SupplierManager = () => {
  const { 
    suppliers, 
    supplierTransactions, 
    addSupplier, 
    updateSupplier, 
    deleteSupplier, 
    addSupplierTransaction,
    deleteSupplierTransaction
  } = useAppContext();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [newSupplier, setNewSupplier] = useState({ name: '', phone: '', company: '', totalDue: 0 });
  const [newTx, setNewTx] = useState({ amount: 0, type: 'payment' as 'payment' | 'purchase', note: '' });

  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.phone.includes(searchTerm)
  );

  const handleAddSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    await addSupplier(newSupplier);
    setNewSupplier({ name: '', phone: '', company: '', totalDue: 0 });
    setIsAddModalOpen(false);
  };

  const handleAddTx = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplier) return;
    await addSupplierTransaction({
      supplierId: selectedSupplier.id,
      supplierName: selectedSupplier.name,
      amount: newTx.amount,
      type: newTx.type,
      note: newTx.note
    });
    setNewTx({ amount: 0, type: 'payment', note: '' });
    setIsTxModalOpen(false);
  };

  const supplierHistory = selectedSupplier 
    ? supplierTransactions.filter(t => t.supplierId === selectedSupplier.id)
    : [];

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">সাপ্লায়ার ম্যানেজমেন্ট</h1>
          <p className="text-slate-500 text-sm">আপনার পাইকারি বিক্রেতাদের হিসেব রাখুন</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center space-x-2 shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
        >
          <Plus size={20} />
          <span>নতুন সাপ্লায়ার</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-slate-500 text-sm font-medium mb-1">মোট সাপ্লায়ার</p>
          <h3 className="text-2xl font-bold text-slate-800">{suppliers.length} জন</h3>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-slate-500 text-sm font-medium mb-1">মোট বকেয়া (পাওনা)</p>
          <h3 className="text-2xl font-bold text-rose-600">৳{suppliers.reduce((sum, s) => sum + s.totalDue, 0).toLocaleString()}</h3>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-slate-500 text-sm font-medium mb-1">আজকের লেনদেন</p>
          <h3 className="text-2xl font-bold text-indigo-600">
            ৳{supplierTransactions
              .filter(t => new Date(t.date).toDateString() === new Date().toDateString())
              .reduce((sum, t) => sum + t.amount, 0).toLocaleString()}
          </h3>
        </div>
      </div>

      {/* Search and List */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-slate-50/50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="সাপ্লায়ারের নাম, কোম্পানি বা ফোন দিয়ে খুঁজুন..."
              className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-sm uppercase tracking-wider">
                <th className="px-6 py-4 font-bold">সাপ্লায়ার ও কোম্পানি</th>
                <th className="px-6 py-4 font-bold">যোগাযোগ</th>
                <th className="px-6 py-4 font-bold">মোট বকেয়া</th>
                <th className="px-6 py-4 font-bold text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSuppliers.map(supplier => (
                <tr key={supplier.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold">
                        {supplier.name[0]}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">{supplier.name}</p>
                        <p className="text-xs text-slate-400 flex items-center gap-1">
                          <Building2 size={12} /> {supplier.company}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-slate-600 flex items-center gap-2">
                      <Phone size={14} className="text-slate-400" /> {supplier.phone}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`font-bold ${supplier.totalDue > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                      ৳{supplier.totalDue.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end space-x-2">
                      <button 
                        onClick={() => { setSelectedSupplier(supplier); setIsTxModalOpen(true); }}
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold"
                        title="লেনদেন করুন"
                      >
                        <Wallet size={16} /> পেমেন্ট
                      </button>
                      <button 
                        onClick={() => { setSelectedSupplier(supplier); setIsHistoryModalOpen(true); }}
                        className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        title="হিস্ট্রি"
                      >
                        <History size={18} />
                      </button>
                      <button 
                        onClick={() => deleteSupplier(supplier.id)}
                        className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="মুছে ফেলুন"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredSuppliers.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                    <Truck size={48} className="mx-auto mb-4 opacity-20" />
                    <p>কোনো সাপ্লায়ার পাওয়া যায়নি</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Supplier Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl scale-up-center overflow-hidden">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50/50">
              <h2 className="text-xl font-bold text-slate-800">নতুন সাপ্লায়ার যোগ করুন</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                <X size={24} className="text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleAddSupplier} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">সাপ্লায়ারের নাম</label>
                <input required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="নাম লিখুন" value={newSupplier.name} onChange={(e) => setNewSupplier({...newSupplier, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">কোম্পানির নাম</label>
                <input required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="কোম্পানির নাম লিখুন" value={newSupplier.company} onChange={(e) => setNewSupplier({...newSupplier, company: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">ফোন নম্বর</label>
                <input required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="ফোন নম্বর লিখুন" value={newSupplier.phone} onChange={(e) => setNewSupplier({...newSupplier, phone: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">পূর্বের বকেয়া (ঐচ্ছিক)</label>
                <input type="number" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="0" value={newSupplier.totalDue} onChange={(e) => setNewSupplier({...newSupplier, totalDue: Number(e.target.value)})} />
              </div>
              <button type="submit" className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold shadow-lg hover:bg-indigo-700 transition-all">সংরক্ষণ করুন</button>
            </form>
          </div>
        </div>
      )}

      {/* Transaction Modal */}
      {isTxModalOpen && selectedSupplier && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl scale-up-center overflow-hidden">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50/50">
              <div>
                <h2 className="text-xl font-bold text-slate-800">লেনদেন এন্ট্রি</h2>
                <p className="text-xs text-slate-500">{selectedSupplier.name} ({selectedSupplier.company})</p>
              </div>
              <button onClick={() => setIsTxModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                <X size={24} className="text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleAddTx} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
                <button 
                  type="button"
                  onClick={() => setNewTx({...newTx, type: 'payment'})}
                  className={`py-2 rounded-lg font-bold text-sm transition-all ${newTx.type === 'payment' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
                >
                  টাকা পরিশোধ
                </button>
                <button 
                  type="button"
                  onClick={() => setNewTx({...newTx, type: 'purchase'})}
                  className={`py-2 rounded-lg font-bold text-sm transition-all ${newTx.type === 'purchase' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500'}`}
                >
                  পণ্য ক্রয় (বকেয়া)
                </button>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">টাকার পরিমাণ</label>
                <input required type="number" className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-2xl font-black text-indigo-600 outline-none focus:border-indigo-500" placeholder="0" value={newTx.amount || ''} onChange={(e) => setNewTx({...newTx, amount: Number(e.target.value)})} />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">নোট (ঐচ্ছিক)</label>
                <textarea className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" rows={2} placeholder="লেনদেনের বিবরণ..." value={newTx.note} onChange={(e) => setNewTx({...newTx, note: e.target.value})} />
              </div>
              <button type="submit" className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold shadow-lg hover:bg-indigo-700 transition-all">লেনদেন সম্পন্ন করুন</button>
            </form>
          </div>
        </div>
      )}

      {/* History Modal */}
      {isHistoryModalOpen && selectedSupplier && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl scale-up-center overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50/50">
              <div>
                <h2 className="text-xl font-bold text-slate-800">লেনদেন হিস্ট্রি</h2>
                <p className="text-xs text-slate-500">{selectedSupplier.name} - {selectedSupplier.company}</p>
              </div>
              <button onClick={() => setIsHistoryModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                <X size={24} className="text-slate-400" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                {supplierHistory.map(tx => (
                  <div key={tx.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center space-x-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.type === 'payment' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                        {tx.type === 'payment' ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">{tx.type === 'payment' ? 'টাকা পরিশোধ' : 'পণ্য ক্রয় (বকেয়া)'}</p>
                        <p className="text-xs text-slate-400 flex items-center gap-1">
                          <Calendar size={12} /> {new Date(tx.date).toLocaleDateString('bn-BD')}
                        </p>
                        {tx.note && <p className="text-[10px] text-slate-500 mt-1 italic">নোট: {tx.note}</p>}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold text-lg ${tx.type === 'payment' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {tx.type === 'payment' ? '-' : '+'} ৳{tx.amount.toLocaleString()}
                      </p>
                      <button 
                        onClick={() => deleteSupplierTransaction(tx.id)}
                        className="text-[10px] text-rose-400 hover:text-rose-600 font-bold"
                      >
                        ডিলিট
                      </button>
                    </div>
                  </div>
                ))}
                {supplierHistory.length === 0 && (
                  <div className="text-center py-12 text-slate-400">
                    <p>এখনো কোনো লেনদেন করা হয়নি</p>
                  </div>
                )}
              </div>
            </div>
            <div className="p-6 bg-slate-50 border-t flex justify-between items-center">
              <span className="text-slate-500 font-bold">বর্তমান মোট বকেয়া:</span>
              <span className={`text-xl font-black ${selectedSupplier.totalDue > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                ৳{selectedSupplier.totalDue.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupplierManager;
