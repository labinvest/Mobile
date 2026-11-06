import { AdminTeachers } from '@/components/admin/admin-teachers';
import { ExploreScreen } from '@/components/student/explore';
import { StudentRoster } from '@/components/teacher/student-roster';
import { useDriveApp } from '@/hooks/use-drive-app';

/** Explorar (aluno) · Alunos (instrutor) · Instrutores (admin). */
export default function PeopleTab() {
  const { role } = useDriveApp();
  if (role === 'teacher') return <StudentRoster />;
  if (role === 'admin') return <AdminTeachers />;
  return <ExploreScreen />;
}
