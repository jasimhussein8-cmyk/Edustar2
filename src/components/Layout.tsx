import { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { auth } from '../firebase';
import { UserProfile } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  Calendar, 
  Bell, 
  MessageSquare, 
  LogOut,
  GraduationCap,
  UserCheck,
  ClipboardList,
  Languages,
  ArrowLeft,
  ArrowRight,
  Menu,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface LayoutProps {
  user: UserProfile;
}

export default function Layout({ user }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, language, setLanguage, isRTL } = useLanguage();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/auth');
  };

  const navItems = [
    { icon: LayoutDashboard, label: t('dashboard'), path: '/' },
    { icon: Calendar, label: isRTL ? 'الجدول الأسبوعي' : 'Weekly Schedule', path: '/schedule' },
    { icon: Users, label: t('users'), path: '/users', roles: ['admin'] },
    { icon: BookOpen, label: t('classes'), path: '/classes', roles: ['admin', 'teacher'] },
    { icon: UserCheck, label: t('attendance'), path: '/attendance', roles: ['admin', 'teacher', 'parent', 'student'] },
    { icon: GraduationCap, label: t('grades'), path: '/grades', roles: ['admin', 'teacher', 'parent', 'student'] },
    { icon: ClipboardList, label: isRTL ? 'الواجبات' : 'Assignments', path: '/assignments', roles: ['teacher', 'student', 'admin'] },
    { icon: MessageSquare, label: t('messages'), path: '/messages' },
    { icon: Bell, label: t('notifications'), path: '/notifications' },
  ].filter(item => !item.roles || item.roles.includes(user.role));

  const isHome = location.pathname === '/';

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className={`flex h-screen bg-stone-50 text-stone-900 font-sans ${isRTL ? 'font-arabic' : ''} ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Sidebar Overlay for Mobile */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 ${isRTL ? 'right-0' : 'left-0'} 
        w-64 bg-white border-stone-200 flex flex-col z-50 transition-transform duration-300 transform
        ${isSidebarOpen ? 'translate-x-0' : (isRTL ? 'translate-x-full' : '-translate-x-full')}
        lg:translate-x-0 ${isRTL ? 'lg:border-l' : 'lg:border-r'}
      `}>
        <div className="p-6 border-b border-stone-100 flex items-center justify-between">
          <h1 className="text-xl font-bold text-emerald-700 flex items-center gap-2">
            <GraduationCap className="w-8 h-8" />
            {isRTL ? 'مدرستي الذكية' : 'SmartSchool'}
          </h1>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 text-stone-400">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsSidebarOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium ${
                location.pathname === item.path 
                  ? 'bg-emerald-50 text-emerald-700' 
                  : 'text-stone-600 hover:bg-stone-100 hover:text-emerald-700'
              } ${isRTL ? 'flex-row-reverse' : ''}`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-stone-100">
          <button
            onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-stone-100 text-stone-600 transition-colors font-medium mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}
          >
            <Languages className="w-5 h-5" />
            {language === 'en' ? 'العربية' : 'English'}
          </button>
          
          <div className={`flex items-center gap-3 px-4 py-3 mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold shrink-0">
              {user.name[0]}
            </div>
            <div className={`flex-1 min-w-0 ${isRTL ? 'text-right' : 'text-left'}`}>
              <p className="text-sm font-semibold truncate">{user.name}</p>
              <p className="text-xs text-stone-500 capitalize">{user.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-50 text-red-600 transition-colors font-medium ${isRTL ? 'flex-row-reverse' : ''}`}
          >
            <LogOut className="w-5 h-5" />
            {t('logout')}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden w-full">
        <header className="h-16 bg-white border-b border-stone-200 flex items-center justify-between px-4 lg:px-8 shrink-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={toggleSidebar}
              className="lg:hidden p-2 hover:bg-stone-100 rounded-xl text-stone-600 transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
            
            {!isHome && (
              <button
                onClick={() => navigate(-1)}
                className={`p-2 hover:bg-stone-100 rounded-xl text-stone-600 transition-colors flex items-center gap-2 font-medium hidden md:flex`}
              >
                {isRTL ? <ArrowRight className="w-5 h-5" /> : <ArrowLeft className="w-5 h-5" />}
                {isRTL ? 'رجوع' : 'Back'}
              </button>
            )}
            <h2 className="text-lg font-semibold text-stone-700 truncate">
              {navItems.find(item => item.path === location.pathname)?.label || t('dashboard')}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 text-stone-400 hover:text-emerald-600 transition-colors relative">
              <Bell className="w-6 h-6" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
          </div>
        </header>
        
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
