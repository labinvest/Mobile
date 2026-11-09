// Formatos devolvidos pela API do Rota (pasta Backend).

export type Role = 'student' | 'teacher' | 'admin';
export type Category = 'A' | 'B' | 'AB';
export type Transmission = 'Manual' | 'Automático';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';
export type VehicleStatus = 'pending' | 'active' | 'rejected';
export type AppointmentStatus = 'requested' | 'declined' | 'scheduled' | 'in-progress' | 'completed' | 'cancelled';

export type LessonReview = {
  authorName: string;
  rating: number;
  comment: string;
  submittedAt: number;
};

export type Appointment = {
  id: number;
  studentId: number;
  teacherId: number;
  studentName: string;
  teacherName: string;
  lesson: string;
  /** AAAA-MM-DD */
  lessonDate: string;
  /** 'Qui, 8 out' */
  date: string;
  time: string;
  vehicle: string;
  meetingPoint: string;
  notes: string;
  price?: string;
  priceCents?: number;
  status: AppointmentStatus;
  /** Em aula cancelada, ausente significa encerramento automático por data vencida. */
  cancelledBy?: 'student' | 'teacher';
  studentConfirmed: boolean;
  teacherConfirmed: boolean;
  startedAt?: number;
  durationSeconds?: number;
  reviews: { student?: LessonReview; teacher?: LessonReview };
};

export type Vehicle = {
  id: number;
  model: string;
  year: number;
  transmission: Transmission;
  dualControl: boolean;
  status: VehicleStatus;
  /** 'HB20 2023 · Automático' */
  label: string;
  plate?: string;
};

export type Teacher = {
  id: number;
  name: string;
  initials: string;
  area: string;
  cnhCategory: Category;
  experience: string;
  price: string;
  priceCents: number;
  tags: string[];
  available: boolean;
  approvalStatus: ApprovalStatus;
  /** '4,9' ou null quando ainda não há avaliações */
  rating: string | null;
  reviewCount: number;
  vehicle: Vehicle | null;
  email?: string;
  phone?: string | null;
  city?: string | null;
  cnhExpiry?: string;
};

/** Mesma lista de Backend/src/lib/availability.ts. */
export type Period = '08h às 10h' | '10h às 12h' | '13h às 15h' | '15h às 17h' | '18h às 20h';
export type WeeklySlot = { weekday: number; period: Period };

export type TeacherProfile = {
  teacher: Teacher;
  weeklySlots: WeeklySlot[];
  completedLessons: number;
  reviews: { id: number; authorName: string; authorInitials: string; rating: number; comment: string; submittedAt: number }[];
};

export type TeacherAvailability = {
  /** false: o instrutor ainda não montou a agenda e aceita pedidos em qualquer período. */
  configured: boolean;
  days: { date: string; periods: { period: Period; available: boolean }[] }[];
};

export type NotificationKind = 'request' | 'accepted' | 'declined' | 'cancelled' | 'confirm' | 'started' | 'completed' | 'review';
export type AppNotification = { id: string; kind: NotificationKind; title: string; body: string; at: number; appointmentId: number; unread: boolean };

export type Account = {
  id: number;
  role: Role;
  name: string;
  email: string;
  phone: string | null;
  city: string | null;
  initials: string;
  student: { category: Category; lessonsGoal: number; completedLessons: number } | null;
  teacher: (Teacher & { latestReview: LessonReview | null; weeklySlots: WeeklySlot[] }) | null;
};

export type AuthSession = { token: string; user: Account };

export type TeacherStudent = {
  id: number;
  name: string;
  initials: string;
  category: Category;
  completedLessons: number;
  lessonsGoal: number;
  lessonsWithMe: number;
  lastLesson: string | null;
  progress: number;
  rating: string | null;
  reviewCount: number;
};

export type AdminOverview = {
  students: number;
  teachers: number;
  lessonsThisMonth: number;
  lessonsToday: number;
  pendingRequests: number;
  pendingTeachers: number;
  vehicles: number;
  pendingVehicles: number;
  pendingItems: { kind: 'teacher' | 'vehicle'; id: number; initials: string; title: string; detail: string }[];
};

export type AdminVehicle = Vehicle & { plate: string; teacherId: number; ownerName: string };

export type RegisterStudentInput = {
  name: string;
  email: string;
  phone: string;
  cpf: string;
  city: string;
  category: Category;
  password: string;
};

export type RegisterTeacherInput = {
  name: string;
  email: string;
  phone: string;
  cpf: string;
  city: string;
  password: string;
  cnhNumber: string;
  cnhCategory: Category;
  /** DD/MM/AAAA */
  cnhExpiry: string;
  experience: string;
  vehicle: { model: string; year: string; plate: string; transmission: Transmission; dualControl: boolean };
  termsAccepted: boolean;
};

export type LessonRequest = {
  teacherId: number;
  /** AAAA-MM-DD */
  date: string;
  time: string;
  lesson: string;
  meetingPoint: string;
  notes: string;
};
