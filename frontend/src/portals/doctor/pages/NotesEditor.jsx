import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { ArrowLeft, Plus, Trash2, Send } from 'lucide-react';
import { Card, Button, Input, Textarea } from '../../../design-system';
import { useSubmitNotes } from '../../../api/queries';

const notesSchema = z.object({
  clinicalNotes: z.string().min(5, 'Please enter clinical notes'),
  prescriptions: z.array(z.object({
    medicineName: z.string().min(1, 'Medicine name is required'),
    dosage: z.string().min(1, 'Dosage is required'),
    frequency: z.string().min(1, 'Frequency is required'),
    durationDays: z.coerce.number().min(1, 'Duration must be at least 1 day'),
  })).optional(),
});

export default function NotesEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const submitMutation = useSubmitNotes();

  const {
    register, control, handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(notesSchema),
    defaultValues: {
      clinicalNotes: '',
      prescriptions: [],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'prescriptions' });

  const onSubmit = async (data) => {
    try {
      await submitMutation.mutateAsync({ id, data });
      toast.success('Notes submitted — AI summary generation started');
      navigate(`/doctor/appointments/${id}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit notes');
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <Link to={`/doctor/appointments/${id}`} className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-700">
        <ArrowLeft className="w-4 h-4" />
        Back to appointment
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-neutral-800">Post-Visit Notes</h1>
        <p className="text-neutral-500 mt-1">Submit clinical notes and prescriptions</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Clinical notes */}
        <Card>
          <h2 className="text-base font-semibold text-neutral-800 mb-3">Clinical Notes</h2>
          <Textarea
            id="clinical-notes"
            placeholder="Enter clinical observations, examination findings, and manual assessments here..."
            rows={6}
            error={errors.clinicalNotes?.message}
            {...register('clinicalNotes')}
          />
        </Card>

        {/* Prescriptions */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-neutral-800">Prescriptions</h2>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              icon={Plus}
              onClick={() => append({ medicineName: '', dosage: '', frequency: '', durationDays: '' })}
            >
              Add Medicine
            </Button>
          </div>

          {fields.length === 0 ? (
            <p className="text-sm text-neutral-500 text-center py-4">
              No prescriptions added yet. Click "Add Medicine" to begin.
            </p>
          ) : (
            <div className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="p-4 bg-neutral-50 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-neutral-600">
                      Prescription #{index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="p-1 rounded text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input
                      id={`rx-${index}-name`}
                      label="Medicine Name"
                      placeholder="e.g. Amoxicillin"
                      error={errors.prescriptions?.[index]?.medicineName?.message}
                      {...register(`prescriptions.${index}.medicineName`)}
                    />
                    <Input
                      id={`rx-${index}-dosage`}
                      label="Dosage"
                      placeholder="e.g. 500mg"
                      error={errors.prescriptions?.[index]?.dosage?.message}
                      {...register(`prescriptions.${index}.dosage`)}
                    />
                    <Input
                      id={`rx-${index}-frequency`}
                      label="Frequency"
                      placeholder="e.g. 1-0-1 or every 8h"
                      error={errors.prescriptions?.[index]?.frequency?.message}
                      {...register(`prescriptions.${index}.frequency`)}
                    />
                    <Input
                      id={`rx-${index}-duration`}
                      label="Duration (days)"
                      type="number"
                      min="1"
                      placeholder="e.g. 7"
                      error={errors.prescriptions?.[index]?.durationDays?.message}
                      {...register(`prescriptions.${index}.durationDays`)}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Button
          type="submit"
          loading={isSubmitting || submitMutation.isPending}
          className="w-full"
          size="lg"
          icon={Send}
        >
          Submit Notes & Prescriptions
        </Button>
      </form>
    </div>
  );
}
