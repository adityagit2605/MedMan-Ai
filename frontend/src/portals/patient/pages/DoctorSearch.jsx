import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search as SearchIcon, MapPin, Clock } from 'lucide-react';
import { Card, Input, Select, SkeletonCard } from '../../../design-system';
import { useDoctors } from '../../../api/queries';

const specialisations = [
  { value: 'Cardiology',      label: 'Cardiology' },
  { value: 'Dermatology',     label: 'Dermatology' },
  { value: 'Endocrinology',   label: 'Endocrinology' },
  { value: 'Neurology',       label: 'Neurology' },
  { value: 'Orthopedics',     label: 'Orthopedics' },
  { value: 'Pediatrics',      label: 'Pediatrics' },
  { value: 'Psychiatry',      label: 'Psychiatry' },
  { value: 'General Practice',label: 'General Practice' },
];

export default function DoctorSearchPage() {
  const [specialisation, setSpecialisation] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const { data: doctors = [], isLoading } = useDoctors(specialisation || undefined);

  const filtered = doctors.filter((d) =>
    d.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-800">Find a Doctor</h1>
        <p className="text-neutral-500 mt-1">Search and book appointments with specialists</p>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Search by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-patient-500 focus:border-patient-500"
            />
          </div>
          <div className="w-full sm:w-64">
            <Select
              id="specialisation-filter"
              placeholder="All Specialisations"
              options={specialisations}
              value={specialisation}
              onChange={(e) => setSpecialisation(e.target.value)}
            />
          </div>
        </div>
      </Card>

      {/* Results */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="text-center py-10">
          <SearchIcon className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
          <p className="text-sm text-neutral-500">No doctors found matching your criteria</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((doctor) => (
            <Link key={doctor.doctorProfileId} to={`/patient/doctors/${doctor.doctorProfileId}`}>
              <Card className="hover:shadow-card-hover transition-shadow duration-200 cursor-pointer h-full">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-xl bg-patient-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-lg font-bold text-patient-600">
                      {doctor.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-neutral-800">{doctor.name}</h3>
                    <p className="text-xs text-patient-600 font-medium mt-0.5">{doctor.specialisation}</p>
                    {doctor.bio && (
                      <p className="text-xs text-neutral-500 mt-2 line-clamp-2">{doctor.bio}</p>
                    )}
                    <div className="flex items-center gap-3 mt-3 text-xs text-neutral-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {doctor.slotDurationMinutes} min slots
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
