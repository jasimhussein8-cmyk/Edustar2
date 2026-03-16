import { useState, useEffect, FormEvent } from 'react';
import { collection, query, where, getDocs, addDoc, orderBy } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { UserProfile, Grade } from '../types';
import { GraduationCap, Search, Plus, Save, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';

export default function GradeManager() {
  const { t, isRTL } = useLanguage();
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<UserProfile | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [newGrade, setNewGrade] = useState({
    subject: '',
    score: 0,
    total: 100,
    comments: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!auth.currentUser) return;
      const studentsSnap = await getDocs(query(collection(db, 'users'), where('role', '==', 'student')));
      setStudents(studentsSnap.docs.map(doc => doc.data() as UserProfile));
      
      const gradesSnap = await getDocs(query(collection(db, 'grades'), orderBy('date', 'desc')));
      setGrades(gradesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Grade)));
    };
    fetchData();
  }, []);

  const handleAddGrade = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !auth.currentUser) return;

    try {
      await addDoc(collection(db, 'grades'), {
        studentId: selectedStudent.uid,
        teacherId: auth.currentUser.uid,
        subject: newGrade.subject,
        score: Number(newGrade.score),
        total: Number(newGrade.total),
        comments: newGrade.comments,
        date: new Date().toISOString().split('T')[0]
      });
      setShowModal(false);
      // Refresh list
      const gradesSnap = await getDocs(query(collection(db, 'grades'), orderBy('date', 'desc')));
      setGrades(gradesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Grade)));
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className={`space-y-8 max-w-7xl mx-auto ${isRTL ? 'text-right' : 'text-left'}`}>
      <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
        <div>
          <h2 className="text-3xl font-bold text-stone-900">{t('gradeManagement')}</h2>
          <p className="text-stone-500 mt-1">{isRTL ? 'تسجيل وإدارة الأداء الأكاديمي للطلاب.' : 'Record and manage student academic performance.'}</p>
        </div>
      </div>

      <div className={`grid grid-cols-1 lg:grid-cols-3 gap-8 ${isRTL ? 'flex-row-reverse' : ''}`}>
        {/* Student Selection */}
        <div className="bg-white rounded-3xl border border-stone-100 shadow-sm overflow-hidden">
          <div className={`p-6 border-b border-stone-100 ${isRTL ? 'text-right' : 'text-left'}`}>
            <h3 className="text-lg font-bold text-stone-900">{isRTL ? 'اختر الطالب' : 'Select Student'}</h3>
          </div>
          <div className="p-4 space-y-2 max-h-[600px] overflow-y-auto">
            {students.map((student) => (
              <button
                key={student.uid}
                onClick={() => setSelectedStudent(student)}
                className={`w-full flex items-center gap-3 p-4 rounded-2xl transition-all ${
                  selectedStudent?.uid === student.uid ? 'bg-emerald-50 text-emerald-700 border-emerald-100 border' : 'hover:bg-stone-50 text-stone-600 border border-transparent'
                } ${isRTL ? 'flex-row-reverse' : ''}`}
              >
                <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center font-bold text-xs shrink-0">
                  {student.displayName ? student.displayName[0] : 'U'}
                </div>
                <div className={isRTL ? 'text-right' : 'text-left'}>
                  <p className="text-sm font-bold">{student.displayName || student.email}</p>
                  <p className="text-xs opacity-70">{student.email}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Grades Display & Entry */}
        <div className="lg:col-span-2 space-y-8">
          {selectedStudent ? (
            <div className="bg-white p-8 rounded-3xl border border-stone-100 shadow-sm">
              <div className={`flex items-center justify-between mb-8 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xl">
                    {selectedStudent.displayName ? selectedStudent.displayName[0] : 'U'}
                  </div>
                  <div className={isRTL ? 'text-right' : 'text-left'}>
                    <h3 className="text-xl font-bold text-stone-900">{selectedStudent.displayName || selectedStudent.email}</h3>
                    <p className="text-sm text-stone-500">{isRTL ? 'السجل الأكاديمي' : 'Academic History'}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowModal(true)}
                  className={`flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-2xl font-semibold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 ${isRTL ? 'flex-row-reverse' : ''}`}
                >
                  <Plus className="w-5 h-5" />
                  {t('addGrade')}
                </button>
              </div>

              <div className="space-y-4">
                {grades.filter(g => g.studentId === selectedStudent.uid).map((grade) => (
                  <div key={grade.id} className={`p-6 rounded-3xl bg-stone-50 border border-stone-100 flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div className={isRTL ? 'text-right' : 'text-left'}>
                      <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-1">{grade.subject}</p>
                      <h4 className="text-2xl font-bold text-stone-900">{grade.score}<span className="text-lg text-stone-400 font-medium">/{grade.total}</span></h4>
                      <p className="text-sm text-stone-600 mt-2 italic">"{grade.comments}"</p>
                    </div>
                    <div className={isRTL ? 'text-left' : 'text-right'}>
                      <p className="text-xs text-stone-400">{new Date(grade.date).toLocaleDateString(isRTL ? 'ar-EG' : 'en-US')}</p>
                      <span className="inline-block mt-2 px-3 py-1 bg-white border border-stone-200 rounded-full text-[10px] font-bold text-stone-500 uppercase">{isRTL ? 'تم التحقق' : 'Verified'}</span>
                    </div>
                  </div>
                ))}
                {grades.filter(g => g.studentId === selectedStudent.uid).length === 0 && (
                  <div className="text-center py-12 text-stone-400 italic">
                    {isRTL ? 'لا توجد درجات مسجلة لهذا الطالب بعد.' : 'No grades recorded for this student yet.'}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full bg-stone-50 rounded-3xl border border-dashed border-stone-200 flex flex-col items-center justify-center text-stone-400 p-12">
              <GraduationCap className="w-16 h-16 mb-4 opacity-20" />
              <p className="font-medium">{isRTL ? 'اختر طالباً من القائمة لإدارة درجاته.' : 'Select a student from the list to manage their grades.'}</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Grade Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className={`p-8 border-b border-stone-100 flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                <h3 className="text-xl font-bold text-stone-900">{isRTL ? `إضافة درجة لـ ${selectedStudent?.displayName || selectedStudent?.email}` : `Add Grade for ${selectedStudent?.displayName || selectedStudent?.email}`}</h3>
                <button onClick={() => setShowModal(false)} className="p-2 text-stone-400 hover:text-stone-600"><X className="w-6 h-6" /></button>
              </div>
              <form onSubmit={handleAddGrade} className={`p-8 space-y-6 ${isRTL ? 'text-right' : 'text-left'}`}>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-stone-700">{isRTL ? 'المادة' : 'Subject'}</label>
                  <input 
                    required
                    type="text" 
                    value={newGrade.subject}
                    onChange={(e) => setNewGrade({...newGrade, subject: e.target.value})}
                    placeholder={isRTL ? 'مثال: الرياضيات' : 'e.g. Mathematics'} 
                    className={`w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${isRTL ? 'text-right' : 'text-left'}`}
                  />
                </div>
                <div className={`grid grid-cols-2 gap-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-stone-700">{isRTL ? 'الدرجة' : 'Score'}</label>
                    <input 
                      required
                      type="number" 
                      value={newGrade.score}
                      onChange={(e) => setNewGrade({...newGrade, score: Number(e.target.value)})}
                      className={`w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${isRTL ? 'text-right' : 'text-left'}`}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-stone-700">{isRTL ? 'المجموع الكلي' : 'Total Possible'}</label>
                    <input 
                      required
                      type="number" 
                      value={newGrade.total}
                      onChange={(e) => setNewGrade({...newGrade, total: Number(e.target.value)})}
                      className={`w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${isRTL ? 'text-right' : 'text-left'}`}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-stone-700">{isRTL ? 'ملاحظات المعلم' : 'Teacher Comments'}</label>
                  <textarea 
                    value={newGrade.comments}
                    onChange={(e) => setNewGrade({...newGrade, comments: e.target.value})}
                    rows={3}
                    placeholder={isRTL ? 'أضف تعليقاً للطالب وأولياء الأمور...' : 'Add feedback for the student and parents...'} 
                    className={`w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none ${isRTL ? 'text-right' : 'text-left'}`}
                  />
                </div>
                <button 
                  type="submit"
                  className={`w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 flex items-center justify-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}
                >
                  <Save className="w-5 h-5" />
                  {isRTL ? 'حفظ الدرجة' : 'Save Grade'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
