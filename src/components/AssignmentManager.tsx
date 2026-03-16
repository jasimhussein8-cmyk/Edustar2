import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Assignment, UserProfile, Submission } from '../types';
import { ClipboardList, Plus, Calendar, Clock, FileText, Send, CheckCircle, Trash2, Edit } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import { GRADES, SUBJECTS } from '../constants';

export default function AssignmentManager() {
  const { t, isRTL } = useLanguage();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const [newAssignment, setNewAssignment] = useState({
    title: '',
    description: '',
    dueDate: '',
    grade: '',
    subject: '',
    totalPoints: 100
  });

  useEffect(() => {
    const fetchUser = async () => {
      if (auth.currentUser) {
        const userDoc = await onSnapshot(doc(db, 'users', auth.currentUser.uid), (s) => {
          setUserProfile(s.data() as UserProfile);
        });
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    if (!userProfile) return;

    let q;
    if (userProfile.role === 'teacher') {
      q = query(collection(db, 'assignments'), where('teacherId', '==', userProfile.uid));
    } else if (userProfile.role === 'student') {
      q = query(collection(db, 'assignments'), where('grade', '==', userProfile.grade));
    } else {
      q = query(collection(db, 'assignments'));
    }

    const unsub = onSnapshot(q, (snap) => {
      setAssignments(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Assignment)));
      setLoading(false);
    });

    return () => unsub();
  }, [userProfile]);

  const handleAddAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    try {
      await addDoc(collection(db, 'assignments'), {
        ...newAssignment,
        teacherId: auth.currentUser.uid,
        createdAt: new Date().toISOString()
      });
      setShowAddModal(false);
      setNewAssignment({
        title: '',
        description: '',
        dueDate: '',
        grade: '',
        subject: '',
        totalPoints: 100
      });
    } catch (error) {
      console.error('Error adding assignment:', error);
    }
  };

  const handleDeleteAssignment = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'assignments', id));
    } catch (error) {
      console.error('Error deleting assignment:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className={`space-y-8 max-w-7xl mx-auto ${isRTL ? 'text-right' : 'text-left'}`}>
      <header className={`flex flex-col md:flex-row md:items-center justify-between gap-4 ${isRTL ? 'md:flex-row-reverse' : ''}`}>
        <div>
          <h2 className="text-3xl font-bold text-stone-900">{isRTL ? 'الواجبات المدرسية' : 'Assignments'}</h2>
          <p className="text-stone-500 mt-1">
            {userProfile?.role === 'teacher' 
              ? (isRTL ? 'إدارة الواجبات والمهام لطلابك' : 'Manage assignments and tasks for your students')
              : (isRTL ? 'عرض وتسليم الواجبات المطلوبة منك' : 'View and submit your required assignments')}
          </p>
        </div>
        
        {userProfile?.role === 'teacher' && (
          <button
            onClick={() => setShowAddModal(true)}
            className={`flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 ${isRTL ? 'flex-row-reverse' : ''}`}
          >
            <Plus className="w-5 h-5" />
            {isRTL ? 'إضافة واجب جديد' : 'New Assignment'}
          </button>
        )}
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {assignments.map((assignment) => (
          <motion.div
            key={assignment.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl border border-stone-100 shadow-sm p-6 hover:shadow-md transition-all group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                <ClipboardList className="w-6 h-6" />
              </div>
              {userProfile?.role === 'teacher' && (
                <button 
                  onClick={() => handleDeleteAssignment(assignment.id)}
                  className="p-2 text-stone-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </div>

            <h3 className="text-xl font-bold text-stone-900 mb-2">{assignment.title}</h3>
            <p className="text-stone-500 text-sm mb-4 line-clamp-2">{assignment.description}</p>

            <div className="space-y-2 mb-6">
              <div className="flex items-center gap-2 text-xs text-stone-400">
                <Calendar className="w-4 h-4" />
                {isRTL ? 'تاريخ التسليم' : 'Due Date'}: {new Date(assignment.dueDate).toLocaleDateString(isRTL ? 'ar-EG' : 'en-US')}
              </div>
              <div className="flex items-center gap-2 text-xs text-stone-400">
                <FileText className="w-4 h-4" />
                {isRTL ? 'المادة' : 'Subject'}: {SUBJECTS.find(s => s.id === assignment.subject)?.[isRTL ? 'ar' : 'en']}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-stone-50">
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                {assignment.totalPoints} {isRTL ? 'نقطة' : 'pts'}
              </span>
              <button className="text-sm font-bold text-stone-600 hover:text-emerald-600 transition-colors flex items-center gap-1">
                {userProfile?.role === 'student' ? (isRTL ? 'تسليم الواجب' : 'Submit Now') : (isRTL ? 'عرض التسليمات' : 'View Submissions')}
                <Send className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {assignments.length === 0 && (
        <div className="text-center py-20 bg-white rounded-3xl border border-stone-100">
          <ClipboardList className="w-16 h-16 text-stone-100 mx-auto mb-4" />
          <p className="text-stone-400 font-medium">{isRTL ? 'لا توجد واجبات حالياً' : 'No assignments found'}</p>
        </div>
      )}

      {/* Add Assignment Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl w-full max-w-2xl p-8 shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <h3 className="text-2xl font-bold text-stone-900 mb-6">{isRTL ? 'إضافة واجب جديد' : 'Create New Assignment'}</h3>
              
              <form onSubmit={handleAddAssignment} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-stone-700 mb-2">{isRTL ? 'عنوان الواجب' : 'Assignment Title'}</label>
                    <input 
                      type="text"
                      required
                      value={newAssignment.title}
                      onChange={(e) => setNewAssignment({...newAssignment, title: e.target.value})}
                      className="w-full p-4 bg-stone-50 border border-stone-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-stone-700 mb-2">{isRTL ? 'الوصف / التعليمات' : 'Description / Instructions'}</label>
                    <textarea 
                      rows={4}
                      required
                      value={newAssignment.description}
                      onChange={(e) => setNewAssignment({...newAssignment, description: e.target.value})}
                      className="w-full p-4 bg-stone-50 border border-stone-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-stone-700 mb-2">{isRTL ? 'المادة' : 'Subject'}</label>
                    <select 
                      required
                      value={newAssignment.subject}
                      onChange={(e) => setNewAssignment({...newAssignment, subject: e.target.value})}
                      className="w-full p-4 bg-stone-50 border border-stone-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    >
                      <option value="">{isRTL ? 'اختر المادة' : 'Select Subject'}</option>
                      {SUBJECTS.map(s => <option key={s.id} value={s.id}>{isRTL ? s.ar : s.en}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-stone-700 mb-2">{isRTL ? 'الصف' : 'Grade'}</label>
                    <select 
                      required
                      value={newAssignment.grade}
                      onChange={(e) => setNewAssignment({...newAssignment, grade: e.target.value})}
                      className="w-full p-4 bg-stone-50 border border-stone-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    >
                      <option value="">{isRTL ? 'اختر الصف' : 'Select Grade'}</option>
                      {GRADES.map(g => <option key={g.id} value={g.id}>{isRTL ? g.ar : g.en}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-stone-700 mb-2">{isRTL ? 'تاريخ التسليم' : 'Due Date'}</label>
                    <input 
                      type="date"
                      required
                      value={newAssignment.dueDate}
                      onChange={(e) => setNewAssignment({...newAssignment, dueDate: e.target.value})}
                      className="w-full p-4 bg-stone-50 border border-stone-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-stone-700 mb-2">{isRTL ? 'إجمالي النقاط' : 'Total Points'}</label>
                    <input 
                      type="number"
                      required
                      value={newAssignment.totalPoints}
                      onChange={(e) => setNewAssignment({...newAssignment, totalPoints: parseInt(e.target.value)})}
                      className="w-full p-4 bg-stone-50 border border-stone-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-6">
                  <button 
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-4 border border-stone-200 text-stone-600 rounded-2xl font-bold hover:bg-stone-50 transition-all"
                  >
                    {isRTL ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200"
                  >
                    {isRTL ? 'نشر الواجب' : 'Post Assignment'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
