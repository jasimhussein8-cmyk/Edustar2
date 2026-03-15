import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Assignment, Grade, Material, UserProfile, MaterialType } from '../types';
import { BookOpen, GraduationCap, Clock, Send, FileText, Video, ExternalLink, Download, Book, ClipboardList } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';

export default function StudentDashboard() {
  const { t, isRTL } = useLanguage();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [selectedType, setSelectedType] = useState<MaterialType | 'all'>('all');

  useEffect(() => {
    const fetchData = async () => {
      if (!auth.currentUser) return;

      // Get user profile to know their grade
      const userDoc = await getDocs(query(collection(db, 'users'), where('uid', '==', auth.currentUser.uid)));
      const userData = userDoc.docs[0]?.data() as UserProfile;
      setUserProfile(userData);

      const assignmentsQ = query(collection(db, 'assignments'), orderBy('createdAt', 'desc'), limit(5));
      const gradesQ = query(collection(db, 'grades'), where('studentId', '==', auth.currentUser.uid), orderBy('date', 'desc'), limit(5));
      
      let materialsQ;
      if (userData?.role === 'admin') {
        materialsQ = query(collection(db, 'materials'), limit(20));
      } else if (userData?.grade) {
        materialsQ = query(collection(db, 'materials'), where('grade', '==', userData.grade));
      } else {
        materialsQ = query(collection(db, 'materials'), limit(10));
      }

      const [assignmentsSnap, gradesSnap, materialsSnap] = await Promise.all([
        getDocs(assignmentsQ),
        getDocs(gradesQ),
        getDocs(materialsQ)
      ]);

      setAssignments(assignmentsSnap.docs.map(doc => ({ id: doc.id, ...(doc.data() as object) } as Assignment)));
      setGrades(gradesSnap.docs.map(doc => ({ id: doc.id, ...(doc.data() as object) } as Grade)));
      setMaterials(materialsSnap.docs.map(doc => ({ id: doc.id, ...(doc.data() as object) } as Material)));
      setLoading(false);
    };
    fetchData();
  }, []);

  const filteredMaterials = selectedType === 'all' 
    ? materials 
    : materials.filter(m => m.type === selectedType);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  const materialTypes = [
    { id: 'all', en: 'All', ar: 'الكل', icon: BookOpen, color: 'bg-stone-100 text-stone-600' },
    { id: 'video', en: 'Videos', ar: 'الشرح الفيديوي', icon: Video, color: 'bg-blue-100 text-blue-600' },
    { id: 'book', en: 'Books', ar: 'الكتب المدرسية', icon: Book, color: 'bg-emerald-100 text-emerald-600' },
    { id: 'study_guide', en: 'Guides', ar: 'الملازم', icon: FileText, color: 'bg-orange-100 text-orange-600' },
    { id: 'exam', en: 'Exams', ar: 'الامتحانات', icon: ClipboardList, color: 'bg-purple-100 text-purple-600' },
  ];

  return (
    <div className={`space-y-8 max-w-7xl mx-auto ${isRTL ? 'text-right' : 'text-left'}`}>
      <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
        <div>
          <h2 className="text-3xl font-bold text-stone-900">{isRTL ? 'بوابة الطالب' : 'Student Portal'}</h2>
          <p className="text-stone-500 mt-1">
            {isRTL 
              ? `مرحباً بك! أنت في الصف ${userProfile?.grade || 'غير محدد'} - شعبة ${userProfile?.section || 'غير محدد'}` 
              : `Welcome! You are in Grade ${userProfile?.grade || 'N/A'} - Section ${userProfile?.section || 'N/A'}`}
          </p>
        </div>
      </div>

      {/* Material Type Filter Buttons */}
      <div className={`grid grid-cols-2 md:grid-cols-5 gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
        {materialTypes.map((type) => (
          <button
            key={type.id}
            onClick={() => setSelectedType(type.id as any)}
            className={`p-4 rounded-3xl border-2 transition-all flex flex-col items-center gap-2 font-bold ${
              selectedType === type.id 
                ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-lg shadow-emerald-100' 
                : 'border-white bg-white text-stone-500 hover:border-stone-100 shadow-sm'
            }`}
          >
            <div className={`p-3 rounded-2xl ${type.color}`}>
              <type.icon className="w-6 h-6" />
            </div>
            <span className="text-xs">{isRTL ? type.ar : type.en}</span>
          </button>
        ))}
      </div>

      <div className={`grid grid-cols-1 lg:grid-cols-3 gap-8 ${isRTL ? 'flex-row-reverse' : ''}`}>
        {/* Main Content: Materials & Assignments */}
        <div className="lg:col-span-2 space-y-8">
          {/* Educational Materials */}
          <section className="bg-white p-8 rounded-3xl border border-stone-100 shadow-sm">
            <div className={`flex items-center justify-between mb-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <h3 className={`text-xl font-bold text-stone-900 flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <BookOpen className="w-6 h-6 text-emerald-600" />
                {isRTL ? 'المواد التعليمية' : 'Educational Materials'}
              </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredMaterials.length > 0 ? filteredMaterials.map((material) => (
                <motion.div 
                  key={material.id}
                  whileHover={{ y: -4 }}
                  className="p-5 rounded-2xl border border-stone-100 bg-stone-50 hover:shadow-md transition-all"
                >
                  <div className={`flex items-start gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div className={`p-3 rounded-xl shrink-0 ${
                      material.type === 'video' ? 'bg-blue-100 text-blue-600' : 
                      material.type === 'book' ? 'bg-emerald-100 text-emerald-600' :
                      material.type === 'exam' ? 'bg-purple-100 text-purple-600' :
                      'bg-orange-100 text-orange-600'
                    }`}>
                      {material.type === 'video' ? <Video className="w-6 h-6" /> : 
                       material.type === 'book' ? <Book className="w-6 h-6" /> :
                       material.type === 'exam' ? <ClipboardList className="w-6 h-6" /> :
                       <FileText className="w-6 h-6" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-stone-900 truncate">{material.title}</h4>
                      <p className="text-sm text-stone-500 mt-1 line-clamp-2">{material.description}</p>
                      <div className={`flex items-center gap-3 mt-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <span className="px-2 py-1 bg-white border border-stone-200 rounded text-[10px] font-bold text-stone-500 uppercase">
                          {material.subject}
                        </span>
                        <a 
                          href={material.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700"
                        >
                          {material.type === 'video' ? (isRTL ? 'مشاهدة' : 'Watch') : (isRTL ? 'تحميل' : 'Download')}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )) : (
                <div className="col-span-2 py-12 text-center text-stone-400">
                  {isRTL ? 'لا توجد مواد تعليمية متاحة حالياً.' : 'No educational materials available yet.'}
                </div>
              )}
            </div>
          </section>

          {/* Active Assignments */}
          <div className="bg-white p-8 rounded-3xl border border-stone-100 shadow-sm">
            <div className={`flex items-center justify-between mb-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <h3 className={`text-xl font-bold text-stone-900 flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <FileText className="w-6 h-6 text-orange-600" />
                {isRTL ? 'الواجبات النشطة' : 'Active Assignments'}
              </h3>
            </div>
            <div className="space-y-4">
              {assignments.length > 0 ? assignments.map((assignment) => (
                <div key={assignment.id} className="group p-6 rounded-3xl bg-stone-50 border border-stone-100 hover:border-emerald-200 hover:bg-white transition-all">
                  <div className={`flex items-start justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div className={isRTL ? 'text-right' : 'text-left'}>
                      <h4 className="font-bold text-stone-900 group-hover:text-emerald-700 transition-colors">{assignment.title}</h4>
                      <p className="text-sm text-stone-500 mt-1 line-clamp-2">{assignment.description}</p>
                      <div className={`flex items-center gap-4 mt-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <span className={`flex items-center gap-1 text-xs text-stone-400 ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <Clock className="w-3 h-3" />
                          {isRTL ? 'تاريخ الاستحقاق: ' : 'Due: '} {new Date(assignment.dueDate).toLocaleDateString(isRTL ? 'ar-EG' : 'en-US')}
                        </span>
                      </div>
                    </div>
                    <button className="p-3 bg-white border border-stone-200 rounded-2xl text-stone-400 hover:text-emerald-600 hover:border-emerald-200 transition-all">
                      <Send className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                </div>
              )) : (
                <div className="text-center py-12 bg-stone-50 rounded-3xl border border-dashed border-stone-200">
                  <FileText className="w-12 h-12 text-stone-300 mx-auto mb-4" />
                  <p className="text-stone-400 font-medium">{isRTL ? 'لم يتم العثور على واجبات نشطة.' : 'No active assignments found.'}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar: Schedule & Quick Links */}
        <div className="space-y-8">
          <div className="bg-stone-900 p-8 rounded-3xl text-white shadow-xl shadow-stone-200/50">
            <h3 className={`text-xl font-bold mb-6 flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Clock className="w-6 h-6 text-emerald-400" />
              {isRTL ? 'جدول اليوم' : "Today's Schedule"}
            </h3>
            <div className="space-y-6">
              <div className={`relative ${isRTL ? 'pr-6 border-r-2' : 'pl-6 border-l-2'} border-emerald-500/30`}>
                <div className={`absolute ${isRTL ? '-right-[5px]' : '-left-[5px]'} top-0 w-2 h-2 rounded-full bg-emerald-500`} />
                <p className="text-xs font-bold text-emerald-400">08:00 - 09:30</p>
                <p className="text-sm font-bold mt-1">{isRTL ? 'الرياضيات' : 'Mathematics'}</p>
                <p className="text-xs text-stone-400">{isRTL ? 'غرفة 302 • أ. سميث' : 'Room 302 • Prof. Smith'}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-stone-100 shadow-sm">
            <h3 className={`text-xl font-bold text-stone-900 mb-6 flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <GraduationCap className="w-6 h-6 text-blue-600" />
              {isRTL ? 'الأداء الأكاديمي' : 'Academic Performance'}
            </h3>
            <div className="space-y-6">
              {grades.map((grade) => (
                <div key={grade.id}>
                  <div className={`flex justify-between text-sm mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <span className="font-medium text-stone-600">{grade.subject}</span>
                    <span className="font-bold text-emerald-600">{Math.round((grade.score / grade.total) * 100)}%</span>
                  </div>
                  <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(grade.score / grade.total) * 100}%` }}
                      className="h-full bg-emerald-500 rounded-full"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
