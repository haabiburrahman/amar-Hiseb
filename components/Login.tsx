import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Store, Mail, Lock, LogIn, Loader2, AlertCircle } from 'lucide-react';

const Login = () => {
  const { login, signup } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await signup(email, password);
      }
    } catch (err: any) {
      console.error(err.code, err.message);
      
      // Handling specific Firebase Error Codes
      if (err.code === 'auth/invalid-credential') {
        setError('ইমেইল বা পাসওয়ার্ড সঠিক নয়। দয়া করে আবার চেক করুন।');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('এই ইমেইলটি ইতিমধ্যেই ব্যবহৃত হয়েছে। দয়া করে লগইন করুন বা অন্য ইমেইল দিন।');
      } else if (err.code === 'auth/user-not-found') {
        setError('এই ইমেইল দিয়ে কোনো একাউন্ট পাওয়া যায়নি।');
      } else if (err.code === 'auth/wrong-password') {
        setError('ভুল পাসওয়ার্ড। আবার চেষ্টা করুন।');
      } else if (err.code === 'auth/weak-password') {
        setError('পাসওয়ার্ডটি অন্তত ৬ অক্ষরের হতে হবে।');
      } else {
        setError('একটি সমস্যা হয়েছে। দয়া করে ইন্টারনেট কানেকশন চেক করে আবার চেষ্টা করুন।');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-xl overflow-hidden border border-slate-100">
        <div className="p-8 text-center bg-indigo-600 text-white">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-md">
            <Store size={32} />
          </div>
          <h1 className="text-2xl font-bold">Amar Hisab</h1>
          <p className="text-indigo-100 text-sm mt-1">আপনার ব্যবসার স্মার্ট সলিউশন</p>
        </div>

        <div className="p-8">
          <h2 className="text-xl font-bold text-slate-800 mb-6 text-center">
            {isLogin ? 'সিস্টেমে লগইন করুন' : 'নতুন একাউন্ট খুলুন'}
          </h2>

          {error && (
            <div className="mb-6 p-4 bg-rose-50 text-rose-600 rounded-xl text-sm flex items-start space-x-2 border border-rose-100 animate-pulse">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">ইমেইল ঠিকানা</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  required
                  type="email" 
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  placeholder="name@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">পাসওয়ার্ড</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  required
                  type="password" 
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button 
              disabled={loading}
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-indigo-100 flex items-center justify-center space-x-2 disabled:opacity-70"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  <LogIn size={20} />
                  <span>{isLogin ? 'লগইন করুন' : 'রেজিস্ট্রেশন করুন'}</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-slate-500 text-sm">
              {isLogin ? 'আপনার কোনো একাউন্ট নেই?' : 'আপনার আগে থেকেই একাউন্ট আছে?'}
              <button 
                onClick={() => setIsLogin(!isLogin)}
                className="ml-2 text-indigo-600 font-bold hover:underline"
              >
                {isLogin ? 'নতুন একাউন্ট খুলুন' : 'লগইন করুন'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;