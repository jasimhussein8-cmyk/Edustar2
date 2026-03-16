import { useState, useEffect } from 'react';
import { collection, getDocs, deleteDoc, doc, setDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { UserProfile, Material, UserRole } from '../types';
import { Users, Trash2, Search, Plus, X, UserPlus, GraduationCap, UserCheck } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import { GRADES, SUBJECTS } from '../constants';

export default function AdminDashboard() {
  const { t, isRTL } = useLanguage();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'materials'>('users');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUser, setNewUser] = useState({
    email: '',
    name: '',
    password: '',
    role: 'student' as UserRole,
    grade: '',
    section: '',
    subjects: [] as string[],
    classes: [] as string[]
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!auth.currentUser) return;
      try {
        const usersSnap = await getDocs(collection(db, 'users'));
        const materialsSnap = await getDocs(collection(db, 'materials'));
        
        setUsers(usersSnap.docs.map(doc => doc.data() as UserProfile));
        setMaterials(materialsSnap.docs.map(doc => ({ id: doc.id, ...(doc.data() as object) } as Material)));
      } catch (error) {
        console.error('Error fetching admin data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleAddUser = async () => {
    if (!newUser.email || !newUser.name || !newUser.password) return;
    try {
      // We generate a temporary UID or use email as ID for pre-creation
      // In a real app, you'd use Firebase Admin SDK to create the actual auth account
      const tempUid = `user_${Date.now()}`;
      const userData: UserProfile & { password?: string } = {
        uid: tempUid,
        email: newUser.email,
        name: newUser.name,
        password: newUser.password, // Storing for demo purposes
        role: newUser.role,
        createdAt: new Date().toISOString(),
        isProfileComplete: true,
        ...(newUser.role === 'student' ? { grade: newUser.grade, section: newUser.section } : {}),
        ...(newUser.role === 'teacher' ? { subjects: newUser.subjects, classes: newUser.classes } : {})
      };

      await setDoc(doc(db, 'users', tempUid), userData);
      setUsers(prev => [userData, ...prev]);
      setShowAddUserModal(false);
      setNewUser({ email: '', name: '', password: '', role: 'student', grade: '', section: '', subjects: [], classes: [] });
    } catch (error) {
      console.error('Error adding user:', error);
    }
  };

  const handleDeleteUser = async (uid: string) => {
    if (window.confirm(isRTL ? 'هل أنت متأكد من حذف هذا المستخدم؟' : 'Are you sure you want to delete this user?')) {
      try {
        await deleteDoc(doc(db, 'users', uid));
        setUsers(prev => prev.filter(u => u.uid !== uid));
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }
  };

  const handleDeleteMaterial = async (id: string) => {
    if (window.confirm(isRTL ? 'هل أنت متأكد من حذف هذه المادة؟' : 'Are you sure you want to delete this material?')) {
      try {
        await deleteDoc(doc(db, 'materials', id));
        setMaterials(prev => prev.filter(m => m.id !== id));
      } catch (error) {
        console.error('Error deleting material:', error);
      }
    }
  };

  const filteredUsers = users.filter(u => 
    (u.displayName || u.name || u.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredMaterials = materials.filter(m => 
    m.title.toLowerCase().includes(searchTerm.toLowerCase())
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
          <h2 className="text-3xl font-bold text-stone-900">{isRTL ? 'لوحة تحكم المسؤول' : 'Admin Dashboard'}</h2>
          <p className="text-stone-500 mt-1">{isRTL ? 'إدارة المستخدمين والمحتوى والنظام بالكامل.' : 'Manage users, content, and the entire system.'}</p>
        </div>
        <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-stone-100 shadow-sm">
          <button 
            onClick={() => setShowAddUserModal(true)}
            className={`flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all ${isRTL ? 'flex-row-reverse' : ''}`}
          >
            <UserPlus className="w-4 h-4" />
            {isRTL ? 'إضافة مستخدم' : 'Add User'}
          </button>
          <div className="w-px h-6 bg-stone-200 mx-1" />
          <button 
            onClick={() => setActiveTab('users')}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'users' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'text-stone-500 hover:bg-stone-50'}`}
          >
            {isRTL ? 'المستخدمين' : 'Users'}
          </button>
          <button 
            onClick={() => setActiveTab('materials')}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'materials' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'text-stone-500 hover:bg-stone-50'}`}
          >
            {isRTL ? 'المواد التعليمية' : 'Materials'}
          </button>
        </div>
      </header>

      <div className="bg-white rounded-3xl border border-stone-100 shadow-sm overflow-hidden">
        <div className={`p-6 border-b border-stone-100 flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className="relative w-full max-w-md">
            <Search className={`w-4 h-4 absolute top-1/2 -translate-y-1/2 text-stone-400 ${isRTL ? 'right-3' : 'left-3'}`} />
            <input 
              type="text" 
              placeholder={t('search')}
              className={`w-full py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${isRTL ? 'pr-10 pl-4 text-right' : 'pl-10 pr-4 text-left'}`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {activeTab === 'users' ? (
            <table className={`w-full ${isRTL ? 'text-right' : 'text-left'}`}>
              <thead>
                <tr className="bg-stone-50 text-stone-500 text-xs uppercase tracking-wider">
                  <th className={`px-6 py-4 font-semibold ${isRTL ? 'text-right' : 'text-left'}`}>{isRTL ? 'المستخدم' : 'User'}</th>
                  <th className={`px-6 py-4 font-semibold ${isRTL ? 'text-right' : 'text-left'}`}>{isRTL ? 'الدور' : 'Role'}</th>
                  <th className={`px-6 py-4 font-semibold ${isRTL ? 'text-right' : 'text-left'}`}>{isRTL ? 'التفاصيل' : 'Details'}</th>
                  <th className="px-6 py-4 font-semibold text-center">{isRTL ? 'الإجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredUsers.map((user) => (
                  <tr key={user.uid} className="hover:bg-stone-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 font-bold">
                          {(user.displayName || user.name || 'U')[0]}
                        </div>
                        <div>
                          <p className="font-bold text-stone-800">{user.displayName || user.name}</p>
                          <p className="text-xs text-stone-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                        user.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                        user.role === 'teacher' ? 'bg-blue-100 text-blue-700' :
                        'bg-emerald-100 text-emerald-700'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-stone-500">
                      {user.role === 'student' && `${isRTL ? 'صف' : 'Grade'} ${user.grade || '-'}`}
                      {user.role === 'teacher' && `${user.subjects?.length || 0} ${isRTL ? 'مواد' : 'Subjects'}`}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center">
                        <button 
                          onClick={() => handleDeleteUser(user.uid)}
                          className="p-2 text-stone-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className={`w-full ${isRTL ? 'text-right' : 'text-left'}`}>
              <thead>
                <tr className="bg-stone-50 text-stone-500 text-xs uppercase tracking-wider">
                  <th className={`px-6 py-4 font-semibold ${isRTL ? 'text-right' : 'text-left'}`}>{isRTL ? 'المادة' : 'Material'}</th>
                  <th className={`px-6 py-4 font-semibold ${isRTL ? 'text-right' : 'text-left'}`}>{isRTL ? 'النوع' : 'Type'}</th>
                  <th className={`px-6 py-4 font-semibold ${isRTL ? 'text-right' : 'text-left'}`}>{isRTL ? 'المعلم' : 'Teacher'}</th>
                  <th className="px-6 py-4 font-semibold text-center">{isRTL ? 'الإجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredMaterials.map((material) => (
                  <tr key={material.id} className="hover:bg-stone-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-stone-800">{material.title}</p>
                      <p className="text-xs text-stone-500">{material.subject} • {isRTL ? `صف` : `Grade`} {material.grade}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-medium text-stone-600 capitalize">{material.type}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-stone-500">
                      {material.teacherId}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center">
                        <button 
                          onClick={() => handleDeleteMaterial(material.id!)}
                          className="p-2 text-stone-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showAddUserModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl w-full max-w-2xl p-8 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-stone-900">{isRTL ? 'إضافة مستخدم جديد' : 'Add New User'}</h3>
                <button onClick={() => setShowAddUserModal(false)} className="p-2 hover:bg-stone-100 rounded-full transition-colors">
                  <X className="w-6 h-6 text-stone-400" />
                </button>
              </div>

              <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-2xl text-blue-800 text-xs">
                {isRTL 
                  ? 'ملاحظة: إضافة مستخدم هنا تنشئ سجلاً في قاعدة البيانات فقط. يجب على المستخدم إنشاء حساب بنفسه عبر صفحة التسجيل للتمكن من الدخول.' 
                  : 'Note: Adding a user here only creates a database record. The user must still sign up via the registration page to be able to log in.'}
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-stone-700 mb-2">{isRTL ? 'الاسم الكامل' : 'Full Name'}</label>
                    <input 
                      type="text"
                      value={newUser.name}
                      onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                      className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-stone-700 mb-2">{isRTL ? 'البريد الإلكتروني' : 'Email'}</label>
                    <input 
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                      className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-stone-700 mb-2">{isRTL ? 'كلمة السر' : 'Password'}</label>
                    <input 
                      type="password"
                      value={newUser.password}
                      onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                      className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-3">{isRTL ? 'الدور' : 'Role'}</label>
                  <div className="grid grid-cols-3 gap-3">
                    {['student', 'teacher', 'admin'].map((r) => (
                      <button
                        key={r}
                        onClick={() => setNewUser({...newUser, role: r as UserRole})}
                        className={`p-3 rounded-xl border-2 transition-all flex items-center justify-center gap-2 font-bold text-sm ${
                          newUser.role === r ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-stone-100 text-stone-500'
                        }`}
                      >
                        {r === 'student' && <GraduationCap className="w-4 h-4" />}
                        {r === 'teacher' && <UserCheck className="w-4 h-4" />}
                        {r === 'admin' && <Plus className="w-4 h-4" />}
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                {newUser.role === 'student' && (
                  <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                    <div>
                      <label className="block text-sm font-bold text-stone-700 mb-2">{isRTL ? 'الصف' : 'Grade'}</label>
                      <select 
                        value={newUser.grade}
                        onChange={(e) => setNewUser({...newUser, grade: e.target.value})}
                        className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      >
                        <option value="">{isRTL ? 'اختر الصف' : 'Select Grade'}</option>
                        {GRADES.map(g => <option key={g.id} value={g.id}>{isRTL ? g.ar : g.en}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-stone-700 mb-2">{isRTL ? 'الشعبة' : 'Section'}</label>
                      <input 
                        type="text"
                        value={newUser.section}
                        onChange={(e) => setNewUser({...newUser, section: e.target.value})}
                        placeholder="A, B, C..."
                        className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                  </div>
                )}

                {newUser.role === 'teacher' && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                    <div>
                      <label className="block text-sm font-bold text-stone-700 mb-2">{isRTL ? 'المواد' : 'Subjects'}</label>
                      <div className="flex flex-wrap gap-2">
                        {SUBJECTS.map(s => (
                          <button
                            key={s.id}
                            onClick={() => {
                              const subjects = newUser.subjects.includes(s.id)
                                ? newUser.subjects.filter(id => id !== s.id)
                                : [...newUser.subjects, s.id];
                              setNewUser({...newUser, subjects});
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                              newUser.subjects.includes(s.id) ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-stone-50 border-stone-200 text-stone-600'
                            }`}
                          >
                            {isRTL ? s.ar : s.en}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-stone-700 mb-2">{isRTL ? 'الصفوف' : 'Grades'}</label>
                      <div className="grid grid-cols-3 gap-2">
                        {GRADES.map(g => (
                          <button
                            key={g.id}
                            onClick={() => {
                              const classes = newUser.classes.includes(g.id)
                                ? newUser.classes.filter(id => id !== g.id)
                                : [...newUser.classes, g.id];
                              setNewUser({...newUser, classes});
                            }}
                            className={`p-2 rounded-lg text-[10px] font-bold border transition-all ${
                              newUser.classes.includes(g.id) ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-stone-50 border-stone-200 text-stone-600'
                            }`}
                          >
                            {isRTL ? g.ar : g.en}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <button 
                  onClick={handleAddUser}
                  className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all active:scale-95 mt-4"
                >
                  {isRTL ? 'إنشاء الحساب' : 'Create Account'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
