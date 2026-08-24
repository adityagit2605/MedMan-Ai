import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { format, addDays, isBefore, startOfToday } from 'date-fns';
import { toast } from 'sonner';
import { ArrowLeft, Clock, AlertCircle, Calendar } from 'lucide-react';
import { Card, Button, SkeletonSlotGrid } from '../../../design-system';
import { useDoctor, useSlots, useHoldSlot } from '../../../api/queries';

export default function BookAppointmentPage() {
  const { doctorId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const dateParam = searchParams.get('date');
  const [selectedDate, setSelectedDate] = useState(
    dateParam ? new Date(dateParam) : addDays(new Date(), 1)
  );

  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  const { data: doctor } = useDoctor(doctorId);
  const { data: slotsData, isLoading: slotsLoading, refetch: refetchSlots } = useSlots(doctorId, dateStr);
  const holdMutation = useHoldSlot();

  // Hold state
  const [holdingSlot, setHoldingSlot] = useState(null);
  const [heldAppointment, setHeldAppointment] = useState(null);
  const [holdCountdown, setHoldCountdown] = useState(null);

  // Countdown timer
  useEffect(() => {
    if (!heldAppointment?.holdExpiresAt) return;

    const interval = setInterval(() => {
      const expiresAt = new Date(heldAppointment.holdExpiresAt);
      const now = new Date();
      const diff = Math.max(0, Math.floor((expiresAt - now) / 1000));

      if (diff <= 0) {
        setHoldCountdown(0);
        setHeldAppointment(null);
        setHoldingSlot(null);
        toast.warning('Hold expired — please pick another slot');
        refetchSlots();
        clearInterval(interval);
      } else {
        setHoldCountdown(diff);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [heldAppointment, refetchSlots]);

  const handleDateSelect = (date) => {
    if (date) {
      setSelectedDate(date);
      setSearchParams({ date: format(date, 'yyyy-MM-dd') });
      setHeldAppointment(null);
      setHoldingSlot(null);
    }
  };

  const handleSlotClick = async (slot) => {
    if (holdMutation.isPending) return;
    setHoldingSlot(slot.startTime);

    try {
      const result = await holdMutation.mutateAsync({
        doctorId,
        date: dateStr,
        startTime: slot.startTime,
      });
      setHeldAppointment(result);
      toast.success('Slot held! Complete the symptom form to confirm.');
    } catch (err) {
      if (err.response?.status === 409) {
        toast.error('This slot was just taken — pick another');
        refetchSlots();
      } else {
        toast.error(err.response?.data?.error || 'Failed to hold slot');
      }
      setHoldingSlot(null);
    }
  };

  const formatCountdown = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const slots = slotsData?.slots || [];

  return (
    <div className="max-w-4xl space-y-6">
      <Link to={`/patient/doctors/${doctorId}`} className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-700">
        <ArrowLeft className="w-4 h-4" />
        Back to doctor
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-neutral-800">Book Appointment</h1>
        {doctor && (
          <p className="text-neutral-500 mt-1">
            {doctor.name} — {doctor.specialisation}
          </p>
        )}
      </div>

      {/* Hold banner */}
      {heldAppointment && holdCountdown !== null && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 flex items-center gap-4">
          <Clock className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-800">
              Slot held — {formatCountdown(holdCountdown)} remaining
            </p>
            <p className="text-xs text-amber-600 mt-0.5">
              Complete the symptom form to confirm your booking.
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => navigate(`/patient/appointments/${heldAppointment.id}/symptoms`)}
          >
            Complete Form
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-1">
          <h2 className="text-sm font-semibold text-neutral-800 mb-3">Select Date</h2>
          <DayPicker
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            disabled={{ before: startOfToday() }}
            className="!m-0"
          />
        </Card>

        {/* Slot grid */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-neutral-800">
              Available Slots — {format(selectedDate, 'EEEE, MMMM d')}
            </h2>
            {slotsData?.slotDurationMinutes && (
              <span className="text-xs text-neutral-500">
                {slotsData.slotDurationMinutes} min each
              </span>
            )}
          </div>

          {slotsLoading ? (
            <SkeletonSlotGrid />
          ) : slots.length === 0 ? (
            <div className="text-center py-10">
              <Calendar className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
              <p className="text-sm text-neutral-500 mb-2">
                No open slots on this date
              </p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleDateSelect(addDays(selectedDate, 1))}
              >
                Try {format(addDays(selectedDate, 1), 'EEEE, MMM d')}
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {slots.map((slot) => {
                const isHeld = heldAppointment && holdingSlot === slot.startTime;
                const isHolding = holdMutation.isPending && holdingSlot === slot.startTime;

                return (
                  <button
                    key={slot.startTime}
                    onClick={() => handleSlotClick(slot)}
                    disabled={isHeld || holdMutation.isPending || !!heldAppointment}
                    className={`
                      py-3 px-2 rounded-lg text-sm font-medium border transition-colors duration-150
                      ${isHeld
                        ? 'bg-patient-100 border-patient-400 text-patient-700'
                        : 'bg-white border-neutral-200 text-neutral-700 hover:bg-patient-50 hover:border-patient-300 hover:text-patient-700'
                      }
                      ${(!!heldAppointment && !isHeld) ? 'opacity-40 cursor-not-allowed' : ''}
                      disabled:cursor-not-allowed
                    `}
                  >
                    {isHolding ? (
                      <span className="flex items-center justify-center gap-1">
                        <Clock className="w-3.5 h-3.5 animate-spin" />
                        Holding...
                      </span>
                    ) : (
                      <>
                        {slot.startTime?.slice(0, 5)}
                        {isHeld && <span className="block text-[10px] mt-0.5">HELD</span>}
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
