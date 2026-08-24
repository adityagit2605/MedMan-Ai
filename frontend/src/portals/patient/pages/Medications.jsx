import React from 'react';
import { Pill, Clock, AlertCircle } from 'lucide-react';
import { Card, SkeletonCard } from '../../../design-system';
import { useMyAppointments } from '../../../api/queries';

export default function MedicationsPage() {
  const { data: appointments = [], isLoading } = useMyAppointments();

  // Extract prescriptions from completed appointments
  const prescriptions = appointments
    .filter(a => a.status === 'COMPLETED' && a.visitSummary)
    .flatMap(a => {
      // prescriptions would come from visit summary or a separate endpoint
      return [{
        appointmentId: a.id,
        doctorName: a.doctorName,
        date: a.date,
        notes: a.visitSummary?.clinicalNotes,
        summary: a.visitSummary?.patientSummary,
      }];
    });

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-800">Medications & Prescriptions</h1>
        <p className="text-neutral-500 mt-1">Your prescriptions from completed visits</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
        </div>
      ) : prescriptions.length === 0 ? (
        <Card className="text-center py-10">
          <Pill className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
          <p className="text-sm text-neutral-500 mb-1">No prescriptions yet</p>
          <p className="text-xs text-neutral-400">
            Prescriptions will appear here after your doctor completes a visit.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {prescriptions.map((rx, i) => (
            <Card key={i}>
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
                  <Pill className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-neutral-800">
                      Prescription from {rx.doctorName}
                    </h3>
                    <span className="text-xs text-neutral-500">{rx.date}</span>
                  </div>
                  {rx.summary && (
                    <p className="text-sm text-neutral-600 leading-relaxed whitespace-pre-wrap">
                      {rx.summary}
                    </p>
                  )}
                  {!rx.summary && rx.notes && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-2">
                      <div className="flex items-center gap-1.5 mb-1">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                        <span className="text-xs font-medium text-amber-700">AI summary unavailable</span>
                      </div>
                      <p className="text-sm text-neutral-600">{rx.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
