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
  ArrowRight
} from 'lucide-react';

interface LayoutProps {
  user: UserProfile;
}

export default function Layout({ user }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, language, setLanguage, isRTL } = useLanguage();

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/auth');
  };

  const navItems = [
    { icon: LayoutDashboard, label: t('dashboard'), path: '/' },
    { icon: Users, label: t('users'), path: '/users', roles: ['admin'] },
    { icon: BookOpen, label: t('classes'), path: '/classes', roles: ['admin', 'teacher'] },
    { icon: UserCheck, label: t('attendance'), path: '/attendance', roles: ['admin', 'teacher', 'parent', 'student'] },
    { icon: GraduationCap, label: t('grades'), path: '/grades', roles: ['admin', 'teacher', 'parent', 'student'] },
    { icon: ClipboardList, label: t('assignments'), path: '/assignments', roles: ['teacher', 'student'] },
    { icon: MessageSquare, label: t('messages'), path: '/messages' },
    { icon: Bell, label: t('notifications'), path: '/notifications' },
  ].filter(item => !item.roles || item.roles.includes(user.role));

  const isHome = location.pathname === '/';

  return (
    <div className={`flex h-screen bg-stone-50 text-stone-900 font-sans ${isRTL ? 'font-arabic' : ''}`}>
      {/* Sidebar */}
      <aside className={`w-64 bg-white border-stone-200 flex flex-col ${isRTL ? 'border-l' : 'border-r'}`}>
        <div className="p-6 border-b border-stone-100">
          <h1 className="text-xl font-bold text-emerald-700 flex items-center gap-2">
            <GraduationCap className="w-8 h-8" />
            {isRTL ? 'مدرستي الذكية' : 'SmartSchool'}
          </h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium ${
                location.pathname === item.path 
                  ? 'bg-emerald-50 text-emerald-700' 
                  : 'text-stone-600 hover:bg-stone-100 hover:text-emerald-700'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-stone-100">
          <button
            onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-stone-100 text-stone-600 transition-colors font-medium mb-2"
          >
            <Languages className="w-5 h-5" />
            {language === 'en' ? 'العربية' : 'English'}
          </button>
          
          <div className="flex items-center gap-3 px-4 py-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold">
              {user.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{user.name}</p>
              <p className="text-xs text-stone-500 capitalize">{user.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-50 text-red-600 transition-colors font-medium"
          >
            <LogOut className="w-5 h-5" />
            {t('logout')}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-stone-200 flex items-center justify-between px-8">
          <div className="flex items-center gap-4">
            {!isHome && (
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-stone-100 rounded-xl text-stone-600 transition-colors flex items-center gap-2 font-medium"
              >
                {isRTL ? <ArrowRight className="w-5 h-5" /> : <ArrowLeft className="w-5 h-5" />}
                {isRTL ? 'رجوع' : 'Back'}
              </button>
            )}
            <h2 className="text-lg font-semibold text-stone-700">
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
        
        <div className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
