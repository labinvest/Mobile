import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';

import { api, ApiError, setApiToken, setUnauthorizedHandler } from '@/lib/api';
import { clearToken, loadToken, saveToken } from '@/lib/session-storage';
import type { Account, Appointment, AuthSession, LessonRequest, RegisterStudentInput, RegisterTeacherInput, Role } from '@/types/api';

export type { Appointment, LessonReview, Role } from '@/types/api';

type DriveAppContextValue = {
  /** A sessão salva já foi verificada (até lá o splash continua na tela). */
  ready: boolean;
  authenticated: boolean;
  user: Account | null;
  role: Role;
  accountName: string;
  accountEmail: string;
  appointments: Appointment[];
  signIn: (email: string, password: string) => Promise<void>;
  registerStudent: (input: RegisterStudentInput) => Promise<void>;
  /** Cria a conta do instrutor sem entrar ainda, para a tela mostrar o resumo do cadastro. */
  registerTeacher: (input: RegisterTeacherInput) => Promise<AuthSession>;
  startSession: (session: AuthSession) => Promise<void>;
  signOut: () => void;
  refreshAccount: () => Promise<void>;
  refreshAppointments: () => Promise<void>;
  requestLesson: (request: LessonRequest) => Promise<Appointment>;
  respondToLesson: (appointmentId: number, accepted: boolean) => Promise<Appointment>;
  setAvailability: (available: boolean) => Promise<void>;
  confirmLesson: (appointmentId: number) => Promise<Appointment>;
  startLesson: (appointmentId: number) => Promise<Appointment>;
  finishLesson: (appointmentId: number) => Promise<Appointment>;
  submitLessonReview: (appointmentId: number, rating: number, comment: string) => Promise<Appointment>;
};

const DriveAppContext = createContext<DriveAppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<Account | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  const resetSession = useCallback(() => {
    setApiToken(null);
    setUser(null);
    setAppointments([]);
    clearToken();
  }, []);

  const refreshAppointments = useCallback(async () => {
    const { appointments: list } = await api<{ appointments: Appointment[] }>('/appointments');
    setAppointments(list);
  }, []);

  const refreshAccount = useCallback(async () => {
    const { user: account } = await api<{ user: Account }>('/users/me');
    setUser(account);
  }, []);

  // Restaura a sessão salva ao abrir o app.
  useEffect(() => {
    setUnauthorizedHandler(resetSession);
    let cancelled = false;
    (async () => {
      try {
        const token = await loadToken();
        if (!token) return;
        setApiToken(token);
        const { user: account } = await api<{ user: Account }>('/users/me');
        if (cancelled) return;
        setUser(account);
        await refreshAppointments().catch(() => undefined);
      } catch (error) {
        // 401: o handler já limpou a sessão. Sem conexão: abre na tela inicial e o token continua salvo.
        if (!(error instanceof ApiError && error.status === 401)) setApiToken(null);
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
      setUnauthorizedHandler(null);
    };
  }, [resetSession, refreshAppointments]);

  async function startSession(session: AuthSession) {
    setApiToken(session.token);
    await saveToken(session.token);
    setAppointments([]);
    setUser(session.user);
    refreshAppointments().catch(() => undefined);
  }

  async function signIn(email: string, password: string) {
    await startSession(await api<AuthSession>('/auth/login', { method: 'POST', body: { email, password } }));
  }

  async function registerStudent(input: RegisterStudentInput) {
    await startSession(await api<AuthSession>('/auth/register/student', { method: 'POST', body: input }));
  }

  function registerTeacher(input: RegisterTeacherInput) {
    return api<AuthSession>('/auth/register/teacher', { method: 'POST', body: input });
  }

  function upsertAppointment(appointment: Appointment) {
    setAppointments((current) => current.some((item) => item.id === appointment.id)
      ? current.map((item) => (item.id === appointment.id ? appointment : item))
      : [...current, appointment]);
  }

  async function postAppointment(path: string, body?: unknown) {
    const { appointment } = await api<{ appointment: Appointment }>(path, { method: 'POST', body });
    upsertAppointment(appointment);
    return appointment;
  }

  async function setAvailability(available: boolean) {
    await api('/teachers/me/availability', { method: 'PATCH', body: { available } });
    setUser((current) => (current?.teacher ? { ...current, teacher: { ...current.teacher, available } } : current));
  }

  async function finishLesson(appointmentId: number) {
    const appointment = await postAppointment(`/appointments/${appointmentId}/finish`);
    refreshAccount().catch(() => undefined);
    return appointment;
  }

  const value: DriveAppContextValue = {
    ready,
    authenticated: Boolean(user),
    user,
    role: user?.role ?? 'student',
    accountName: user?.name ?? '',
    accountEmail: user?.email ?? '',
    appointments,
    signIn,
    registerStudent,
    registerTeacher,
    startSession,
    signOut: resetSession,
    refreshAccount,
    refreshAppointments,
    requestLesson: (request) => postAppointment('/appointments', request),
    respondToLesson: (appointmentId, accepted) => postAppointment(`/appointments/${appointmentId}/respond`, { accepted }),
    setAvailability,
    confirmLesson: (appointmentId) => postAppointment(`/appointments/${appointmentId}/confirm`),
    startLesson: (appointmentId) => postAppointment(`/appointments/${appointmentId}/start`),
    finishLesson,
    submitLessonReview: (appointmentId, rating, comment) => postAppointment(`/appointments/${appointmentId}/reviews`, { rating, comment }),
  };

  return <DriveAppContext.Provider value={value}>{children}</DriveAppContext.Provider>;
}

export function useDriveApp() {
  const context = useContext(DriveAppContext);
  if (!context) throw new Error('useDriveApp deve ser usado dentro de AppProvider.');
  return context;
}
