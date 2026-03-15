import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Attendance, UserProfile } from '../types';
import { Fingerprint, UserCheck, Clock, ShieldCheck, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';

export default function AttendanceTracker() {
  const { t, isRTL } = useLanguage();
  const [logs, setLogs] = useState<Attendance[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle');
  const [lastScannedUser, setLastScannedUser] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'attendance'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snap) => {
      setLogs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Attendance)));
    });
    return () => unsubscribe();
  }, []);

  const simulateFingerprintScan = async () => {
    setIsScanning(true);
    setScanStatus('scanning');
    
    // Simulate hardware delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const success = Math.random() > 0.1; // 90% success rate
    
    if (success) {
      const mockStudentId = 'student-' + Math.floor(Math.random() * 1000);
      try {
        await addDoc(collection(db, 'attendance'), {
          studentId: mockStudentId,
          classId: 'class-101',
          date: new Date().toISOString().split('T')[0],
          status: 'present',
          method: 'fingerprint',
          timestamp: new Date().toISOString()
        });
        setScanStatus('success');
        setLastScannedUser(mockStudentId);
      } catch (error) {
        setScanStatus('error');
      }
    } else {
      setScanStatus('error');
    }

    setTimeout(() => {
      setIsScanning(false);
      setScanStatus('idle');
    }, 3000);
  };

  return (
    <div className={`max-w-4xl mx-auto space-y-8 ${isRTL ? 'text-right' : 'text-left'}`}>
      <div className="bg-white p-8 rounded-3xl border border-stone-100 shadow-sm text-center">
        <h2 className="text-2xl font-bold text-stone-900 mb-2">{t('biometricSystem')}</h2>
        <p className="text-stone-500 mb-8 text-sm">{t('placeFinger')}</p>
        
        <div className="relative inline-block">
          <motion.button
            onClick={simulateFingerprintScan}
            disabled={isScanning}
            animate={isScanning ? { scale: [1, 1.05, 1] } : {}}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className={`w-48 h-48 rounded-full flex items-center justify-center transition-all shadow-2xl ${
              scanStatus === 'scanning' ? 'bg-blue-500 text-white shadow-blue-200' :
              scanStatus === 'success' ? 'bg-emerald-500 text-white shadow-emerald-200' :
              scanStatus === 'error' ? 'bg-red-500 text-white shadow-red-200' :
              'bg-stone-900 text-emerald-400 shadow-stone-200'
            }`}
          >
            <AnimatePresence mode="wait">
              {scanStatus === 'scanning' ? (
                <motion.div
                  key="scanning"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center"
                >
                  <Fingerprint className="w-20 h-20 animate-pulse" />
                  <span className="text-xs font-bold mt-2 uppercase tracking-widest">{t('scanning')}</span>
                </motion.div>
              ) : scanStatus === 'success' ? (
                <motion.div
                  key="success"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="flex flex-col items-center"
                >
                  <ShieldCheck className="w-20 h-20" />
                  <span className="text-xs font-bold mt-2 uppercase tracking-widest">{t('verified')}</span>
                </motion.div>
              ) : scanStatus === 'error' ? (
                <motion.div
                  key="error"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="flex flex-col items-center"
                >
                  <AlertCircle className="w-20 h-20" />
                  <span className="text-xs font-bold mt-2 uppercase tracking-widest">{t('failed')}</span>
                </motion.div>
              ) : (
                <Fingerprint className="w-20 h-20" />
              )}
            </AnimatePresence>
          </motion.button>
          
          {scanStatus === 'scanning' && (
            <motion.div 
              className="absolute inset-0 border-4 border-blue-400 rounded-full"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1.2, opacity: 1 }}
              transition={{ repeat: Infinity, duration: 1 }}
            />
          )}
        </div>

        {lastScannedUser && scanStatus === 'success' && (
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 text-emerald-600 font-bold"
          >
            {isRTL ? `أهلاً بك، ${lastScannedUser}!` : `Welcome back, ${lastScannedUser}!`}
          </motion.p>
        )}
      </div>

      <div className="bg-white rounded-3xl border border-stone-100 shadow-sm overflow-hidden">
        <div className={`p-6 border-b border-stone-100 flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
          <h3 className="text-lg font-bold text-stone-900">{t('liveUpdates')}</h3>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {t('liveUpdates')}
          </div>
        </div>
        <div className="divide-y divide-stone-50">
          {logs.map((log) => (
            <div key={log.id} className={`p-6 flex items-center justify-between hover:bg-stone-50 transition-colors ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center text-stone-500">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div className={isRTL ? 'text-right' : 'text-left'}>
                  <p className="font-bold text-stone-800">{isRTL ? 'الطالب' : 'Student'}: {log.studentId}</p>
                  <p className="text-xs text-stone-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(log.timestamp).toLocaleString(isRTL ? 'ar-EG' : 'en-US')}
                  </p>
                </div>
              </div>
              <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  log.method === 'fingerprint' ? 'bg-blue-50 text-blue-600' : 'bg-stone-100 text-stone-600'
                }`}>
                  {isRTL ? (log.method === 'fingerprint' ? 'بصمة' : 'يدوي') : log.method}
                </span>
                <span className="text-xs font-bold text-emerald-600">{t('present')}</span>
              </div>
            </div>
          ))}
          {logs.length === 0 && (
            <div className="p-12 text-center text-stone-400 italic">
              {isRTL ? 'لا توجد سجلات حضور لليوم.' : 'No attendance records found for today.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
