import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, setDoc, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { UserProfile, WeeklyTimetable, TimetableEntry } from '../types';
import { Calendar, Plus, Trash2, Save, Clock, BookOpen, User } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import { GRADES, SUBJECTS } from '../constants';

const DAYS = [
  { en: 'Monday', ar: 'الاثنين' },
  { en: 'Tuesday', ar: 'الثلاثاء' },
  { en: 'Wednesday', ar: 'الأربعاء' },
  { en: 'Thursday', ar: 'الخميس' },
  { en: 'Friday', ar: 'الجمعة' },
  { en: 'Saturday', ar: 'السبت' },
  { en: 'Sunday', ar: 'الأحد' }
];

interface TimetableProps {
  user: UserProfile;
}

export default function Timetable({ user }: TimetableProps) {
  const { t, isRTL } = useLanguage();
  const [timetable, setTimetable] = useState<WeeklyTimetable | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState(user.grade || '');
  const [selectedSection, setSelectedSection] = useState(user.section || '');

  // For adding new entry
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDay, setSelectedDay] = useState('');
  const [newEntry, setNewEntry] = useState<TimetableEntry>({
    subject: '',
    teacherId: user.uid,
    teacherName: user.displayName || user.name,
    startTime: '08:00',
    endTime: '09:00',
    room: ''
  });

  useEffect(() => {
    if (!auth.currentUser || !selectedGrade || !selectedSection) {
      setLoading(false);
      return;
    }

    const timetableId = `${selectedGrade}_${selectedSection}`;
    const unsub = onSnapshot(doc(db, 'timetables', timetableId), (docSnap) => {
      if (docSnap.exists()) {
        setTimetable(docSnap.data() as WeeklyTimetable);
      } else {
        setTimetable({
          id: timetableId,
          grade: selectedGrade,
          section: selectedSection,
          schedule: {}
        });
      }
      setLoading(false);
    });

    return () => unsub();
  }, [selectedGrade, selectedSection]);

  const handleSave = async () => {
    if (!timetable) return;
    try {
      await setDoc(doc(db, 'timetables', timetable.id), timetable);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving timetable:', error);
    }
  };

  const addEntry = () => {
    if (!timetable || !selectedDay) return;
    
    const updatedSchedule = { ...timetable.schedule };
    if (!updatedSchedule[selectedDay]) {
      updatedSchedule[selectedDay] = [];
    }
    
    updatedSchedule[selectedDay].push(newEntry);
    // Sort by start time
    updatedSchedule[selectedDay].sort((a, b) => a.startTime.localeCompare(b.startTime));
    
    setTimetable({ ...timetable, schedule: updatedSchedule });
    setShowAddModal(false);
    setNewEntry({
      subject: '',
      teacherId: user.uid,
      teacherName: user.displayName || user.name,
      startTime: '08:00',
      endTime: '09:00',
      room: ''
    });
  };

  const removeEntry = (day: string, index: number) => {
    if (!timetable) return;
    const updatedSchedule = { ...timetable.schedule };
    updatedSchedule[day].splice(index, 1);
    setTimetable({ ...timetable, schedule: updatedSchedule });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  const canEdit = user.role === 'teacher' || user.role === 'admin';

  return (
    <div className={`space-y-8 max-w-7xl mx-auto ${isRTL ? 'text-right' : 'text-left'}`}>
      <header className={`flex flex-col md:flex-row md:items-center justify-between gap-4 ${isRTL ? 'md:flex-row-reverse' : ''}`}>
        <div>
          <h2 className="text-3xl font-bold text-stone-900">{isRTL ? 'الجدول الأسبوعي' : 'Weekly Timetable'}</h2>
          <p className="text-stone-500 mt-1">
            {isRTL 
              ? `عرض وإدارة الحصص الدراسية للصف ${GRADES.find(g => g.id === selectedGrade)?.[isRTL ? 'ar' : 'en'] || selectedGrade} - شعبة ${selectedSection}` 
              : `View and manage classes for Grade ${selectedGrade} - Section ${selectedSection}`}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {canEdit && (
            <button
              onClick={() => isEditing ? handleSave() : setIsEditing(true)}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all ${
                isEditing 
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-100' 
                  : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
              } ${isRTL ? 'flex-row-reverse' : ''}`}
            >
              {isEditing ? <Save className="w-5 h-5" /> : <Calendar className="w-5 h-5" />}
              {isEditing ? (isRTL ? 'حفظ التغييرات' : 'Save Changes') : (isRTL ? 'تعديل الجدول' : 'Edit Timetable')}
            </button>
          )}
        </div>
      </header>

      {canEdit && isEditing && (
        <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 p-6 bg-white rounded-3xl border border-stone-100 shadow-sm ${isRTL ? 'md:flex-row-reverse' : ''}`}>
          <div>
            <label className="block text-sm font-bold text-stone-700 mb-2">{isRTL ? 'الصف' : 'Grade'}</label>
            <select 
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              {GRADES.map(g => <option key={g.id} value={g.id}>{isRTL ? g.ar : g.en}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-stone-700 mb-2">{isRTL ? 'الشعبة' : 'Section'}</label>
            <input 
              type="text"
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              placeholder="A, B, C..."
              className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
        {DAYS.map((day) => (
          <div key={day.en} className="bg-white rounded-3xl border border-stone-100 shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 bg-stone-50 border-b border-stone-100 text-center">
              <h3 className="font-bold text-stone-900">{isRTL ? day.ar : day.en}</h3>
            </div>
            
            <div className="flex-1 p-3 space-y-3 min-h-[200px]">
              {timetable?.schedule[day.en]?.map((entry, idx) => (
                <div key={idx} className="p-3 rounded-2xl bg-emerald-50 border border-emerald-100 relative group">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {entry.startTime} - {entry.endTime}
                    </span>
                    {isEditing && (
                      <button 
                        onClick={() => removeEntry(day.en, idx)}
                        className="p-1 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <p className="text-sm font-bold text-stone-900">{entry.subject}</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {entry.teacherName && (
                      <p className="text-[10px] text-stone-500 flex items-center gap-1">
                        <User className="w-2.5 h-2.5" />
                        {entry.teacherName}
                      </p>
                    )}
                    {entry.room && (
                      <p className="text-[10px] text-stone-500 flex items-center gap-1">
                        <BookOpen className="w-2.5 h-2.5" />
                        {isRTL ? 'قاعة' : 'Room'}: {entry.room}
                      </p>
                    )}
                  </div>
                </div>
              ))}
              
              {isEditing && (
                <button
                  onClick={() => {
                    setSelectedDay(day.en);
                    setShowAddModal(true);
                  }}
                  className="w-full py-3 border-2 border-dashed border-stone-100 rounded-2xl text-stone-400 hover:border-emerald-200 hover:text-emerald-500 transition-all flex items-center justify-center"
                >
                  <Plus className="w-5 h-5" />
                </button>
              )}
              
              {(!timetable?.schedule[day.en] || timetable.schedule[day.en].length === 0) && !isEditing && (
                <div className="h-full flex items-center justify-center text-stone-300 italic text-xs py-8">
                  {isRTL ? 'لا توجد حصص' : 'No classes'}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add Entry Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl"
            >
              <h3 className="text-xl font-bold text-stone-900 mb-6">
                {isRTL ? `إضافة حصة ليوم ${DAYS.find(d => d.en === selectedDay)?.ar}` : `Add Class for ${selectedDay}`}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-2">{isRTL ? 'المادة' : 'Subject'}</label>
                  <select 
                    value={newEntry.subject}
                    onChange={(e) => setNewEntry({...newEntry, subject: e.target.value})}
                    className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value="">{isRTL ? 'اختر المادة' : 'Select Subject'}</option>
                    {SUBJECTS.map(s => <option key={s.id} value={s.id}>{isRTL ? s.ar : s.en}</option>)}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-2">{isRTL ? 'المعلم' : 'Teacher'}</label>
                  <input 
                    type="text"
                    value={newEntry.teacherName}
                    onChange={(e) => setNewEntry({...newEntry, teacherName: e.target.value})}
                    placeholder={isRTL ? 'اسم المعلم' : "Teacher's Name"}
                    className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-stone-700 mb-2">{isRTL ? 'من' : 'From'}</label>
                    <input 
                      type="time"
                      value={newEntry.startTime}
                      onChange={(e) => setNewEntry({...newEntry, startTime: e.target.value})}
                      className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-stone-700 mb-2">{isRTL ? 'إلى' : 'To'}</label>
                    <input 
                      type="time"
                      value={newEntry.endTime}
                      onChange={(e) => setNewEntry({...newEntry, endTime: e.target.value})}
                      className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-2">{isRTL ? 'القاعة (اختياري)' : 'Room (Optional)'}</label>
                  <input 
                    type="text"
                    value={newEntry.room}
                    onChange={(e) => setNewEntry({...newEntry, room: e.target.value})}
                    placeholder="e.g. Lab 1, Room 202"
                    className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                
                <div className="flex gap-3 mt-6">
                  <button 
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-3 border border-stone-200 text-stone-600 rounded-xl font-bold hover:bg-stone-50 transition-all"
                  >
                    {isRTL ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button 
                    onClick={addEntry}
                    disabled={!newEntry.subject}
                    className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all disabled:opacity-50"
                  >
                    {isRTL ? 'إضافة' : 'Add'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
