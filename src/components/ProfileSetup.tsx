import { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile, UserRole } from '../types';
import { GraduationCap, UserCheck, ShieldCheck, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import { GRADES, SUBJECTS } from '../constants';

interface ProfileSetupProps {
  user: UserProfile;
  onComplete: (user: UserProfile) => void;
}

const SECTIONS = ['A', 'B', 'C', 'D'];

export default function ProfileSetup({ user, onComplete }: ProfileSetupProps) {
  const { t, isRTL } = useLanguage();
  const [name, setName] = useState(user.name || '');
  const [role, setRole] = useState<UserRole>('student');
  const [grade, setGrade] = useState('');
  const [section, setSection] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedGrades, setSelectedGrades] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleComplete = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      const updates: Partial<UserProfile> = {
        name: name.trim(),
        role,
        isProfileComplete: true,
      };

      if (role === 'student') {
        updates.grade = grade;
        updates.section = section;
      } else if (role === 'teacher') {
        updates.subjects = selectedSubjects;
        updates.classes = selectedGrades;
      }

      await updateDoc(doc(db, 'users', user.uid), updates);
      onComplete({ ...user, ...updates });
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSubject = (subject: string) => {
    setSelectedSubjects(prev => 
      prev.includes(subject) ? prev.filter(s => s !== subject) : [...prev, subject]
    );
  };

  const toggleGrade = (g: string) => {
    setSelectedGrades(prev => 
      prev.includes(g) ? prev.filter(item => item !== g) : [...prev, g]
    );
  };

  return (
    <div className={`min-h-screen bg-stone-50 flex items-center justify-center p-4 font-sans ${isRTL ? 'font-arabic' : ''}`}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full bg-white rounded-3xl shadow-xl p-8 border border-stone-100"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-stone-900">{isRTL ? 'إعداد الحساب' : 'Account Setup'}</h1>
          <p className="text-stone-500 mt-2">{isRTL ? 'يرجى اختيار نوع الحساب وإكمال البيانات' : 'Please select your account type and complete the details'}</p>
        </div>

        <div className="mb-8">
          <label className="block text-sm font-bold text-stone-700 mb-2">{isRTL ? 'الاسم الكامل' : 'Full Name'}</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={isRTL ? 'أدخل اسمك الكامل' : 'Enter your full name'}
            className={`w-full p-4 bg-stone-50 border border-stone-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all ${isRTL ? 'text-right' : 'text-left'}`}
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <button
            onClick={() => setRole('student')}
            className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 ${
              role === 'student' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-stone-100 hover:border-stone-200 text-stone-500'
            }`}
          >
            <GraduationCap className="w-8 h-8" />
            <span className="font-bold">{isRTL ? 'طالب' : 'Student'}</span>
          </button>
          <button
            onClick={() => setRole('teacher')}
            className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 ${
              role === 'teacher' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-stone-100 hover:border-stone-200 text-stone-500'
            }`}
          >
            <UserCheck className="w-8 h-8" />
            <span className="font-bold">{isRTL ? 'معلم' : 'Teacher'}</span>
          </button>
          <button
            onClick={() => setRole('admin')}
            className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 ${
              role === 'admin' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-stone-100 hover:border-stone-200 text-stone-500'
            }`}
          >
            <ShieldCheck className="w-8 h-8" />
            <span className="font-bold">{isRTL ? 'مسؤول' : 'Admin'}</span>
          </button>
        </div>

        {role === 'student' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-2">{isRTL ? 'الصف' : 'Grade'}</label>
                <select 
                  value={grade} 
                  onChange={(e) => setGrade(e.target.value)}
                  className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="">{isRTL ? 'اختر الصف' : 'Select Grade'}</option>
                  {GRADES.map(g => <option key={g.id} value={g.id}>{isRTL ? g.ar : g.en}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-2">{isRTL ? 'الشعبة' : 'Section'}</label>
                <select 
                  value={section} 
                  onChange={(e) => setSection(e.target.value)}
                  className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="">{isRTL ? 'اختر الشعبة' : 'Select Section'}</option>
                  {SECTIONS.map(s => <option key={s} value={s}>{isRTL ? `شعبة ${s}` : `Section ${s}`}</option>)}
                </select>
              </div>
            </div>
          </div>
        )}

        {role === 'teacher' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div>
              <label className="block text-sm font-bold text-stone-700 mb-3">{isRTL ? 'الصفوف التي تدرسها' : 'Grades you teach'}</label>
              <div className="grid grid-cols-4 gap-2">
                {GRADES.map(g => (
                  <button
                    key={g.id}
                    onClick={() => toggleGrade(g.id)}
                    className={`p-2 text-[10px] font-bold rounded-lg border transition-all ${
                      selectedGrades.includes(g.id) ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white border-stone-200 text-stone-600 hover:border-stone-300'
                    }`}
                  >
                    {isRTL ? g.ar : g.en}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-stone-700 mb-3">{isRTL ? 'المواد التي تدرسها' : 'Subjects you teach'}</label>
              <div className="flex flex-wrap gap-2">
                {SUBJECTS.map(s => (
                  <button
                    key={s.id}
                    onClick={() => toggleSubject(s.id)}
                    className={`px-4 py-2 text-xs font-bold rounded-full border transition-all ${
                      selectedSubjects.includes(s.id) ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white border-stone-200 text-stone-600 hover:border-stone-300'
                    }`}
                  >
                    {isRTL ? s.ar : s.en}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {role === 'admin' && (
          <div className="p-6 bg-orange-50 border border-orange-100 rounded-2xl text-orange-800 text-sm animate-in fade-in slide-in-from-bottom-4">
            {isRTL 
              ? 'بصفتك مسؤولاً، سيكون لديك وصول كامل لإدارة جميع جوانب النظام، بما في ذلك المستخدمين والمحتوى والإعدادات.' 
              : 'As an admin, you will have full access to manage all aspects of the system, including users, content, and settings.'}
          </div>
        )}

        <button
          onClick={handleComplete}
          disabled={loading || (role === 'student' && (!grade || !section)) || (role === 'teacher' && (selectedSubjects.length === 0 || selectedGrades.length === 0))}
          className="w-full mt-8 py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (isRTL ? 'جاري الحفظ...' : 'Saving...') : (
            <>
              <Check className="w-5 h-5" />
              {isRTL ? 'إكمال الإعداد' : 'Complete Setup'}
            </>
          )}
        </button>
      </motion.div>
    </div>
  );
}
