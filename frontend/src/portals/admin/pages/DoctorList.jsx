import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { Card, Button, Table, SkeletonTable, Modal } from '../../../design-system';
import { useAdminDoctors } from '../../../api/queries';
import DoctorCreateForm from '../components/DoctorCreateForm';

export default function DoctorListPage() {
  const { data: doctors = [], isLoading } = useAdminDoctors();
  const [showCreate, setShowCreate] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const filtered = doctors.filter(d =>
    d.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.specialisation?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    {
      key: 'name',
      label: 'Name',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-admin-100 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-semibold text-admin-700">
              {row.name?.charAt(0)}
            </span>
          </div>
          <span className="font-medium text-neutral-800">{row.name}</span>
        </div>
      ),
    },
    { key: 'specialisation', label: 'Specialisation' },
    { key: 'email', label: 'Email' },
    {
      key: 'slotDurationMinutes',
      label: 'Slot',
      render: (row) => <span>{row.slotDurationMinutes} min</span>,
    },
    {
      key: 'workingHours',
      label: 'Working Days',
      render: (row) => <span>{row.workingHours?.length || 0} days</span>,
    },
  ];

  return (
    <div className="max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-800">Doctors</h1>
          <p className="text-neutral-500 mt-1">{doctors.length} registered doctors</p>
        </div>
        <Button icon={Plus} onClick={() => setShowCreate(true)}>
          Add Doctor
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
        <input
          type="text"
          placeholder="Search doctors..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-white border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-admin-500 focus:border-admin-500"
        />
      </div>

      {isLoading ? (
        <SkeletonTable rows={5} cols={5} />
      ) : (
        <Table
          columns={columns}
          data={filtered}
          emptyMessage="No doctors found"
          onRowClick={(row) => navigate(`/admin/doctors/${row.doctorProfileId}`)}
        />
      )}

      {/* Create modal */}
      <Modal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        title="Add New Doctor"
        size="lg"
      >
        <DoctorCreateForm onSuccess={() => setShowCreate(false)} />
      </Modal>
    </div>
  );
}
