import { ReactElement, ReactNode } from 'react';
import { Head, Link } from '@inertiajs/react';
import {
  FileText,
  Sparkles,
  Clock,
  Layers,
  ArrowRight,
  Plus,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Cpu,
  UserCheck,
  TrendingUp,
} from 'lucide-react';
import { Card, Row, Col, Progress, Tag, Tooltip } from 'antd';

import AdminLayout from '@/layouts/admin-layout';
import { SharedData, User } from '@/types';

type DashboardStats = {
  published_count: number;
  drafts_count: number;
  submitted_count: number;
  total_materials: number;
  vectorized_count: number;
  total_chunks: number;
  categories_count: number;
  users_count: number;
  users_by_role: Record<string, number>;
};

type RecentMaterial = {
  id: number;
  title: string;
  status: string;
  is_publish: boolean;
  is_vectorized: boolean;
  is_categorized: boolean;
  is_summarized: boolean;
  publish_date: string | null;
  created_at: string;
  categories: string[];
};

type RecentActivity = {
  id: number;
  action: string;
  description: string;
  user_name: string;
  time_ago: string;
};

type AiConfig = {
  vector_collection: string;
  generative_model: string;
  embedding_model: string;
};

type PageProps = {
  auth: {
    user: User;
  };
  stats: DashboardStats;
  recent_materials: RecentMaterial[];
  recent_activities: RecentActivity[];
  ai_config: AiConfig;
};

