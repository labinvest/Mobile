import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';

import { AdminLessons } from '@/components/admin/admin-lessons';
import { MyLessons } from '@/components/student/my-lessons';
import { TeacherAgenda } from '@/components/teacher/teacher-agenda';
import { useDriveApp } from '@/hooks/use-drive-app';

/** Minhas aulas (aluno) · Agenda (instrutor) · Aulas (admin). */
export default function ScheduleTab() {
  const { role, refreshAppointments } = useDriveApp();

  // Pedidos e confirmações chegam de outras pessoas: atualiza sempre que a aba abre.
  useFocusEffect(
    useCallback(() => {
      refreshAppointments().catch(() => undefined);
    }, [refreshAppointments]),
  );

  if (role === 'teacher') return <TeacherAgenda />;
  if (role === 'admin') return <AdminLessons />;
  return <MyLessons />;
}
