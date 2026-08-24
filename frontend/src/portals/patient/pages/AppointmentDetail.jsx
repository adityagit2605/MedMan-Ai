import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Clock, AlertCircle, FileText, Pill, Brain, CheckCircle2 } from 'lucide-react';
import { Card, Button, SkeletonCard } from '../../../design-system';
import { StatusBadge, UrgencyBadge } from '../../../design-system/Badge';
import { useAppointment, useCancelAppointment } from '../../../api/queries';
import { format } from 'date-fns';

export default function AppointmentDetailPage() {
  const { id } = useParams();
  const { data: appt, isLoading } = useAppointment(id);
  const cancelMutation = useCancelAppointment();

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
    try {
      await cancelMutation.mutateAsync(id);
      toast.success('Appointment cancelled');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to cancel');
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl space-y-4">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (!appt) {
    return (
      <Card className="max-w-3xl text-center py-10">
        <p className="text-neutral-500">Appointment not found.</p>
      </Card>
    );
  }

  const canCancel = ['CONFIRMED', 'HELD'].includes(appt.status);
  const hasPreVisit = appt.symptomSummary;
  const llmWorked = hasPreVisit?.llmStatus === 'SUCCESS';
  const hasPostVisit = appt.visitSummary;
  const postLlmWorked = hasPostVisit?.llmStatus === 'SUCCESS';

  return (
    <div className="max-w-3xl space-y-6">
      <Link to="/patient/appointments" className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-700">
        <ArrowLeft className="w-4 h-4" />
        Back to appointments
      </Link>

      {/* Header card */}
      <Card>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-xl font-bold text-neutral-800">{appt.doctorName}</h1>
              <StatusBadge status={appt.status} />
            </div>
            <p className="text-sm text-patient-600 font-medium">{appt.specialisation}</p>
            <div className="flex items-center gap-4 mt-3 text-sm text-neutral-600">
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-neutral-400" />
                {appt.date && format(new Date(appt.date), 'EEEE, MMMM d, yyyy')}
              </span>
              <span>{appt.startTime?.slice(0, 5)} – {appt.endTime?.slice(0, 5)}</span>
            </div>
          </div>
          {canCancel && (
            <Button
              variant="danger"
              size="sm"
              onClick={handleCancel}
              loading={cancelMutation.isPending}
            >
              Cancel
            </Button>
          )}
        </div>

        {/* Leave conflict warning */}
        {appt.status === 'LEAVE_CONFLICT' && (
          <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-orange-800">
                Your appointment needs to be rescheduled
              </p>
              <p className="text-xs text-orange-600 mt-1">
                Your doctor is unavailable on this date. Please book a new appointment.
              </p>
              <Link to="/patient/doctors">
                <Button variant="secondary" size="sm" className="mt-2">
                  Book New Appointment
                </Button>
              </Link>
            </div>
          </div>
        )}
      </Card>

      {/* Pre-visit AI summary */}
      {hasPreVisit && (
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Brain className="w-5 h-5 text-patient-600" />
            <h2 className="text-base font-semibold text-neutral-800">
              AI Pre-Visit Summary
            </h2>
            {appt.symptomSummary.urgencyLevel && (
              <UrgencyBadge level={appt.symptomSummary.urgencyLevel} />
            )}
          </div>

          {llmWorked ? (
            <div className="space-y-4">
              {appt.symptomSummary.chiefComplaint && (
                <div>
                  <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">Chief Complaint</p>
                  <p className="text-sm text-neutral-700">{appt.symptomSummary.chiefComplaint}</p>
                </div>
              )}
              {appt.symptomSummary.suggestedQuestions?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">Suggested Questions</p>
                  <ul className="space-y-1">
                    {appt.symptomSummary.suggestedQuestions.map((q, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-neutral-600">
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-500 mt-0.5 flex-shrink-0" />
                        {q}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <p className="text-sm font-medium text-amber-800">AI summary unavailable</p>
              </div>
              <p className="text-sm text-neutral-600">
                <span className="font-medium">Your symptoms:</span> {appt.symptomSummary.symptomsRaw}
              </p>
            </div>
          )}
        </Card>
      )}

      {/* Post-visit summary */}
      {hasPostVisit && (
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-green-600" />
            <h2 className="text-base font-semibold text-neutral-800">Post-Visit Summary</h2>
          </div>

          {postLlmWorked ? (
            <p className="text-sm text-neutral-700 leading-relaxed whitespace-pre-wrap">
              {appt.visitSummary.patientSummary}
            </p>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <p className="text-sm font-medium text-amber-800">AI summary unavailable</p>
              </div>
              <p className="text-sm text-neutral-600">
                <span className="font-medium">Doctor's Notes:</span> {appt.visitSummary.clinicalNotes}
              </p>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
