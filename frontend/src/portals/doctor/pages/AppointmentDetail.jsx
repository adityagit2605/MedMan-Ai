import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Clock, Brain, AlertCircle, FileText, CheckCircle2, ClipboardList } from 'lucide-react';
import { Card, Button, SkeletonCard } from '../../../design-system';
import { StatusBadge, UrgencyBadge } from '../../../design-system/Badge';
import { useAppointment, useCompleteAppointment } from '../../../api/queries';
import { format } from 'date-fns';

export default function DoctorAppointmentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: appt, isLoading } = useAppointment(id);
  const completeMutation = useCompleteAppointment();

  const handleComplete = async () => {
    try {
      await completeMutation.mutateAsync(id);
      toast.success('Appointment marked as completed');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to complete');
    }
  };

  if (isLoading) {
    return <div className="max-w-3xl space-y-4"><SkeletonCard /><SkeletonCard /></div>;
  }

  if (!appt) {
    return <Card className="max-w-3xl text-center py-10"><p className="text-neutral-500">Appointment not found.</p></Card>;
  }

  const hasPreVisit = appt.symptomSummary;
  const llmWorked = hasPreVisit?.llmStatus === 'SUCCESS';
  const hasPostVisit = appt.visitSummary;
  const canComplete = appt.status === 'CONFIRMED';
  const canAddNotes = appt.status === 'COMPLETED' && !hasPostVisit;

  return (
    <div className="max-w-3xl space-y-6">
      <Link to="/doctor" className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-700">
        <ArrowLeft className="w-4 h-4" />
        Back to schedule
      </Link>

      {/* Patient header */}
      <Card>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-xl font-bold text-neutral-800">{appt.patientName}</h1>
              <StatusBadge status={appt.status} />
            </div>
            <div className="flex items-center gap-4 mt-2 text-sm text-neutral-600">
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-neutral-400" />
                {appt.date && format(new Date(appt.date), 'EEEE, MMMM d, yyyy')}
              </span>
              <span>{appt.startTime?.slice(0, 5)} – {appt.endTime?.slice(0, 5)}</span>
            </div>
          </div>
          <div className="flex gap-2">
            {canComplete && (
              <Button
                variant="success"
                size="sm"
                onClick={handleComplete}
                loading={completeMutation.isPending}
                icon={CheckCircle2}
              >
                Mark Complete
              </Button>
            )}
            {canAddNotes && (
              <Link to={`/doctor/appointments/${id}/notes`}>
                <Button size="sm" icon={ClipboardList}>
                  Add Notes
                </Button>
              </Link>
            )}
          </div>
        </div>
      </Card>

      {/* Pre-visit summary */}
      {hasPreVisit && (
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Brain className="w-5 h-5 text-doctor-600" />
            <h2 className="text-base font-semibold text-neutral-800">Pre-Visit AI Summary</h2>
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
                  <ul className="space-y-1.5">
                    {appt.symptomSummary.suggestedQuestions.map((q, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-neutral-600">
                        <CheckCircle2 className="w-3.5 h-3.5 text-doctor-500 mt-0.5 flex-shrink-0" />
                        {q}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div>
                <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">Raw Symptoms</p>
                <p className="text-sm text-neutral-600">{appt.symptomSummary.symptomsRaw}</p>
              </div>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <p className="text-sm font-medium text-amber-800">AI summary unavailable</p>
              </div>
              <p className="text-sm text-neutral-600">
                <span className="font-medium">Patient reported symptoms:</span> {appt.symptomSummary.symptomsRaw}
              </p>
            </div>
          )}
        </Card>
      )}

      {/* Post-visit notes */}
      {hasPostVisit && (
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-green-600" />
            <h2 className="text-base font-semibold text-neutral-800">Clinical Notes</h2>
          </div>
          <p className="text-sm text-neutral-700 leading-relaxed whitespace-pre-wrap">
            {appt.visitSummary.clinicalNotes}
          </p>
        </Card>
      )}

      {/* No pre-visit at all */}
      {!hasPreVisit && appt.status === 'CONFIRMED' && (
        <Card className="bg-neutral-50 text-center py-6">
          <p className="text-sm text-neutral-500">No symptom data submitted yet.</p>
        </Card>
      )}
    </div>
  );
}
