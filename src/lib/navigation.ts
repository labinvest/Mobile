import { router } from 'expo-router';

import type { Appointment, Teacher } from '@/types/api';

/** Abre o agendamento levando o resumo do instrutor (a API não tem GET /teachers/:id). */
export function openBooking(teacher: Teacher) {
  router.push({
    pathname: '/booking',
    params: {
      teacherId: String(teacher.id),
      teacherName: teacher.name,
      initials: teacher.initials,
      vehicle: teacher.vehicle?.label ?? '',
      area: teacher.area,
      price: teacher.price,
      rating: teacher.rating ?? '',
      reviewCount: String(teacher.reviewCount),
    },
  });
}

export const openInstructor = (teacher: Pick<Teacher, 'id'>) => router.push({ pathname: '/instructor/[id]', params: { id: String(teacher.id) } });

export const openLesson = (appointment: Pick<Appointment, 'id'>) => router.push({ pathname: '/lesson', params: { id: String(appointment.id) } });
