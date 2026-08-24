import React from 'react';
import { MailWarning, RefreshCw } from 'lucide-react';
import { Card, Table, SkeletonTable } from '../../../design-system';
import { StatusBadge } from '../../../design-system/Badge';
import { useNotifications } from '../../../api/queries';

export default function NotificationsPage() {
  const { data: notifications = [], isLoading } = useNotifications();

  const columns = [
    {
      key: 'type',
      label: 'Type',
      render: (row) => (
        <span className="text-sm font-medium text-neutral-700">{row.type}</span>
      ),
    },
    {
      key: 'channel',
      label: 'Channel',
      render: (row) => (
        <span className="text-xs px-2 py-1 bg-neutral-100 rounded-md text-neutral-600">
          {row.channel}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'createdAt',
      label: 'Created',
      render: (row) => (
        <span className="text-xs text-neutral-500">
          {row.createdAt ? new Date(row.createdAt).toLocaleString() : '—'}
        </span>
      ),
    },
    {
      key: 'sentAt',
      label: 'Sent',
      render: (row) => (
        <span className="text-xs text-neutral-500">
          {row.sentAt ? new Date(row.sentAt).toLocaleString() : '—'}
        </span>
      ),
    },
  ];

  const failedCount = notifications.filter(n => n.status === 'FAILED').length;

  return (
    <div className="max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-800">Notifications</h1>
          <p className="text-neutral-500 mt-1">
            {notifications.length} total • {failedCount} failed
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {['PENDING', 'SENT', 'FAILED'].map((status) => {
          const count = notifications.filter(n => n.status === status).length;
          const colors = {
            PENDING: 'bg-amber-50 text-amber-700',
            SENT:    'bg-green-50 text-green-700',
            FAILED:  'bg-red-50 text-red-700',
          };
          return (
            <Card key={status} padding="p-4">
              <div className="flex items-center justify-between">
                <span className={`text-xs font-semibold uppercase tracking-wider ${colors[status]?.split(' ')[1]}`}>
                  {status}
                </span>
                <span className="text-2xl font-bold text-neutral-800">{count}</span>
              </div>
            </Card>
          );
        })}
      </div>

      {isLoading ? (
        <SkeletonTable rows={5} cols={5} />
      ) : (
        <Table
          columns={columns}
          data={notifications}
          emptyMessage="No notifications recorded yet"
        />
      )}
    </div>
  );
}
