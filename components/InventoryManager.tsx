
import React, { useState, useMemo, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { Search, PackagePlus, Trash2, Edit3, Tag, Layers, Database, TrendingUp, X, Download, Upload } from 'lucide-react';

const InventoryManager = () => {
  const { products, transactions, addProduct, deleteProduct, updateProduct } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({ 
    name: '', 
    category: '', 
    quantity: 0, 
    buyingPrice: 0 
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Calculate stats for each product based on transactions
  const productStats = useMemo(() => {
    const stats: Record<string, { totalSoldQty: number; totalRevenue: number; totalCost: number }> = {};
    
    transactions.forEach(t => {
      t.items.forEach(item => {
        if (!stats[item.productId]) {
          stats[item.productId] = { totalSoldQty: 0, totalRevenue: 0, totalCost: 0 };
        }
        stats[item.productId].totalSoldQty += item.quantity;
        stats[item.productId].totalRevenue += item.totalPrice;
        stats[item.productId].totalCost += (item.quantity * item.unitBuyingPrice);
      });
    });
    
    return stats;
  }, [transactions]);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name || newProduct.quantity < 0) return;
    addProduct({
      ...newProduct,
      quantity: Number(newProduct.quantity),
      buyingPrice: Number(newProduct.buyingPrice)
    });
    setNewProduct({ name: '', category: '', quantity: 0, buyingPrice: 0 });
    setIsModalOpen(false);
  };

  const handleDownloadCSV = () => {
    if (filteredProducts.length === 0) return alert('ডাউনলোড করার জন্য কোনো পণ্য নেই');

    // CSV Headers
    const headers = ['পণ্যের নাম', 'ক্যাটাগরি', 'স্টক পরিমাণ', 'ক্রয়মূল্য (৳)'];
    
    // Format rows
    const rows = filteredProducts.map(p => [
      `"${p.name}"`,
      `"${p.category}"`,
      p.quantity,
      p.buyingPrice
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Create blob with BOM for UTF-8 (Bengali support in Excel)
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `Inventory_List_${new Date().toLocaleDateString('bn-BD')}.csv`);
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
      // Skip header row
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Parse CSV parts and clean quotes
        const parts = line.split(',').map(part => part.replace(/^"|"$/g, '').trim());
        
        if (parts.length >= 4) {
          const name = parts[0];
          const category = parts[1];
          const quantity = Number(parts[2]);
          const buyingPrice = Number(parts[3]);

          if (name && !isNaN(quantity) && !isNaN(buyingPrice)) {
            addProduct({ name, category, quantity, buyingPrice });
            importCount++;
          }
        }
      }

      if (importCount > 0) {
        alert(`সফলভাবে ${importCount} টি পণ্য ইনভেন্টরিতে যুক্ত করা হয়েছে!`);
      } else {
        alert('সঠিক ফরম্যাটের কোনো ডেটা পাওয়া যায়নি। নিশ্চিত করুন যে ফাইলটি নাম, ক্যাটাগরি, পরিমাণ ও ক্রয়মূল্য কলাম অনুসরণ করছে।');
      }
      
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">ইনভেন্টরি ও স্টক লাভ-ক্ষতি</h1>
          <p className="text-slate-500">আপনার পণ্যের মজুত ও লাভ-ক্ষতির বিস্তারিত বিবরণ</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input 
            type="file" 
            accept=".csv" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleImportCSV} 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center space-x-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-lg transition-colors border border-slate-200"
          >
            <Upload size={18} />
            <span className="hidden sm:inline">ইমপোর্ট করুন</span>
          </button>
          <button 
            onClick={handleDownloadCSV}
            className="flex items-center justify-center space-x-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-lg transition-colors border border-slate-200"
          >
            <Download size={18} />
            <span className="hidden sm:inline">ডাউনলোড করুন</span>
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg transition-colors shadow-sm"
          >
            <PackagePlus size={20} />
            <span>নতুন আইটেম</span>
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="পণ্যের নাম বা ক্যাটাগরি দিয়ে খুঁজুন..." 
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[800px]">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">পণ্যের নাম</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">স্টক</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-right">বিক্রয় (মোট)</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-right">ব্যয় (বিক্রিত)</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-right">নিট লাভ/ক্ষতি</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    কোনো পণ্য পাওয়া যায়নি
                  </td>
                </tr>
              ) : (
                filteredProducts.map(product => {
                  const stats = productStats[product.id] || { totalRevenue: 0, totalCost: 0, totalSoldQty: 0 };
                  const profit = stats.totalRevenue - stats.totalCost;
                  
                  return (
                    <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-800">{product.name}</p>
                        <p className="text-xs text-slate-400">{product.category}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className={`font-bold ${product.quantity < 5 ? 'text-rose-600' : 'text-slate-800'}`}>
                            {product.quantity} পিস
                          </span>
                          <span className="text-[10px] text-slate-400">ক্রয়: ৳{product.buyingPrice}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className="text-sm font-medium text-slate-600">৳{stats.totalRevenue.toLocaleString()}</p>
                        <p className="text-[10px] text-slate-400">বিক্রিত: {stats.totalSoldQty}</p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm text-slate-500">৳{stats.totalCost.toLocaleString()}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className={`inline-flex items-center space-x-1 font-bold ${profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          <span>{profit >= 0 ? '+' : ''}৳{profit.toLocaleString()}</span>
                          <TrendingUp size={14} className={profit < 0 ? 'rotate-180' : ''} />
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <button className="p-2 text-slate-400 hover:text-indigo-600 transition-colors">
                            <Edit3 size={16} />
                          </button>
                          <button 
                            onClick={() => {
                              if(confirm('আপনি কি এই পণ্যটি ডিলিট করতে চান?')) deleteProduct(product.id);
                            }}
                            className="p-2 text-slate-400 hover:text-rose-600 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl scale-up-center">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800">নতুন পণ্য যুক্ত করুন</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">পণ্যের নাম</label>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                  <input 
                    required
                    type="text" 
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="যেমন: লেদার ব্যাগ"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">ক্যাটাগরি</label>
                <div className="relative">
                  <Layers className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                  <input 
                    required
                    type="text" 
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="যেমন: এক্সেসরিজ"
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">স্টক পরিমাণ</label>
                  <div className="relative">
                    <Database className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                    <input 
                      required
                      type="number" 
                      min="0"
                      className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                      value={newProduct.quantity}
                      onChange={(e) => setNewProduct({...newProduct, quantity: Number(e.target.value)})}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">ক্রয়মূল্য (৳)</label>
                  <input 
                    required
                    type="number" 
                    min="0"
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                    value={newProduct.buyingPrice}
                    onChange={(e) => setNewProduct({...newProduct, buyingPrice: Number(e.target.value)})}
                  />
                </div>
              </div>
              <div className="pt-4">
                <button 
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg transition-colors shadow-lg"
                >
                  স্টকে যুক্ত করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryManager;
