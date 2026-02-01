import React from 'react';
import { HashRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  ShoppingCart, 
  BarChart3, 
  Menu, 
  X,
  Store,
  Settings,
  Wallet,
  LogOut
} from 'lucide-react';
import { AppProvider, useAppContext } from './context/AppContext.tsx';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import Dashboard from './components/Dashboard.tsx';
import CustomerManager from './components/CustomerManager.tsx';
import InventoryManager from './components/InventoryManager.tsx';
import SalesManager from './components/SalesManager.tsx';
import ReportManager from './components/ReportManager.tsx';
import SettingsManager from './components/SettingsManager.tsx';
import PersonalManager from './components/PersonalManager.tsx';
import Login from './components/Login.tsx';

const AppContent = () => {
  const { user, loading, logout } = useAuth();
  const { storeName } = useAppContext();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'ড্যাশবোর্ড' },
    { to: '/customers', icon: Users, label: 'কাস্টমার' },
    { to: '/inventory', icon: Package, label: 'ইনভেন্টরি' },
    { to: '/sales', icon: ShoppingCart, label: 'বিক্রয়' },
    { to: '/personal', icon: Wallet, label: 'পার্সোনাল হিসেব' },
    { to: '/reports', icon: BarChart3, label: 'রিপোর্ট' },
    { to: '/settings', icon: Settings, label: 'সেটিংস' },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">
      {/* Mobile Header */}
      <header className="md:hidden bg-white border-b px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center space-x-2 text-indigo-600">
          <Store size={24} />
          <span className="font-bold text-lg tracking-tight">{storeName}</span>
        </div>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-slate-600">
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-white border-r transform transition-transform duration-200 ease-in-out md:relative md:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-full flex flex-col p-4">
          <div className="hidden md:flex items-center space-x-3 mb-8 px-4 py-2">
            <div className="bg-indigo-600 p-2 rounded-lg text-white">
              <Store size={24} />
            </div>
            <span className="font-bold text-xl text-slate-800 tracking-tight">{storeName}</span>
          </div>
          
          <nav className="flex-1 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  location.pathname === item.to 
                    ? 'bg-indigo-600 text-white shadow-lg' 
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <item.icon size={20} />
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
          </nav>

          <div className="pt-4 border-t border-slate-100">
            <button 
              onClick={() => logout()}
              className="flex items-center space-x-3 px-4 py-3 w-full text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            >
              <LogOut size={20} />
              <span className="font-medium">লগআউট</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-x-hidden">
        <div className="max-w-6xl mx-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/customers" element={<CustomerManager />} />
            <Route path="/inventory" element={<InventoryManager />} />
            <Route path="/sales" element={<SalesManager />} />
            <Route path="/personal" element={<PersonalManager />} />
            <Route path="/reports" element={<ReportManager />} />
            <Route path="/settings" element={<SettingsManager />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </main>

      {isSidebarOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-30 md:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}
    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <AppProvider>
        <HashRouter>
          <AppContent />
        </HashRouter>
      </AppProvider>
    </AuthProvider>
  );
};

export default App;