import React, { useState } from 'react';
import { signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { GraduationCap, Languages, Mail, Lock, User, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const { t, language, setLanguage, isRTL } = useLanguage();

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (mode === 'login') {
        try {
          await signInWithEmailAndPassword(auth, email, password);
        } catch (loginErr: any) {
          // If login fails with invalid-credential, we check if it's a new user from Admin panel
          if (loginErr.code === 'auth/invalid-credential' || loginErr.code === 'auth/user-not-found') {
            throw loginErr;
          }
          throw loginErr;
        }
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      console.error('Auth Error:', err.code);
      let message = err.message;
      
      if (err.code === 'auth/invalid-credential') {
        message = isRTL 
          ? 'بيانات الدخول غير صحيحة. إذا كنت مستخدماً جديداً أضافه المسؤول، يرجى استخدام خيار "إنشاء حساب" بنفس البريد أولاً.' 
          : 'Invalid credentials. If you were added by an admin, please use "Sign Up" with the same email first to activate your account.';
      } else if (err.code === 'auth/operation-not-allowed') {
        message = isRTL 
          ? 'تسجيل الدخول بالبريد غير مفعل. يرجى تفعيل Email/Password في Firebase Console.' 
          : 'Email/Password auth is not enabled. Please enable it in the Firebase Console.';
      } else if (err.code === 'auth/email-already-in-use') {
        message = isRTL ? 'هذا البريد الإلكتروني مستخدم بالفعل.' : 'Email already in use.';
      }
      
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen bg-stone-50 flex items-center justify-center p-4 font-sans ${isRTL ? 'font-arabic' : ''}`}>
      <div className="absolute top-8 right-8 flex gap-4">
        <button
          onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-stone-200 rounded-xl text-stone-600 hover:bg-stone-50 transition-colors font-medium shadow-sm"
        >
          <Languages className="w-5 h-5" />
          {language === 'en' ? 'العربية' : 'English'}
        </button>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-3xl shadow-xl shadow-stone-200/50 p-8 border border-stone-100 relative"
      >
        {mode === 'signup' && (
          <button 
            onClick={() => setMode('login')}
            className={`absolute top-8 ${isRTL ? 'right-8' : 'left-8'} p-2 hover:bg-stone-100 rounded-xl text-stone-400 transition-colors`}
          >
            <ArrowLeft className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
          </button>
        )}

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 text-emerald-700 rounded-2xl mb-4">
            <GraduationCap className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-bold text-stone-900">{t('welcome')}</h1>
          <p className="text-stone-500 mt-2">
            {isRTL ? 'سجل الدخول للوصول إلى لوحة التحكم الخاصة بك' : 'Sign in to access your SmartSchool dashboard'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleEmailAuth} className="space-y-4 mb-6">
          {mode === 'signup' && (
            <div className="relative">
              <User className={`absolute top-1/2 -translate-y-1/2 text-stone-400 w-5 h-5 ${isRTL ? 'right-4' : 'left-4'}`} />
              <input
                type="text"
                placeholder={isRTL ? 'الاسم الكامل' : 'Full Name'}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`w-full py-4 bg-stone-50 border border-stone-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all ${isRTL ? 'pr-12 pl-4 text-right' : 'pl-12 pr-4 text-left'}`}
                required
              />
            </div>
          )}
          <div className="relative">
            <Mail className={`absolute top-1/2 -translate-y-1/2 text-stone-400 w-5 h-5 ${isRTL ? 'right-4' : 'left-4'}`} />
            <input
              type="email"
              placeholder={isRTL ? 'البريد الإلكتروني' : 'Email Address'}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full py-4 bg-stone-50 border border-stone-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all ${isRTL ? 'pr-12 pl-4 text-right' : 'pl-12 pr-4 text-left'}`}
              required
            />
          </div>
          <div className="relative">
            <Lock className={`absolute top-1/2 -translate-y-1/2 text-stone-400 w-5 h-5 ${isRTL ? 'right-4' : 'left-4'}`} />
            <input
              type="password"
              placeholder={isRTL ? 'كلمة السر' : 'Password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full py-4 bg-stone-50 border border-stone-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all ${isRTL ? 'pr-12 pl-4 text-right' : 'pl-12 pr-4 text-left'}`}
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold hover:bg-emerald-700 transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-emerald-200"
          >
            {loading ? (isRTL ? 'جاري التحميل...' : 'Loading...') : (mode === 'login' ? (isRTL ? 'تسجيل الدخول' : 'Sign In') : (isRTL ? 'إنشاء حساب' : 'Create Account'))}
          </button>
        </form>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-stone-100"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-stone-400">{isRTL ? 'أو' : 'Or'}</span>
          </div>
        </div>

        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-white border border-stone-200 text-stone-700 px-6 py-4 rounded-2xl font-semibold hover:bg-stone-50 transition-all active:scale-95 disabled:opacity-50"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-6 h-6" />
          {isRTL ? 'تسجيل الدخول باستخدام جوجل' : 'Sign in with Google'}
        </button>

        <div className="mt-8 text-center space-y-4">
          <button
            onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
            className="text-emerald-600 font-bold hover:underline"
          >
            {mode === 'login' 
              ? (isRTL ? 'ليس لديك حساب؟ أنشئ حساباً' : "Don't have an account? Sign Up") 
              : (isRTL ? 'لديك حساب بالفعل؟ سجل الدخول' : "Already have an account? Sign In")}
          </button>
          <p className="text-sm text-stone-400">
            {isRTL 
              ? 'بتسجيل الدخول، فإنك توافق على شروط الخدمة وسياسة الخصوصية الخاصة بنا.' 
              : 'By signing in, you agree to our Terms of Service and Privacy Policy.'}
          </p>
        </div>
      </motion.div>
    </div>
  );
}
