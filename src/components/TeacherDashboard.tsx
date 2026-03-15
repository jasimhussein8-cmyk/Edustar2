import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { UserProfile, Attendance, Material } from '../types';
import { UserCheck, ClipboardList, MessageSquare, BookOpen, Search, Plus, Video, FileText, Trash2, X, GraduationCap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import { GRADES, SUBJECTS } from '../constants';

export default function TeacherDashboard() {
  const { t, isRTL } = useLanguage();
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [newMaterial, setNewMaterial] = useState({
    title: '',
    description: '',
    type: 'video' as Material['type'],
    url: '',
    grade: '',
    subject: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!auth.currentUser) return;
      
      // Get teacher profile to know their assigned grades
      const teacherDoc = await getDocs(query(collection(db, 'users'), where('uid', '==', auth.currentUser.uid)));
      const teacherData = teacherDoc.docs[0]?.data() as UserProfile;

      let studentsQ;
      if (teacherData?.classes && teacherData.classes.length > 0) {
        studentsQ = query(collection(db, 'users'), where('role', '==', 'student'), where('grade', 'in', teacherData.classes));
      } else {
        studentsQ = query(collection(db, 'users'), where('role', '==', 'student'));
      }

      const materialsQ = query(collection(db, 'materials'), where('teacherId', '==', auth.currentUser.uid));
      
      const [studentsSnap, materialsSnap] = await Promise.all([
        getDocs(studentsQ),
        getDocs(materialsQ)
      ]);

      setStudents(studentsSnap.docs.map(doc => doc.data() as UserProfile));
      setMaterials(materialsSnap.docs.map(doc => ({ id: doc.id, ...(doc.data() as object) } as Material)));
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleUploadMaterial = async () => {
    if (!auth.currentUser) return;
    try {
      const materialData = {
        ...newMaterial,
        teacherId: auth.currentUser.uid,
        createdAt: new Date().toISOString()
      };
      const docRef = await addDoc(collection(db, 'materials'), materialData);
      setMaterials(prev => [{ id: docRef.id, ...materialData } as Material, ...prev]);
      setShowUploadModal(false);
      setNewMaterial({ title: '', description: '', type: 'video', url: '', grade: '', subject: '' });
    } catch (error) {
      console.error('Error uploading material:', error);
    }
  };

  const handleDeleteMaterial = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'materials', id));
      setMaterials(prev => prev.filter(m => m.id !== id));
    } catch (error) {
      console.error('Error deleting material:', error);
    }
  };

  const markAttendance = async (studentId: string, status: 'present' | 'absent' | 'late') => {
    try {
      await addDoc(collection(db, 'attendance'), {
        studentId,
        classId: 'class-101', // Mocked
        date: new Date().toISOString().split('T')[0],
        status,
        method: 'manual',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error(error);
    }
  };

  const filteredStudents = students.filter(s => 
    (s.displayName || s.name || s.email).toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={`space-y-8 max-w-7xl mx-auto ${isRTL ? 'text-right' : 'text-left'}`}>
      <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
        <div>
          <h2 className="text-3xl font-bold text-stone-900">{isRTL ? 'بوابة المعلم' : 'Teacher Portal'}</h2>
          <p className="text-stone-500 mt-1">{isRTL ? 'إدارة فصولك وطلابك والمواد التعليمية.' : 'Manage your classes, students, and educational materials.'}</p>
        </div>
        <button 
          onClick={() => setShowUploadModal(true)}
          className={`flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-2xl font-semibold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 ${isRTL ? 'flex-row-reverse' : ''}`}
        >
          <Plus className="w-5 h-5" />
          {isRTL ? 'إضافة مادة تعليمية' : 'Add Educational Material'}
        </button>
      </div>

      <div className={`grid grid-cols-1 lg:grid-cols-3 gap-8 ${isRTL ? 'flex-row-reverse' : ''}`}>
        {/* Student List & Attendance */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-3xl border border-stone-100 shadow-sm overflow-hidden">
            <div className={`p-6 border-b border-stone-100 flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
              <h3 className="text-xl font-bold text-stone-900">{isRTL ? 'حضور الطلاب' : 'Student Attendance'}</h3>
              <div className="relative">
                <Search className={`w-4 h-4 absolute top-1/2 -translate-y-1/2 text-stone-400 ${isRTL ? 'right-3' : 'left-3'}`} />
                <input 
                  type="text" 
                  placeholder={t('search')}
                  className={`py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${isRTL ? 'pr-10 pl-4 text-right' : 'pl-10 pr-4 text-left'}`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className={`w-full ${isRTL ? 'text-right' : 'text-left'}`}>
                <thead>
                  <tr className="bg-stone-50 text-stone-500 text-xs uppercase tracking-wider">
                    <th className={`px-6 py-4 font-semibold ${isRTL ? 'text-right' : 'text-left'}`}>{isRTL ? 'الطالب' : 'Student'}</th>
                    <th className={`px-6 py-4 font-semibold ${isRTL ? 'text-right' : 'text-left'}`}>{isRTL ? 'الصف' : 'Grade'}</th>
                    <th className="px-6 py-4 font-semibold text-center">{isRTL ? 'الإجراءات' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredStudents.map((student) => (
                    <tr key={student.uid} className="hover:bg-stone-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 font-bold text-xs shrink-0">
                            {(student.displayName || student.name || 'U')[0]}
                          </div>
                          <span className="font-medium text-stone-800">{student.displayName || student.name || student.email}</span>
                        </div>
                      </td>
                      <td className={`px-6 py-4 text-sm text-stone-500 ${isRTL ? 'text-right' : 'text-left'}`}>
                        {student.grade ? (isRTL ? `صف ${student.grade}` : `Grade ${student.grade}`) : '-'}
                      </td>
                      <td className="px-6 py-4">
                        <div className={`flex items-center justify-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <button 
                            onClick={() => markAttendance(student.uid, 'present')}
                            className="px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-bold hover:bg-emerald-100 transition-colors"
                          >
                            {t('present')}
                          </button>
                          <button 
                            onClick={() => markAttendance(student.uid, 'absent')}
                            className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100 transition-colors"
                          >
                            {isRTL ? 'غائب' : 'Absent'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-stone-100 shadow-sm">
            <h3 className="text-xl font-bold text-stone-900 mb-6">{isRTL ? 'المواد التعليمية المرفوعة' : 'Uploaded Materials'}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {materials.map(material => (
                <div key={material.id} className="p-4 rounded-2xl border border-stone-100 bg-stone-50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-xl ${material.type === 'video' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'}`}>
                      {material.type === 'video' ? <Video className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="font-bold text-stone-800">{material.title}</p>
                      <p className="text-xs text-stone-500">{material.subject} • {isRTL ? `صف ${material.grade}` : `Grade ${material.grade}`}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDeleteMaterial(material.id)}
                    className="p-2 text-stone-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions & Stats */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm">
            <h3 className="text-lg font-bold text-stone-900 mb-4">{isRTL ? 'روابط سريعة' : 'Quick Links'}</h3>
            <div className="grid grid-cols-2 gap-4">
              <button className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors">
                <ClipboardList className="w-6 h-6" />
                <span className="text-xs font-bold">{isRTL ? 'الدرجات' : 'Grades'}</span>
              </button>
              <button className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-purple-50 text-purple-600 hover:bg-purple-100 transition-colors">
                <BookOpen className="w-6 h-6" />
                <span className="text-xs font-bold">{isRTL ? 'المنهج' : 'Curriculum'}</span>
              </button>
              <button className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-orange-50 text-orange-600 hover:bg-orange-100 transition-colors">
                <MessageSquare className="w-6 h-6" />
                <span className="text-xs font-bold">{t('messages')}</span>
              </button>
              <button className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors">
                <UserCheck className="w-6 h-6" />
                <span className="text-xs font-bold">{isRTL ? 'التقارير' : 'Reports'}</span>
              </button>
            </div>
          </div>

          <div className="bg-emerald-600 p-6 rounded-3xl text-white shadow-lg shadow-emerald-200">
            <h3 className="text-lg font-bold mb-2">{isRTL ? 'جدول اليوم' : "Today's Schedule"}</h3>
            <div className="space-y-4 mt-4">
              <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center font-bold">08</div>
                <div className={isRTL ? 'text-right' : 'text-left'}>
                  <p className="text-sm font-bold">{isRTL ? 'الرياضيات' : 'Mathematics'}</p>
                  <p className="text-xs opacity-80">{isRTL ? 'الصف 10-أ • غرفة 302' : 'Grade 10-A • Room 302'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl w-full max-w-lg p-8 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-stone-900">{isRTL ? 'رفع مادة تعليمية' : 'Upload Material'}</h3>
                <button onClick={() => setShowUploadModal(false)} className="p-2 hover:bg-stone-100 rounded-full transition-colors">
                  <X className="w-6 h-6 text-stone-400" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-2">{isRTL ? 'العنوان' : 'Title'}</label>
                  <input 
                    type="text"
                    value={newMaterial.title}
                    onChange={(e) => setNewMaterial({...newMaterial, title: e.target.value})}
                    className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-2">{isRTL ? 'الوصف' : 'Description'}</label>
                  <textarea 
                    value={newMaterial.description}
                    onChange={(e) => setNewMaterial({...newMaterial, description: e.target.value})}
                    className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 h-24"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-stone-700 mb-2">{isRTL ? 'النوع' : 'Type'}</label>
                    <select 
                      value={newMaterial.type}
                      onChange={(e) => setNewMaterial({...newMaterial, type: e.target.value as any})}
                      className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    >
                      <option value="video">{isRTL ? 'شرح فيديوي' : 'Video Explanation'}</option>
                      <option value="book">{isRTL ? 'كتاب مدرسي' : 'Textbook'}</option>
                      <option value="study_guide">{isRTL ? 'ملزمة' : 'Study Guide'}</option>
                      <option value="exam">{isRTL ? 'امتحان' : 'Exam'}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-stone-700 mb-2">{isRTL ? 'الصف' : 'Grade'}</label>
                    <select 
                      value={newMaterial.grade}
                      onChange={(e) => setNewMaterial({...newMaterial, grade: e.target.value})}
                      className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    >
                      <option value="">{isRTL ? 'اختر الصف' : 'Select Grade'}</option>
                      {GRADES.map(g => <option key={g.id} value={g.id}>{isRTL ? g.ar : g.en}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-2">{isRTL ? 'المادة' : 'Subject'}</label>
                  <select 
                    value={newMaterial.subject}
                    onChange={(e) => setNewMaterial({...newMaterial, subject: e.target.value})}
                    className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value="">{isRTL ? 'اختر المادة' : 'Select Subject'}</option>
                    {SUBJECTS.map(s => <option key={s.id} value={s.id}>{isRTL ? s.ar : s.en}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-2">{isRTL ? 'رابط الملف/الفيديو' : 'Link (URL)'}</label>
                  <input 
                    type="url"
                    value={newMaterial.url}
                    onChange={(e) => setNewMaterial({...newMaterial, url: e.target.value})}
                    className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <button 
                  onClick={handleUploadMaterial}
                  className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all active:scale-95 mt-4"
                >
                  {isRTL ? 'رفع المادة' : 'Upload Material'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
