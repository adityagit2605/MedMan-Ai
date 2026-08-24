import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { doctorsApi, appointmentsApi, doctorPortalApi, adminApi, notificationsApi } from './endpoints';

// ═══════════════════════════════════════════════════════════
//  DOCTOR QUERIES
// ═══════════════════════════════════════════════════════════

export const useDoctors = (specialisation) =>
  useQuery({
    queryKey: ['doctors', specialisation],
    queryFn: () => doctorsApi.search(specialisation),
  });

export const useDoctor = (id) =>
  useQuery({
    queryKey: ['doctors', id],
    queryFn: () => doctorsApi.getById(id),
    enabled: !!id,
  });

export const useSlots = (doctorId, date) =>
  useQuery({
    queryKey: ['slots', doctorId, date],
    queryFn: () => doctorsApi.getSlots(doctorId, date),
    enabled: !!doctorId && !!date,
    refetchInterval: 15_000, // poll every 15s while booking page is open
  });

// ═══════════════════════════════════════════════════════════
//  APPOINTMENT QUERIES & MUTATIONS
// ═══════════════════════════════════════════════════════════

export const useMyAppointments = () =>
  useQuery({
    queryKey: ['appointments', 'mine'],
    queryFn: () => appointmentsApi.getMine(),
  });

export const useAppointment = (id) =>
  useQuery({
    queryKey: ['appointments', id],
    queryFn: () => appointmentsApi.getById(id),
    enabled: !!id,
  });

export const useHoldSlot = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => appointmentsApi.hold(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['slots'] }),
  });
};

export const useConfirmAppointment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => appointmentsApi.confirm(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appointments'] });
      qc.invalidateQueries({ queryKey: ['slots'] });
    },
  });
};

export const useCancelAppointment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => appointmentsApi.cancel(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['appointments'] }),
  });
};

export const useCompleteAppointment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => appointmentsApi.complete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['appointments'] }),
  });
};

export const useSubmitNotes = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => appointmentsApi.submitNotes(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['appointments'] }),
  });
};

// ═══════════════════════════════════════════════════════════
//  DOCTOR PORTAL QUERIES
// ═══════════════════════════════════════════════════════════

export const useDoctorSchedule = (date) =>
  useQuery({
    queryKey: ['doctor-schedule', date],
    queryFn: () => doctorPortalApi.getSchedule(date),
    enabled: !!date,
  });

export const useDoctorProfile = () =>
  useQuery({
    queryKey: ['doctor-profile'],
    queryFn: () => doctorPortalApi.getProfile(),
  });

// ═══════════════════════════════════════════════════════════
//  ADMIN QUERIES & MUTATIONS
// ═══════════════════════════════════════════════════════════

export const useAdminDoctors = () =>
  useQuery({
    queryKey: ['admin-doctors'],
    queryFn: () => adminApi.getDoctors(),
  });

export const useAdminDoctor = (id) =>
  useQuery({
    queryKey: ['admin-doctors', id],
    queryFn: () => adminApi.getDoctor(id),
    enabled: !!id,
  });

export const useCreateDoctor = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => adminApi.createDoctor(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-doctors'] }),
  });
};

export const useUpdateDoctor = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => adminApi.updateDoctor(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-doctors'] }),
  });
};

export const useDoctorLeaves = (doctorId) =>
  useQuery({
    queryKey: ['doctor-leaves', doctorId],
    queryFn: () => adminApi.getDoctorLeaves(doctorId),
    enabled: !!doctorId,
  });

export const useMarkLeave = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ doctorId, data }) => adminApi.markLeave(doctorId, data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['doctor-leaves', vars.doctorId] });
    },
  });
};

// ═══════════════════════════════════════════════════════════
//  NOTIFICATIONS
// ═══════════════════════════════════════════════════════════

export const useNotifications = () =>
  useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.getMine(),
    refetchInterval: 30_000,
  });