export default function AdminDashboard({
  auth,
  stats,
  recent_materials = [],
  recent_activities = [],
  ai_config,
}: PageProps) {
  const user = auth?.user;
  const vectorPercent = stats.total_materials > 0
    ? Math.round((stats.vectorized_count / stats.total_materials) * 100)
    : 0;

  const publishedPercent = stats.total_materials > 0
    ? Math.round((stats.published_count / stats.total_materials) * 100)
    : 0;

  const getStatusTag = (status: string, isPublish: boolean) => {
    const s = (status || '').toLowerCase();
    if (s === 'publish' || s === 'published' || isPublish) {
      return <Tag color="success">Published</Tag>;
    }
    if (s === 'submit' || s === 'submitted') {
      return <Tag color="processing">Submitted</Tag>;
    }
    return <Tag color="default">Draft</Tag>;
  };

  const getActionBadgeColor = (action: string) => {
    switch (action?.toLowerCase()) {
      case 'publish':
        return 'green';
      case 'insert':
      case 'create':
        return 'blue';
      case 'update':
      case 'edit':
        return 'orange';
      case 'delete':
      case 'draft':
        return 'default';
      default:
        return 'geekblue';
    }
  };

  return (
    <>
      <Head title="Admin Dashboard - STII Knowledge Management" />

      <div className="space-y-6 p-4 sm:p-6 lg:p-8">
        {/* Top Header & Greeting Bar */}
        <div className="flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-[#1e3a8a]">
                <ShieldCheck size={13} />
                Administrator Console
              </span>
              <span className="text-xs text-slate-400">DOST-STII Repository</span>
            </div>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Welcome back, {user?.fname || 'Admin'}
            </h1>
            <p className="mt-1 text-xs text-slate-500 sm:text-sm">
              Overview of internal knowledge documents, vectorization pipeline, and recent content activity.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href={route('admin.materials.create')}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-[#0D4E86] px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-[#0A3F6D]"
            >
              <Plus size={15} />
              <span>New Material</span>
            </Link>

            <Link
              href="/"
              target="_blank"
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
            >
              <span>Public Portal</span>
              <ExternalLink size={13} />
            </Link>
          </div>
        </div>

        {/* 4 Stat KPI Cards */}
        <Row gutter={[16, 16]}>
          {/* Card 1: Published */}
          <Col xs={24} sm={12} lg={6}>
            <Card className="h-full border-slate-200/80 shadow-sm transition hover:shadow-md" bodyStyle={{ padding: '20px' }}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Published Materials</p>
                  <p className="mt-2 text-3xl font-extrabold text-slate-900">{stats.published_count}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                  <FileText size={24} />
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
                <span className="text-slate-500">{publishedPercent}% of total repository</span>
                <span className="font-semibold text-emerald-600">Active in Hub</span>
              </div>
            </Card>
          </Col>

          {/* Card 2: Drafts & Submitted */}
          <Col xs={24} sm={12} lg={6}>
            <Card className="h-full border-slate-200/80 shadow-sm transition hover:shadow-md" bodyStyle={{ padding: '20px' }}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Workflow</p>
                  <p className="mt-2 text-3xl font-extrabold text-amber-600">
                    {stats.drafts_count + stats.submitted_count}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                  <Clock size={24} />
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
                <span className="text-slate-500">{stats.drafts_count} Drafts</span>
                <span className="font-semibold text-blue-600">{stats.submitted_count} Awaiting Review</span>
              </div>
            </Card>
          </Col>

          {/* Card 3: AI Vectorized */}
          <Col xs={24} sm={12} lg={6}>
            <Card className="h-full border-slate-200/80 shadow-sm transition hover:shadow-md" bodyStyle={{ padding: '20px' }}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">AI Vectorized</p>
                  <p className="mt-2 text-3xl font-extrabold text-indigo-600">{stats.vectorized_count}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                  <Sparkles size={24} />
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
                <span className="text-slate-500">{stats.total_chunks} Chunks in Qdrant</span>
                <span className="font-semibold text-indigo-600">{vectorPercent}% Indexed</span>
              </div>
            </Card>
          </Col>

          {/* Card 4: Categories & Users */}
          <Col xs={24} sm={12} lg={6}>
            <Card className="h-full border-slate-200/80 shadow-sm transition hover:shadow-md" bodyStyle={{ padding: '20px' }}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Categories & Topics</p>
                  <p className="mt-2 text-3xl font-extrabold text-slate-900">{stats.categories_count}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
                  <Layers size={24} />
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
                <span className="text-slate-500">{stats.users_count} Team Accounts</span>
                <Link href={route('admin.categories.index')} className="font-semibold text-[#0D4E86] hover:underline">
                  Manage
                </Link>
              </div>
            </Card>
          </Col>
        </Row>

        {/* Main Section: Recent Materials + AI & System Status */}
        <Row gutter={[16, 16]}>
          {/* Left: Recent Materials Table */}
          <Col xs={24} lg={16}>
            <Card
              className="border-slate-200/80 shadow-sm"
              title={
                <div className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-2">
                    <FileText size={18} className="text-[#0D4E86]" />
                    <span className="font-bold text-slate-900">Recent Materials</span>
                  </div>
                  <Link
                    href={route('admin.materials.index')}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#0D4E86] hover:underline"
                  >
                    <span>View all materials</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>
              }
              bodyStyle={{ padding: '0px' }}
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-100 bg-slate-50 text-slate-500">
                    <tr>
                      <th className="px-5 py-3 font-semibold">Title & Categories</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 font-semibold">AI Vector</th>
                      <th className="px-4 py-3 font-semibold">Published Date</th>
                      <th className="px-4 py-3 text-right font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {recent_materials.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400">
                          No materials found.
                        </td>
                      </tr>
                    ) : (
                      recent_materials.map((m) => (
                        <tr key={m.id} className="transition hover:bg-slate-50/70">
                          <td className="max-w-[280px] px-5 py-3.5">
                            <p className="truncate font-semibold text-slate-900" title={m.title}>
                              {m.title}
                            </p>
                            <div className="mt-1 flex flex-wrap gap-1">
                              {m.categories.slice(0, 2).map((cat, idx) => (
                                <span
                                  key={idx}
                                  className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600"
                                >
                                  {cat}
                                </span>
                              ))}
                              {m.categories.length > 2 && (
                                <span className="text-[10px] text-slate-400">
                                  +{m.categories.length - 2} more
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="px-4 py-3.5 whitespace-nowrap">
                            {getStatusTag(m.status, m.is_publish)}
                          </td>

                          <td className="px-4 py-3.5 whitespace-nowrap">
                            {m.is_vectorized ? (
                              <Tooltip title="Indexed in Qdrant vector database">
                                <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
                                  <CheckCircle2 size={13} />
                                  Indexed
                                </span>
                              </Tooltip>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-slate-400">
                                ○ Pending
                              </span>
                            )}
                          </td>

                          <td className="px-4 py-3.5 whitespace-nowrap text-slate-500">
                            {m.publish_date || '—'}
                          </td>

                          <td className="px-4 py-3.5 text-right whitespace-nowrap">
                            <Link
                              href={route('admin.materials.edit', m.id)}
                              className="font-semibold text-[#0D4E86] hover:underline"
                            >
                              Edit
                            </Link>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </Col>

          {/* Right Column: AI Knowledge Health & Quick Shortcuts */}
          <Col xs={24} lg={8} className="space-y-4">
            {/* AI Vector Engine Health */}
            <Card
              className="border-slate-200/80 shadow-sm"
              title={
                <div className="flex items-center gap-2 py-1">
                  <Cpu size={18} className="text-indigo-600" />
                  <span className="font-bold text-slate-900">AI Knowledge Health</span>
                </div>
              }
              bodyStyle={{ padding: '18px' }}
            >
              <div className="space-y-4 text-xs">
                <div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="font-medium">Vector Indexing Coverage</span>
                    <span className="font-bold text-slate-900">{vectorPercent}%</span>
                  </div>
                  <Progress
                    percent={vectorPercent}
                    showInfo={false}
                    strokeColor="#4f46e5"
                    trailColor="#e0e7ff"
                    className="mt-1"
                  />
                  <p className="mt-1 text-[11px] text-slate-500">
                    {stats.vectorized_count} of {stats.total_materials} materials embedded into Qdrant
                  </p>
                </div>

                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Vector Collection:</span>
                    <span className="font-mono text-[11px] font-semibold text-slate-800">
                      {ai_config.vector_collection}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Embedding Model:</span>
                    <span className="font-mono text-[11px] font-semibold text-slate-800">
                      {ai_config.embedding_model}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Generative AI Engine:</span>
                    <span className="font-mono text-[11px] font-semibold text-indigo-700">
                      {ai_config.generative_model}
                    </span>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Team Distribution
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-1 text-xs text-blue-700">
                      <UserCheck size={12} />
                      {stats.users_by_role['admin'] ?? 0} Admins
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-1 text-xs text-amber-700">
                      <UserCheck size={12} />
                      {stats.users_by_role['encoder'] ?? 0} Encoders
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-xs text-emerald-700">
                      <UserCheck size={12} />
                      {stats.users_by_role['publisher'] ?? 0} Publishers
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Recent Activity Log Snippet */}
            <Card
              className="border-slate-200/80 shadow-sm"
              title={
                <div className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-2">
                    <TrendingUp size={17} className="text-slate-700" />
                    <span className="font-bold text-slate-900">Recent Activity</span>
                  </div>
                  <Link
                    href={route('admin.activity-logs.index')}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    View All
                  </Link>
                </div>
              }
              bodyStyle={{ padding: '16px' }}
            >
              <div className="space-y-3">
                {recent_activities.length === 0 ? (
                  <p className="py-4 text-center text-xs text-slate-400">No recent logs recorded.</p>
                ) : (
                  recent_activities.slice(0, 5).map((act) => (
                    <div key={act.id} className="flex items-start justify-between gap-2 text-xs">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <Tag color={getActionBadgeColor(act.action)} className="mr-0 text-[10px] uppercase font-bold">
                            {act.action}
                          </Tag>
                          <span className="font-semibold text-slate-900 truncate">{act.user_name}</span>
                        </div>
                        <p className="mt-0.5 text-[11px] text-slate-500 truncate">
                          {act.description || 'System operation executed.'}
                        </p>
                      </div>
                      <span className="text-[10px] text-slate-400 shrink-0">{act.time_ago}</span>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </Col>
        </Row>
      </div>
    </>
  );
}

AdminDashboard.layout = (page: ReactElement<SharedData>) => (
  <AdminLayout user={page.props.auth.user}>
    {page}
  </AdminLayout>
);
