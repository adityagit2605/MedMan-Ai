import React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';
import { Button, Input, Select } from '../../../design-system';
import { useCreateDoctor } from '../../../api/queries';

const dayOptions = [
  { value: '0', label: 'Sunday' },
  { value: '1', label: 'Monday' },
  { value: '2', label: 'Tuesday' },
  { value: '3', label: 'Wednesday' },
  { value: '4', label: 'Thursday' },
  { value: '5', label: 'Friday' },
  { value: '6', label: 'Saturday' },
];

const schema = z.object({
  name:               z.string().min(2),
  email:              z.string().email(),
  password:           z.string().min(8),
  phone:              z.string().optional(),
  specialisation:     z.string().min(1, 'Required'),
  slotDurationMinutes: z.coerce.number().min(10).max(120),
  bio:                z.string().optional(),
  workingHours: z.array(z.object({
    dayOfWeek: z.coerce.number().min(0).max(6),
    startTime: z.string().min(1),
    endTime:   z.string().min(1),
  })).optional(),
});

export default function DoctorCreateForm({ onSuccess }) {
  const createMutation = useCreateDoctor();
  const {
    register, control, handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      slotDurationMinutes: 30,
      workingHours: [{ dayOfWeek: 1, startTime: '09:00', endTime: '17:00' }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'workingHours' });

  const onSubmit = async (data) => {
    try {
      await createMutation.mutateAsync(data);
      toast.success('Doctor created successfully');
      onSuccess?.();
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Failed to create doctor');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input id="doc-name" label="Full Name" error={errors.name?.message} {...register('name')} />
        <Input id="doc-email" label="Email" type="email" error={errors.email?.message} {...register('email')} />
        <Input id="doc-password" label="Password" type="password" error={errors.password?.message} {...register('password')} />
        <Input id="doc-phone" label="Phone" {...register('phone')} />
        <Input id="doc-spec" label="Specialisation" placeholder="e.g. Cardiology" error={errors.specialisation?.message} {...register('specialisation')} />
        <Input id="doc-slot" label="Slot Duration (min)" type="number" min="10" max="120" error={errors.slotDurationMinutes?.message} {...register('slotDurationMinutes')} />
      </div>

      <Input id="doc-bio" label="Bio (optional)" placeholder="Brief professional bio" {...register('bio')} />

      {/* Working hours */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-neutral-700">Working Hours</p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            icon={Plus}
            onClick={() => append({ dayOfWeek: 1, startTime: '09:00', endTime: '17:00' })}
          >
            Add Day
          </Button>
        </div>
        <div className="space-y-2">
          {fields.map((field, i) => (
            <div key={field.id} className="flex items-center gap-2 bg-neutral-50 p-3 rounded-lg">
              <div className="w-32">
                <Select
                  id={`wh-${i}-day`}
                  options={dayOptions}
                  {...register(`workingHours.${i}.dayOfWeek`)}
                />
              </div>
              <Input
                id={`wh-${i}-start`}
                type="time"
                className="w-28"
                {...register(`workingHours.${i}.startTime`)}
              />
              <span className="text-neutral-400 text-sm">to</span>
              <Input
                id={`wh-${i}-end`}
                type="time"
                className="w-28"
                {...register(`workingHours.${i}.endTime`)}
              />
              <button
                type="button"
                onClick={() => remove(i)}
                className="p-1.5 rounded text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <Button type="submit" loading={isSubmitting || createMutation.isPending} className="w-full">
        Create Doctor
      </Button>
    </form>
  );
}
