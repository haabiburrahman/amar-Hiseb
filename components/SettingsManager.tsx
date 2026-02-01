import React, { useState, useRef, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { storage } from '../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Store, Save, CheckCircle, MapPin, Phone, Image as ImageIcon, Palette, Type, X, Database, Trash2, RefreshCcw, Loader2 } from 'lucide-react';

const SettingsManager = () => {
  const { storeName, storeAddress, storePhone, storeLogo, invoiceColor, invoiceFont, updateStoreDetails, loadDemoData } = useAppContext();
  const { user } = useAuth();
  
  const [details, setDetails] = useState({
    name: '',
    address: '',
    phone: '',
    logo: '',
    color: '',
    font: ''
  });

  // Sync internal state with context when context loads from Firestore
  useEffect(() => {
    setDetails({
      name: storeName,
      address: storeAddress,
      phone: storePhone,
      logo: storeLogo,
      color: invoiceColor,
      font: invoiceFont
    });
  }, [storeName, storeAddress, storePhone, storeLogo, invoiceColor, invoiceFont]);
  
  const [isUploading, setIsUploading] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateStoreDetails(details);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    try {
      setIsUploading(true);
      const storageRef = ref(storage, `logos/${user.uid}_${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      setDetails(prev => ({ ...prev, logo: downloadURL }));
      await updateStoreDetails({ ...details, logo: downloadURL });
      alert('লোগো সফলভাবে আপলোড হয়েছে!');
    } catch (error: any) {
      console.error("Upload error:", error);
      alert('আপলোড করতে সমস্যা হয়েছে: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">সেটিংস ও কাস্টমাইজেশন</h1>
        <p className="text-slate-500">দোকানের তথ্য এবং ইনভয়েস ডিজাইন পরিবর্তন করুন</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center space-x-2">
            <Store size={20} className="text-indigo-600" />
            <h3 className="text-lg font-bold text-slate-800">দোকানের তথ্য</h3>
          </div>
          
          <form onSubmit={handleSave} className="p-6 space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">দোকানের নাম</label>
                <div className="relative">
                  <Store className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input 
                    type="text" 
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={details.name}
                    onChange={(e) => setDetails({...details, name: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">ঠিকানা</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 text-slate-300" size={18} />
                  <textarea 
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={details.address}
                    onChange={(e) => setDetails({...details, address: e.target.value})}
                    rows={2}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">ফোন নম্বর</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input 
                    type="text" 
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={details.phone}
                    onChange={(e) => setDetails({...details, phone: e.target.value})}
                    required
                  />
                </div>
              </div>
            </div>

            <button type="submit" className="flex items-center space-x-2 bg-indigo-600 text-white px-6 py-3 rounded-xl transition-all shadow-lg hover:bg-indigo-700">
              <Save size={18} />
              <span>পরিবর্তন সংরক্ষণ করুন</span>
            </button>
            {saved && <span className="text-emerald-600 ml-4 font-bold flex items-center inline-flex gap-1 animate-bounce"><CheckCircle size={16}/> সেভ হয়েছে!</span>}
          </form>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-6">
            <div className="flex items-center space-x-2 border-b pb-4 mb-4">
              <ImageIcon size={20} className="text-indigo-600" />
              <h3 className="text-lg font-bold">দোকানের লোগো</h3>
            </div>
            
            <div className="flex items-center space-x-6">
              <div className="w-32 h-32 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center overflow-hidden relative group">
                {details.logo ? (
                  <img src={details.logo} alt="Logo" className="w-full h-full object-contain p-2" />
                ) : (
                  <ImageIcon className="text-slate-300" size={32} />
                )}
                {isUploading && (
                  <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                    <Loader2 className="animate-spin text-indigo-600" size={24} />
                  </div>
                )}
              </div>
              
              <div className="flex-1 space-y-3">
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  ref={fileInputRef} 
                  onChange={handleLogoUpload}
                  disabled={isUploading}
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl transition-all disabled:opacity-50"
                >
                  {isUploading ? 'আপলোড হচ্ছে...' : 'লোগো পরিবর্তন করুন'}
                </button>
                <p className="text-xs text-slate-400">আপনার লোগোটি রিয়েল-টাইম ক্লাউড স্টোরেজে সেভ হবে।</p>
              </div>
            </div>
          </div>

          <div className="bg-rose-50 rounded-2xl border border-rose-100 p-6">
            <div className="flex items-center space-x-2 mb-4">
              <RefreshCcw size={20} className="text-rose-600" />
              <h3 className="text-lg font-bold text-rose-800">অ্যাডভান্সড অপশন</h3>
            </div>
            <button 
              onClick={loadDemoData}
              className="w-full bg-white border border-rose-200 text-rose-600 font-bold py-3 rounded-xl hover:bg-rose-100 transition-all flex items-center justify-center space-x-2"
            >
              <Database size={18} />
              <span>ডিমো ডেটা লোড করুন (Cloud Sync)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsManager;