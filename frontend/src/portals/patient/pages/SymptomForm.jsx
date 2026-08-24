import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { ArrowLeft, Send, AlertCircle, MessageSquare } from 'lucide-react';
import { Card, Button, Textarea } from '../../../design-system';
import { useAppointment, useConfirmAppointment } from '../../../api/queries';

const symptomSchema = z.object({
  symptoms: z.string()
    .min(10, 'Please describe your symptoms in at least 10 characters')
    .max(2000, 'Keep your description under 2000 characters'),
});

export default function SymptomFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: appointment, isLoading } = useAppointment(id);
  const confirmMutation = useConfirmAppointment();

  const {
    register, handleSubmit, watch,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(symptomSchema) });

  const symptoms = watch('symptoms', '');

  const onSubmit = async (data) => {
    try {
      await confirmMutation.mutateAsync({ id, data });
      toast.success('Appointment confirmed!');
      navigate(`/patient/appointments/${id}`);
    } catch (err) {
      if (err.response?.data?.error?.includes('expired') || err.response?.data?.error?.includes('HELD')) {
        toast.error('Your hold has expired. Please pick a new slot.');
        navigate(-1);
      } else {
        toast.error(err.response?.data?.error || 'Failed to confirm appointment');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl space-y-4">
        <div className="skeleton h-8 w-48" />
        <div className="skeleton h-64 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <Link to={-1} className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-700">
        <ArrowLeft className="w-4 h-4" />
        Back
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-neutral-800">Describe your symptoms</h1>
        <p className="text-neutral-500 mt-1">
          Our clinical AI will help prepare your profile for the doctor.
        </p>
      </div>

      {/* AI helper prompt */}
      <Card className="bg-patient-50 border-patient-200">
        <div className="flex gap-3">
          <div className="w-9 h-9 rounded-full bg-patient-600 flex items-center justify-center flex-shrink-0">
            <MessageSquare className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm text-patient-800 leading-relaxed">
              Hello. To get started, could you briefly describe what brings you in today?
              You can type naturally, e.g., "I've had a headache for 3 days."
            </p>
          </div>
        </div>
      </Card>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <Card>
          <Textarea
            id="symptoms-input"
            label="Your Response"
            placeholder="Describe your symptoms here..."
            rows={6}
            error={errors.symptoms?.message}
            {...register('symptoms')}
          />
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-neutral-400">{symptoms.length}/2000</span>
          </div>
        </Card>

        {/* Disclaimer */}
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700 leading-relaxed">
            This information helps your doctor prepare for your visit. For medical emergencies,
            please call emergency services immediately.
          </p>
        </div>

        <Button
          type="submit"
          loading={isSubmitting || confirmMutation.isPending}
          className="w-full"
          icon={Send}
        >
          Confirm Appointment
        </Button>
      </form>
    </div>
  );
}
