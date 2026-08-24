import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { ArrowLeft, Calendar, AlertTriangle, Users } from 'lucide-react';
import { Card, Button, Modal, SkeletonCard } from '../../../design-system';
import { useAdminDoctor, useDoctorLeaves, useMarkLeave } from '../../../api/queries';

export default function DoctorEditPage() {
  const { id } = useParams();
  const { data: doctor, isLoading } = useAdminDoctor(id);
  const { data: leaves = [] } = useDoctorLeaves(id);
  const markLeaveMutation = useMarkLeave();

  const [selectedDate, setSelectedDate] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const handleMarkLeave = async () => {
    if (!selectedDate) return;
    try {
      const result = await markLeaveMutation.mutateAsync({
        doctorId: id,
        data: { leaveDate: format(selectedDate, 'yyyy-MM-dd') },
      });
      toast.success('Leave marked successfully');
      setShowConfirmModal(false);
      setSelectedDate(null);

      const affected = result?.affectedAppointments || 0;
      if (affected > 0) {
        toast.info(`${affected} patient(s) have been notified to reschedule.`);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to mark leave');
    }
  };

  const leaveDates = leaves.map(l => new Date(l.leaveDate || l.date));

  if (isLoading) {
    return <div className="max-w-3xl space-y-4"><SkeletonCard /><SkeletonCard /></div>;
  }

  if (!doctor) {
    return <Card className="text-center py-10"><p className="text-neutral-500">Doctor not found.</p></Card>;
  }

  return (
    <div className="max-w-3xl space-y-6">
      <Link to="/admin/doctors" className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-700">
        <ArrowLeft className="w-4 h-4" />
        Back to doctors
      </Link>

      {/* Doctor info */}
      <Card>
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 rounded-xl bg-admin-100 flex items-center justify-center">
            <span className="text-xl font-bold text-admin-700">
              {doctor.name?.charAt(0)}
            </span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-neutral-800">{doctor.name}</h1>
            <p className="text-sm text-admin-600 font-medium">{doctor.specialisation}</p>
            <p className="text-xs text-neutral-500 mt-1">
              {doctor.email} • {doctor.slotDurationMinutes} min slots
            </p>
          </div>
        </div>
      </Card>

      {/* Working hours */}
      {doctor.workingHours?.length > 0 && (
        <Card>
          <h2 className="text-base font-semibold text-neutral-800 mb-3">Working Hours</h2>
          <div className="space-y-2">
            {doctor.workingHours.map((wh) => (
              <div key={wh.dayOfWeek} className="flex items-center justify-between py-2 px-3 bg-neutral-50 rounded-lg">
                <span className="text-sm font-medium text-neutral-700">
                  {wh.dayName || dayNames[wh.dayOfWeek]}
                </span>
                <span className="text-sm text-neutral-600">{wh.startTime} — {wh.endTime}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Leave management */}
      <Card>
        <h2 className="text-base font-semibold text-neutral-800 mb-4">Leave Management</h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Calendar */}
          <div>
            <DayPicker
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              disabled={{ before: new Date() }}
              modifiers={{ leave: leaveDates }}
              modifiersStyles={{
                leave: { backgroundColor: '#fef3c7', color: '#d97706', fontWeight: 600 },
              }}
              className="!m-0"
            />
            {selectedDate && (
              <Button
                className="w-full mt-3"
                variant="danger"
                onClick={() => setShowConfirmModal(true)}
              >
                Mark {format(selectedDate, 'MMM d')} as Leave
              </Button>
            )}
          </div>

          {/* Existing leaves */}
          <div>
            <p className="text-sm font-medium text-neutral-600 mb-3">Scheduled Leaves</p>
            {leaves.length === 0 ? (
              <p className="text-sm text-neutral-400">No leaves scheduled</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {leaves.map((l, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 bg-amber-50 rounded-lg">
                    <Calendar className="w-4 h-4 text-amber-600" />
                    <span className="text-sm text-amber-800">
                      {l.leaveDate || l.date}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Leave confirmation modal */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="Confirm Leave"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">
                Mark {selectedDate && format(selectedDate, 'EEEE, MMMM d, yyyy')} as leave?
              </p>
              <p className="text-xs text-amber-600 mt-1">
                Any existing bookings on this date will be flagged for reschedule. Affected patients will be notified.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setShowConfirmModal(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              className="flex-1"
              loading={markLeaveMutation.isPending}
              onClick={handleMarkLeave}
            >
              Confirm Leave
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
