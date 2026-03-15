import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { Attendance, Grade, Notification } from '../types';
import { Bell, UserCheck, GraduationCap, MessageSquare, Clock, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';

export default function ParentDashboard() {
  const { t, isRTL } = useLanguage();
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      // In a real app, we'd filter by the linked studentId
      const attendanceSnap = await getDocs(query(collection(db, 'attendance'), orderBy('timestamp', 'desc'), limit(5)));
      const gradesSnap = await getDocs(query(collection(db, 'grades'), orderBy('date', 'desc'), limit(5)));
      
      setAttendance(attendanceSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Attendance)));
      setGrades(gradesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Grade)));
    };
    fetchData();
  }, []);

  return (
    <div className={`space-y-8 max-w-7xl mx-auto ${isRTL ? 'text-right' : 'text-left'}`}>
      <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
        <div>
          <h2 className="text-3xl font-bold text-stone-900">{isRTL ? 'بوابة ولي الأمر' : 'Parent Portal'}</h2>
          <p className="text-stone-500 mt-1">{isRTL ? 'راقب التقدم الأكاديمي وحضور طفلك.' : "Monitor your child's academic progress and attendance."}</p>
        </div>
        <div className={`flex items-center gap-3 bg-white px-4 py-2 rounded-2xl border border-stone-100 shadow-sm ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">JD</div>
          <span className="text-sm font-bold text-stone-700">{isRTL ? 'جون دو (طالب)' : 'John Doe (Student)'}</span>
        </div>
      </div>

      <div className={`grid grid-cols-1 lg:grid-cols-3 gap-8 ${isRTL ? 'flex-row-reverse' : ''}`}>
        {/* Left Column: Activity & Grades */}
        <div className="lg:col-span-2 space-y-8">
          {/* Recent Attendance */}
          <div className="bg-white p-8 rounded-3xl border border-stone-100 shadow-sm">
            <div className={`flex items-center justify-between mb-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <h3 className={`text-xl font-bold text-stone-900 flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <UserCheck className="w-6 h-6 text-emerald-600" />
                {isRTL ? 'سجل الحضور' : 'Attendance History'}
              </h3>
              <button className="text-sm font-bold text-emerald-600 hover:underline">{isRTL ? 'عرض التقرير الكامل' : 'View Full Report'}</button>
            </div>
            <div className="space-y-4">
              {attendance.map((record) => (
                <div key={record.id} className={`flex items-center justify-between p-4 rounded-2xl bg-stone-50 border border-stone-100 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      record.status === 'present' ? 'bg-emerald-100 text-emerald-600' : 
                      record.status === 'absent' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'
                    }`}>
                      <Clock className="w-5 h-5" />
                    </div>
                    <div className={isRTL ? 'text-right' : 'text-left'}>
                      <p className="font-bold text-stone-800 capitalize">{record.status === 'present' ? t('present') : record.status === 'absent' ? (isRTL ? 'غائب' : 'Absent') : (isRTL ? 'متأخر' : 'Late')}</p>
                      <p className="text-xs text-stone-500">{new Date(record.date).toLocaleDateString(isRTL ? 'ar-EG' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-stone-400 uppercase tracking-widest">{record.method}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Grades */}
          <div className="bg-white p-8 rounded-3xl border border-stone-100 shadow-sm">
            <div className={`flex items-center justify-between mb-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <h3 className={`text-xl font-bold text-stone-900 flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <GraduationCap className="w-6 h-6 text-blue-600" />
                {isRTL ? 'الدرجات الأخيرة' : 'Recent Grades'}
              </h3>
              <button className="text-sm font-bold text-blue-600 hover:underline">{isRTL ? 'السجل الأكاديمي' : 'Academic Transcript'}</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {grades.length > 0 ? grades.map((grade) => (
                <div key={grade.id} className={`p-6 rounded-3xl bg-blue-50 border border-blue-100 ${isRTL ? 'text-right' : 'text-left'}`}>
                  <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-1">{grade.subject}</p>
                  <div className={`flex items-end justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <h4 className={`text-3xl font-bold text-stone-900 ${isRTL ? 'flex flex-row-reverse gap-1' : ''}`}>
                      {grade.score}
                      <span className="text-lg text-stone-400 font-medium">/{grade.total}</span>
                    </h4>
                    <span className="text-xs text-stone-500">{new Date(grade.date).toLocaleDateString(isRTL ? 'ar-EG' : 'en-US')}</span>
                  </div>
                  <p className="text-sm text-stone-600 mt-3 italic">"{grade.comments}"</p>
                </div>
              )) : (
                <div className="col-span-2 text-center py-8 text-stone-400 italic">{isRTL ? 'لا توجد درجات مسجلة بعد.' : 'No grades recorded yet.'}</div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Notifications & Messages */}
        <div className="space-y-8">
          <div className="bg-white p-8 rounded-3xl border border-stone-100 shadow-sm">
            <h3 className={`text-xl font-bold text-stone-900 mb-6 flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Bell className="w-6 h-6 text-orange-500" />
              {isRTL ? 'الإشعارات' : 'Notifications'}
            </h3>
            <div className="space-y-6">
              <div className={`flex gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className="w-2 h-2 mt-2 rounded-full bg-orange-500 shrink-0" />
                <div className={isRTL ? 'text-right' : 'text-left'}>
                  <p className="text-sm font-bold text-stone-800">{isRTL ? 'تذكير برحلة مدرسية' : 'School Trip Reminder'}</p>
                  <p className="text-xs text-stone-500 mt-1">{isRTL ? 'لا تنسَ التوقيع على قسيمة الإذن لزيارة المتحف الأسبوع المقبل.' : "Don't forget to sign the permission slip for next week's museum visit."}</p>
                  <p className="text-[10px] text-stone-400 mt-2">{isRTL ? 'منذ ساعتين' : '2 hours ago'}</p>
                </div>
              </div>
              <div className={`flex gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className="w-2 h-2 mt-2 rounded-full bg-emerald-500 shrink-0" />
                <div className={isRTL ? 'text-right' : 'text-left'}>
                  <p className="text-sm font-bold text-stone-800">{isRTL ? 'تنبيه حضور' : 'Attendance Alert'}</p>
                  <p className="text-xs text-stone-500 mt-1">{isRTL ? 'تم تسجيل حضور جون في الساعة 08:05 صباحاً عبر مسح البصمة.' : 'John was marked present at 08:05 AM via fingerprint scan.'}</p>
                  <p className="text-[10px] text-stone-400 mt-2">{isRTL ? 'أمس' : 'Yesterday'}</p>
                </div>
              </div>
            </div>
            <button className="w-full mt-8 py-3 text-sm font-semibold text-orange-600 hover:bg-orange-50 rounded-2xl transition-colors">
              {isRTL ? 'مسح الكل' : 'Clear All'}
            </button>
          </div>

          <div className="bg-stone-900 p-8 rounded-3xl text-white shadow-xl shadow-stone-200/50">
            <h3 className={`text-xl font-bold mb-6 flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <MessageSquare className="w-6 h-6 text-emerald-400" />
              {isRTL ? 'اتصل بالمعلم' : 'Contact Teacher'}
            </h3>
            <p className={`text-sm text-stone-400 mb-6 ${isRTL ? 'text-right' : 'text-left'}`}>{isRTL ? 'لديك سؤال حول تقدم جون؟ أرسل رسالة مباشرة إلى معلم فصله.' : "Have a question about John's progress? Send a direct message to his class teacher."}</p>
            <button className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all active:scale-95">
              {isRTL ? 'بدء محادثة' : 'Start Conversation'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
