export type UserRole = 'admin' | 'teacher' | 'student' | 'parent';

export interface UserProfile {
  uid: string;
  name: string;
  displayName?: string;
  email: string;
  role: UserRole;
  studentId?: string;
  teacherId?: string;
  classId?: string;
  grade?: string; // الصف
  section?: string; // الشعبة
  subjects?: string[]; // المواد للمعلم
  classes?: string[]; // الصفوف للمعلم
  createdAt: string;
  isProfileComplete?: boolean;
}

export type MaterialType = 'video' | 'book' | 'study_guide' | 'exam';

export interface Material {
  id: string;
  title: string;
  description: string;
  type: MaterialType;
  url: string;
  teacherId: string;
  grade: string;
  section?: string; // Optional if it's for the whole grade
  subject: string;
  createdAt: string;
}

export interface Class {
  id: string;
  name: string;
  teacherId: string;
  schedule: any;
}

export interface Attendance {
  id: string;
  studentId: string;
  classId: string;
  date: string;
  status: 'present' | 'absent' | 'late';
  method: 'fingerprint' | 'manual';
  timestamp: string;
}

export interface Grade {
  id: string;
  studentId: string;
  teacherId: string;
  subject: string;
  score: number;
  total: number;
  comments: string;
  date: string;
}

export interface Assignment {
  id: string;
  classId: string;
  teacherId: string;
  title: string;
  description: string;
  dueDate: string;
  createdAt: string;
}

export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  content: string;
  submittedAt: string;
  grade?: number;
  feedback?: string;
}

export interface TimetableEntry {
  subject: string;
  teacherId: string;
  teacherName?: string;
  room?: string;
  startTime: string;
  endTime: string;
}

export interface WeeklyTimetable {
  id: string;
  grade: string;
  section: string;
  schedule: {
    [day: string]: TimetableEntry[];
  };
}

export interface Notification {
  id: string;
  recipientId: string;
  title: string;
  message: string;
  type: string;
  createdAt: string;
  read: boolean;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
}
