import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

type Language = 'en' | 'ar';

interface Translations {
  [key: string]: {
    en: string;
    ar: string;
  };
}

export const translations: Translations = {
  dashboard: { en: 'Dashboard', ar: 'لوحة التحكم' },
  users: { en: 'Users', ar: 'المستخدمين' },
  classes: { en: 'Classes', ar: 'الفصول' },
  attendance: { en: 'Attendance', ar: 'الحضور' },
  grades: { en: 'Grades', ar: 'الدرجات' },
  assignments: { en: 'Assignments', ar: 'الواجبات' },
  messages: { en: 'Messages', ar: 'الرسائل' },
  notifications: { en: 'Notifications', ar: 'الإشعارات' },
  logout: { en: 'Logout', ar: 'تسجيل الخروج' },
  welcome: { en: 'Welcome Back', ar: 'مرحباً بعودتك' },
  signInGoogle: { en: 'Continue with Google', ar: 'المتابعة باستخدام جوجل' },
  totalStudents: { en: 'Total Students', ar: 'إجمالي الطلاب' },
  totalTeachers: { en: 'Total Teachers', ar: 'إجمالي الأساتذة' },
  attendanceRate: { en: 'Attendance Rate', ar: 'نسبة الحضور' },
  activeAlerts: { en: 'Active Alerts', ar: 'تنبيهات نشطة' },
  weeklyTrend: { en: 'Weekly Attendance Trend', ar: 'اتجاه الحضور الأسبوعي' },
  recentAttendance: { en: 'Recent Attendance', ar: 'الحضور الأخير' },
  teacherPortal: { en: 'Teacher Portal', ar: 'بوابة الأستاذ' },
  studentAttendance: { en: 'Student Attendance', ar: 'حضور الطلاب' },
  searchStudents: { en: 'Search students...', ar: 'بحث عن طلاب...' },
  present: { en: 'Present', ar: 'حاضر' },
  absent: { en: 'Absent', ar: 'غائب' },
  late: { en: 'Late', ar: 'متأخر' },
  parentPortal: { en: 'Parent Portal', ar: 'بوابة ولي الأمر' },
  studentPortal: { en: 'Student Portal', ar: 'بوابة الطالب' },
  activeAssignments: { en: 'Active Assignments', ar: 'الواجبات النشطة' },
  academicPerformance: { en: 'Academic Performance', ar: 'الأداء الأكاديمي' },
  todaySchedule: { en: 'Today\'s Schedule', ar: 'جدول اليوم' },
  biometricSystem: { en: 'Biometric Attendance System', ar: 'نظام الحضور بالبصمة' },
  placeFinger: { en: 'Place your finger on the scanner to record your attendance.', ar: 'ضع إصبعك على الماسح الضوئي لتسجيل حضورك.' },
  scanning: { en: 'Scanning...', ar: 'جاري المسح...' },
  verified: { en: 'Verified', ar: 'تم التحقق' },
  failed: { en: 'Failed', ar: 'فشل' },
  liveUpdates: { en: 'Live Updates', ar: 'تحديثات مباشرة' },
  selectContact: { en: 'Select a contact to start messaging', ar: 'اختر جهة اتصال لبدء المراسلة' },
  typeMessage: { en: 'Type your message...', ar: 'اكتب رسالتك...' },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>('ar'); // Default to Arabic as requested

  const t = (key: string) => {
    return translations[key]?.[language] || key;
  };

  const isRTL = language === 'ar';

  useEffect(() => {
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language, isRTL]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
