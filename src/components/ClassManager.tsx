import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc, doc, deleteDoc, updateDoc, where } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Class, UserProfile } from '../types';
import { BookOpen, Plus, Users, Trash2, Edit, Search } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import { GRADES } from '../constants';

export default function ClassManager() {
  const { t, isRTL } = useLanguage();
  const [classes, setClasses] = useState<Class[]>([]);
  const [teachers, setTeachers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [newClass, setNewClass] = useState({
    name: '',
    grade: '',
    section: '',
    teacherId: '',
    students: [] as string[]
  });

  useEffect(() => {
    if (!auth.currentUser) return;

    const unsubClasses = onSnapshot(collection(db, 'classes'), (snap) => {
      setClasses(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Class)));
      setLoading(false);
    });

    const unsubTeachers = onSnapshot(query(collection(db, 'users'), where('role', '==', 'teacher')), (snap) => {
      setTeachers(snap.docs.map(doc => doc.data() as UserProfile));
    });

    return () => {
      unsubClasses();
      unsubTeachers();
    };
  }, []);

  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'classes'), newClass);
      setShowAddModal(false);
      setNewClass({ name: '', grade: '', section: '', teacherId: '', students: [] });
    } catch (error) {
      console.error('Error adding class:', error);
    }
  };

  const handleDeleteClass = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'classes', id));
    } catch (error) {
      console.error('Error deleting class:', error);
    }
  };

  const filteredClasses = classes.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.grade.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <h2 className="text-3xl font-bold text-stone-900">{isRTL ? 'إدارة الصفوف' : 'Class Management'}</h2>
          <p className="text-stone-500 mt-1">{isRTL ? 'تنظيم الصفوف الدراسية والمعلمين والطلاب' : 'Organize classes, teachers, and students'}</p>
        </div>
        
        <button
          onClick={() => setShowAddModal(true)}
          className={`flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 ${isRTL ? 'flex-row-reverse' : ''}`}
        >
          <Plus className="w-5 h-5" />
          {isRTL ? 'إضافة صف جديد' : 'Add New Class'}
        </button>
      </header>

      <div className="relative">
        <Search className={`absolute top-1/2 -translate-y-1/2 text-stone-400 w-5 h-5 ${isRTL ? 'right-4' : 'left-4'}`} />
        <input 
          type="text"
          placeholder={isRTL ? 'بحث عن صف...' : 'Search classes...'}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={`w-full py-4 bg-white border border-stone-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-sm ${isRTL ? 'pr-12 pl-4 text-right' : 'pl-12 pr-4 text-left'}`}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClasses.map((cls) => (
          <motion.div
            key={cls.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl border border-stone-100 shadow-sm p-6 hover:shadow-md transition-all group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                <BookOpen className="w-6 h-6" />
              </div>
              <button 
                onClick={() => handleDeleteClass(cls.id)}
                className="p-2 text-stone-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>

            <h3 className="text-xl font-bold text-stone-900 mb-1">{cls.name}</h3>
            <p className="text-emerald-600 font-bold text-sm mb-4">
              {GRADES.find(g => g.id === cls.grade)?.[isRTL ? 'ar' : 'en']} - {isRTL ? 'شعبة' : 'Section'} {cls.section}
            </p>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-stone-600">
                <Users className="w-4 h-4 text-stone-400" />
                <span>{cls.students.length} {isRTL ? 'طالب' : 'Students'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-stone-600">
                <Edit className="w-4 h-4 text-stone-400" />
                <span>{isRTL ? 'المعلم' : 'Teacher'}: {teachers.find(t => t.uid === cls.teacherId)?.name || (isRTL ? 'غير معين' : 'Not Assigned')}</span>
              </div>
            </div>

            <button className="w-full mt-6 py-3 bg-stone-50 text-stone-600 rounded-xl font-bold hover:bg-stone-100 transition-all">
              {isRTL ? 'عرض التفاصيل' : 'View Details'}
            </button>
          </motion.div>
        ))}
      </div>

      {/* Add Class Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl"
            >
              <h3 className="text-2xl font-bold text-stone-900 mb-6">{isRTL ? 'إضافة صف جديد' : 'Add New Class'}</h3>
              
              <form onSubmit={handleAddClass} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-2">{isRTL ? 'اسم الصف' : 'Class Name'}</label>
                  <input 
                    type="text"
                    required
                    value={newClass.name}
                    onChange={(e) => setNewClass({...newClass, name: e.target.value})}
                    placeholder="e.g. Mathematics 101"
                    className="w-full p-4 bg-stone-50 border border-stone-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-stone-700 mb-2">{isRTL ? 'الصف' : 'Grade'}</label>
                    <select 
                      required
                      value={newClass.grade}
                      onChange={(e) => setNewClass({...newClass, grade: e.target.value})}
                      className="w-full p-4 bg-stone-50 border border-stone-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    >
                      <option value="">{isRTL ? 'اختر' : 'Select'}</option>
                      {GRADES.map(g => <option key={g.id} value={g.id}>{isRTL ? g.ar : g.en}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-stone-700 mb-2">{isRTL ? 'الشعبة' : 'Section'}</label>
                    <input 
                      type="text"
                      required
                      value={newClass.section}
                      onChange={(e) => setNewClass({...newClass, section: e.target.value})}
                      placeholder="A, B, C..."
                      className="w-full p-4 bg-stone-50 border border-stone-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-2">{isRTL ? 'المعلم المسؤول' : 'Assigned Teacher'}</label>
                  <select 
                    required
                    value={newClass.teacherId}
                    onChange={(e) => setNewClass({...newClass, teacherId: e.target.value})}
                    className="w-full p-4 bg-stone-50 border border-stone-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value="">{isRTL ? 'اختر المعلم' : 'Select Teacher'}</option>
                    {teachers.map(t => <option key={t.uid} value={t.uid}>{t.name}</option>)}
                  </select>
                </div>

                <div className="flex gap-4 pt-4">
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
                    {isRTL ? 'إضافة' : 'Add Class'}
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
