import { createContext, ReactNode, useContext, useState } from 'react';

export type Role = 'student' | 'teacher' | 'admin';

export type Appointment = {
  id: number;
  teacherId: string;
  teacherName: string;
  studentName: string;
  lesson: string;
  date: string;
  time: string;
  vehicle: string;
  status: 'requested' | 'declined' | 'scheduled' | 'in-progress' | 'completed';
  studentConfirmed: boolean;
  teacherConfirmed: boolean;
  meetingPoint?: string;
  notes?: string;
  price?: string;
  reviews?: {
    student?: LessonReview;
    teacher?: LessonReview;
  };
  startedAt?: number;
  durationSeconds?: number;
};

export type LessonReview = {
  authorName: string;
  rating: number;
  comment: string;
  submittedAt: number;
};

export type LessonRequest = Pick<Appointment, 'teacherId' | 'teacherName' | 'studentName' | 'lesson' | 'date' | 'time' | 'vehicle'> & {
  meetingPoint: string;
  notes: string;
  price?: string;
};

type DriveAppContextValue = {
  role: Role;
  authenticated: boolean;
  accountName: string;
  accountEmail: string;
  appointments: Appointment[];
  signIn: (role: Role, name?: string, email?: string) => void;
  signOut: () => void;
  setRole: (role: Role) => void;
  requestLesson: (request: LessonRequest) => void;
  respondToLesson: (appointmentId: number, accepted: boolean) => void;
  setAvailability: (available: boolean) => void;
  confirmLesson: (appointmentId: number, party: 'student' | 'teacher') => void;
  startLesson: (appointmentId: number) => void;
  finishLesson: (appointmentId: number) => void;
  submitLessonReview: (appointmentId: number, author: 'student' | 'teacher', rating: number, comment: string) => void;
};

const DriveAppContext = createContext<DriveAppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<Role>('student');
  const [authenticated, setAuthenticated] = useState(false);
  const [accountName, setAccountName] = useState('Julia Martins');
  const [accountEmail, setAccountEmail] = useState('aluno@rota.app');
  const [appointments, setAppointments] = useState<Appointment[]>([
    { id: 1, teacherId: 'ana', teacherName: 'Ana Paula Ribeiro', studentName: 'Julia Martins', lesson: 'Aula prática · Trânsito urbano', date: 'Qui, 8 out', time: '14h30', vehicle: 'HB20 2023 · Automático', status: 'scheduled', studentConfirmed: false, teacherConfirmed: false },
  ]);
  const [, setAvailable] = useState(true);

  function signIn(nextRole: Role, name?: string, email?: string) {
    setRoleState(nextRole);
    setAccountName(name?.trim() || (nextRole === 'teacher' ? 'Marcos Vieira' : nextRole === 'admin' ? 'Equipe Rota' : 'Julia Martins'));
    setAccountEmail(email?.trim() || (nextRole === 'teacher' ? 'instrutor@rota.app' : nextRole === 'admin' ? 'admin@rota.app' : 'aluno@rota.app'));
    setAuthenticated(true);
  }

  function signOut() {
    setAuthenticated(false);
    setRoleState('student');
  }

  function setRole(nextRole: Role) {
    setRoleState(nextRole);
    setAccountName(nextRole === 'teacher' ? 'Marcos Vieira' : nextRole === 'admin' ? 'Equipe Rota' : 'Julia Martins');
    setAccountEmail(nextRole === 'teacher' ? 'instrutor@rota.app' : nextRole === 'admin' ? 'admin@rota.app' : 'aluno@rota.app');
  }

  function requestLesson(request: LessonRequest) {
    setAppointments((current) => [...current, {
      ...request,
      id: Date.now(),
      status: 'requested',
      studentConfirmed: false,
      teacherConfirmed: false,
    }]);
  }

  function respondToLesson(appointmentId: number, accepted: boolean) {
    setAppointments((current) => current.map((appointment) => appointment.id === appointmentId && appointment.status === 'requested'
      ? { ...appointment, status: accepted ? 'scheduled' : 'declined' }
      : appointment));
  }

  function setAvailability(available: boolean) {
    setAvailable(available);
  }

  function confirmLesson(appointmentId: number, party: 'student' | 'teacher') {
    setAppointments((current) => current.map((appointment) => appointment.id === appointmentId && appointment.status === 'scheduled'
      ? { ...appointment, [party === 'student' ? 'studentConfirmed' : 'teacherConfirmed']: true }
      : appointment));
  }

  function startLesson(appointmentId: number) {
    setAppointments((current) => current.map((appointment) => appointment.id === appointmentId && appointment.status === 'scheduled' && appointment.studentConfirmed && appointment.teacherConfirmed
      ? { ...appointment, status: 'in-progress', startedAt: Date.now() }
      : appointment));
  }

  function finishLesson(appointmentId: number) {
    setAppointments((current) => current.map((appointment) => {
      if (appointment.id !== appointmentId || appointment.status !== 'in-progress') return appointment;
      const durationSeconds = appointment.startedAt ? Math.max(1, Math.floor((Date.now() - appointment.startedAt) / 1000)) : 0;
      return { ...appointment, status: 'completed', durationSeconds };
    }));
  }

  function submitLessonReview(appointmentId: number, author: 'student' | 'teacher', rating: number, comment: string) {
    if (role !== author || !Number.isInteger(rating) || rating < 1 || rating > 5) return;
    setAppointments((current) => current.map((appointment) => {
      if (appointment.id !== appointmentId || appointment.status !== 'completed' || appointment.reviews?.[author]) return appointment;
      return {
        ...appointment,
        reviews: {
          ...appointment.reviews,
          [author]: { authorName: accountName, rating, comment: comment.trim(), submittedAt: Date.now() },
        },
      };
    }));
  }

  return <DriveAppContext.Provider value={{ role, authenticated, accountName, accountEmail, appointments, signIn, signOut, setRole, requestLesson, respondToLesson, setAvailability, confirmLesson, startLesson, finishLesson, submitLessonReview }}>{children}</DriveAppContext.Provider>;
}

export function useDriveApp() {
  const context = useContext(DriveAppContext);
  if (!context) throw new Error('useDriveApp deve ser usado dentro de AppProvider.');
  return context;
}