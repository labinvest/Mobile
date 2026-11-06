import { AdminHome } from '@/components/admin/admin-home';
import { StudentHome } from '@/components/student/student-home';
import { TeacherHome } from '@/components/teacher/teacher-home';
import { useDriveApp } from '@/hooks/use-drive-app';

/** Início (aluno) · Painel (instrutor e admin). */
export default function HomeTab() {
  const { role } = useDriveApp();
  if (role === 'teacher') return <TeacherHome />;
  if (role === 'admin') return <AdminHome />;
  return <StudentHome />;
}
