import { ReactElement, useEffect, useState } from 'react';
import { Head } from '@inertiajs/react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Avatar, Button, DatePicker, Empty, Input, Modal, Pagination, Select, Table, Tag } from 'antd';
import Column from 'antd/es/table/Column';
import axios from 'axios';
import dayjs from 'dayjs';
import {
  Activity,
  Calendar,
  CheckCircle2,
  Clock,
  Eye,
  FilterX,
  RefreshCw,
  Search,
  Sparkles,
} from 'lucide-react';

import AdminLayout from '@/layouts/admin-layout';
import { SharedData } from '@/types';
import { PaginateResponse } from '@/types/paginateResponse';

type ActivityLogItem = {
  id: number;
  action: string;
  description: string | null;
  user_id: number | null;
  created_at: string;
  updated_at: string;
  user?: {
    id: number;
    fname: string | null;
    lname: string | null;
    mname: string | null;
    username: string;
    role: string;
  } | null;
};

type PageProps = {
  title: string;
  stats: {
    total_logs: number;
    today_logs: number;
    vector_logs: number;
    publish_logs: number;
  };
  actions: string[];
};

const actionColorMap: Record<string, { color: string; bg: string; border: string; label: string }> = {
  vectorize: { color: 'text-indigo-700', bg: 'bg-indigo-50', border: 'border-indigo-200', label: 'AI Vectorize' },
  publish: { color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', label: 'Published' },
  insert: { color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200', label: 'Created' },
  'insert-submit': { color: 'text-sky-700', bg: 'bg-sky-50', border: 'border-sky-200', label: 'Created & Submitted' },
  submit: { color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', label: 'Submitted' },
  draft: { color: 'text-slate-700', bg: 'bg-slate-100', border: 'border-slate-200', label: 'Drafted' },
  update: { color: 'text-violet-700', bg: 'bg-violet-50', border: 'border-violet-200', label: 'Updated' },
  delete: { color: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200', label: 'Deleted' },
};

export default function AdminActivityLogIndex({ title, stats, actions }: PageProps) {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [selectedAction, setSelectedAction] = useState<string>('all');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);

  const [selectedLog, setSelectedLog] = useState<ActivityLogItem | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data, isFetching, refetch } = useQuery<PaginateResponse<ActivityLogItem>>({
    queryKey: [
      'admin-activity-logs',
      page,
      perPage,
      search,
      selectedAction,
      dateRange?.[0]?.format('YYYY-MM-DD'),
      dateRange?.[1]?.format('YYYY-MM-DD'),
    ],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: perPage.toString(),
      });
      if (search) params.set('search', search);
      if (selectedAction && selectedAction !== 'all') params.set('action', selectedAction);
      if (dateRange?.[0]) params.set('from_date', dateRange[0].format('YYYY-MM-DD'));
      if (dateRange?.[1]) params.set('to_date', dateRange[1].format('YYYY-MM-DD'));

      const res = await axios.get<PaginateResponse<ActivityLogItem>>(`/admin/get-activity-logs?${params}`);
      return res.data;
    },
    placeholderData: keepPreviousData,
  });

  const logs = data?.data ?? [];
  const total = data?.total ?? 0;

  const renderActionBadge = (action: string) => {
    const config = actionColorMap[action.toLowerCase()] || {
      color: 'text-slate-700',
      bg: 'bg-slate-100',
      border: 'border-slate-200',
      label: action,
    };

    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold border ${config.bg} ${config.color} ${config.border}`}
      >
        {action === 'vectorize' && <Sparkles size={11} className="text-indigo-600" />}
        {action === 'publish' && <CheckCircle2 size={11} className="text-emerald-600" />}
        {config.label}
      </span>
    );
  };

  return (
    <>
      <Head title={title} />

      <div className="mx-2 md:mx-auto max-w-7xl space-y-5">
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Audit Logs</span>
              <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
                <Activity size={18} />
              </div>
            </div>
            <div className="mt-3 text-2xl font-bold text-slate-800">{stats.total_logs.toLocaleString()}</div>
            <div className="mt-1 text-xs text-slate-400">Recorded activities across KM</div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Logged Today</span>
              <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
                <Calendar size={18} />
              </div>
            </div>
            <div className="mt-3 text-2xl font-bold text-slate-800">{stats.today_logs.toLocaleString()}</div>
            <div className="mt-1 text-xs text-slate-400">Events since 12:00 AM</div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">AI Vector Syncs</span>
              <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
                <Sparkles size={18} />
              </div>
            </div>
            <div className="mt-3 text-2xl font-bold text-slate-800">{stats.vector_logs.toLocaleString()}</div>
            <div className="mt-1 text-xs text-slate-400">Qdrant embeddings stored</div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Publications</span>
              <div className="rounded-lg bg-amber-50 p-2 text-amber-600">
                <CheckCircle2 size={18} />
              </div>
            </div>
            <div className="mt-3 text-2xl font-bold text-slate-800">{stats.publish_logs.toLocaleString()}</div>
            <div className="mt-1 text-xs text-slate-400">Published to public catalog</div>
          </div>
        </div>

        {/* Main Content Card */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/60">
          <div className="flex flex-col gap-4 border-b border-slate-200/70 px-4 py-5 sm:flex-row sm:items-center sm:justify-between md:px-6">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Security & Auditing</div>
              <div className="text-xl font-semibold text-slate-900">Activity Logs</div>
              <div className="text-sm text-slate-500">Track user actions, document lifecycle, and AI operations</div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                icon={<RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />}
                onClick={() => refetch()}
              >
                Refresh
              </Button>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="grid grid-cols-1 gap-3 border-b border-slate-100 bg-slate-50/50 p-4 sm:grid-cols-12 md:px-6">
            <div className="sm:col-span-5">
              <Input
                allowClear
                placeholder="Search description, user or action..."
                prefix={<Search size={15} className="text-slate-400" />}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>

            <div className="sm:col-span-3">
              <Select
                className="w-full"
                value={selectedAction}
                onChange={(val) => {
                  setSelectedAction(val);
                  setPage(1);
                }}
                options={[
                  { label: 'All Actions', value: 'all' },
                  ...actions.map((act) => ({
                    label: actionColorMap[act.toLowerCase()]?.label ?? act,
                    value: act,
                  })),
                ]}
              />
            </div>

            <div className="sm:col-span-4">
              <DatePicker.RangePicker
                className="w-full"
                value={dateRange}
                onChange={(dates) => {
                  setDateRange(dates as [dayjs.Dayjs | null, dayjs.Dayjs | null] | null);
                  setPage(1);
                }}
              />
            </div>
          </div>

          {/* Table */}
          <div className="p-4 md:p-6">
            <Table
              dataSource={logs}
              loading={isFetching}
              rowKey="id"
              size="middle"
              pagination={false}
              tableLayout="fixed"
              rowClassName="transition-colors hover:bg-slate-50/80 cursor-pointer"
              onRow={(record) => ({
                onClick: () => setSelectedLog(record),
              })}
              locale={{
                emptyText: (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="No activity logs match your filters."
                  >
                    {(search || selectedAction !== 'all' || dateRange) && (
                      <Button
                        icon={<FilterX size={14} />}
                        onClick={() => {
                          setSearchInput('');
                          setSearch('');
                          setSelectedAction('all');
                          setDateRange(null);
                        }}
                      >
                        Clear Filters
                      </Button>
                    )}
                  </Empty>
                ),
              }}
            >
              <Column
                title="Timestamp"
                key="created_at"
                dataIndex="created_at"
                width={170}
                render={(created_at: string) => (
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-semibold text-slate-700">
                      {dayjs(created_at).format('MMM D, YYYY')}
                    </span>
                    <span className="flex items-center gap-1 text-[0.7rem] text-slate-400">
                      <Clock size={11} /> {dayjs(created_at).format('h:mm:ss A')}
                    </span>
                  </div>
                )}
              />

              <Column
                title="Actor"
                key="user"
                width={200}
                render={(_, row: ActivityLogItem) => {
                  const u = row.user;
                  if (!u) {
                    return <span className="text-xs text-slate-400 italic">System / Deleted User</span>;
                  }
                  const name = [u.fname, u.lname].filter(Boolean).join(' ') || u.username;
                  const initials = `${u.fname?.[0] ?? ''}${u.lname?.[0] ?? ''}`.toUpperCase() || 'U';

                  return (
                    <div className="flex items-center gap-2">
                      <Avatar size={28} className="bg-gradient-to-tr from-blue-700 to-indigo-600 text-xs text-white">
                        {initials}
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-xs font-semibold text-slate-800">{name}</div>
                        <div className="flex items-center gap-1">
                          <Tag bordered={false} className="!m-0 !px-1.5 !text-[0.65rem] !leading-4 uppercase">
                            {u.role}
                          </Tag>
                          <span className="truncate text-[0.7rem] text-slate-400">@{u.username}</span>
                        </div>
                      </div>
                    </div>
                  );
                }}
              />

              <Column
                title="Action"
                dataIndex="action"
                key="action"
                width={140}
                render={(action: string) => renderActionBadge(action)}
              />

              <Column
                title="Description"
                dataIndex="description"
                key="description"
                render={(desc: string | null) => (
                  <div className="truncate text-xs text-slate-600">
                    {desc || <span className="text-slate-300 italic">&mdash;</span>}
                  </div>
                )}
              />

              <Column
                title=""
                key="action_btn"
                width={60}
                align="right"
                render={(_, row: ActivityLogItem) => (
                  <Button
                    type="text"
                    size="small"
                    icon={<Eye size={14} className="text-slate-400 hover:text-blue-600" />}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedLog(row);
                    }}
                  />
                )}
              />
            </Table>

            {/* Pagination */}
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs text-slate-500">
                {total === 0 ? 'No logs.' : `Showing ${(page - 1) * perPage + 1}–${Math.min(page * perPage, total)} of ${total.toLocaleString()} logs`}
              </div>
              <Pagination
                current={page}
                pageSize={perPage}
                total={total}
                size="small"
                showSizeChanger
                pageSizeOptions={[10, 15, 30, 50, 100]}
                onChange={(p, s) => {
                  setPage(p);
                  if (s) setPerPage(s);
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Details Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <Activity size={18} className="text-blue-600" />
            <span className="font-semibold text-slate-900">Activity Log #{selectedLog?.id}</span>
          </div>
        }
        open={!!selectedLog}
        onCancel={() => setSelectedLog(null)}
        footer={[
          <Button key="close" type="primary" onClick={() => setSelectedLog(null)}>
            Close
          </Button>,
        ]}
      >
        {selectedLog && (
          <div className="space-y-4 py-2 text-xs">
            <div className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3 border border-slate-100">
              <div>
                <span className="text-slate-400 uppercase font-semibold text-[0.65rem] tracking-wider block">Timestamp</span>
                <span className="font-medium text-slate-700 mt-0.5 block">
                  {dayjs(selectedLog.created_at).format('MMMM D, YYYY h:mm:ss A')}
                </span>
              </div>
              <div>
                <span className="text-slate-400 uppercase font-semibold text-[0.65rem] tracking-wider block">Action</span>
                <span className="mt-1 block">{renderActionBadge(selectedLog.action)}</span>
              </div>
            </div>

            <div>
              <span className="text-slate-400 uppercase font-semibold text-[0.65rem] tracking-wider block mb-1">Actor</span>
              {selectedLog.user ? (
                <div className="flex items-center gap-2 rounded-xl border border-slate-100 p-2.5">
                  <Avatar size={32} className="bg-blue-600 text-white text-xs">
                    {`${selectedLog.user.fname?.[0] ?? ''}${selectedLog.user.lname?.[0] ?? ''}`.toUpperCase()}
                  </Avatar>
                  <div>
                    <div className="font-semibold text-slate-800">
                      {[selectedLog.user.fname, selectedLog.user.lname].filter(Boolean).join(' ')}
                    </div>
                    <div className="text-[0.7rem] text-slate-400">
                      @{selectedLog.user.username} &bull; Role: {selectedLog.user.role}
                    </div>
                  </div>
                </div>
              ) : (
                <span className="text-slate-500 italic">System event</span>
              )}
            </div>

            <div>
              <span className="text-slate-400 uppercase font-semibold text-[0.65rem] tracking-wider block mb-1">Description</span>
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 font-mono text-slate-700 leading-relaxed whitespace-pre-wrap break-words">
                {selectedLog.description || 'No description provided.'}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

AdminActivityLogIndex.layout = (page: ReactElement<SharedData>) => (
  <AdminLayout user={page.props.auth.user}>{page}</AdminLayout>
);
