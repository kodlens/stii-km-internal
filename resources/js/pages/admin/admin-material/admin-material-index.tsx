import { Head, router } from '@inertiajs/react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Button, Empty, Grid, Input, Pagination, Spin, Table, Tooltip } from 'antd';
import Column from 'antd/es/table/Column';
import axios, { isAxiosError } from 'axios';
import { ReactElement, useEffect, useMemo, useState } from 'react'
import { AlertCircle, FilterX, Plus, Search } from 'lucide-react';

import { SharedData } from '@/types';


import { PaginateResponse } from '@/types/paginateResponse';
import { dateFormat } from '@/lib/utils';
import { MaterialProps } from '@/types/material';
import StatusChip from '@/components/status-chip';
import MaterialDropdown from './partials/material-dropdown';
import AdminLayout from '@/layouts/admin-layout';

type PageProps = {
  title: string;
}

const MAX_VISIBLE_CATEGORIES = 2;

const STEPS = [
  { key: 'is_categorized', label: 'Categorized' },
  { key: 'is_summarized', label: 'Summarized' },
  { key: 'is_vectorized', label: 'Vectorized' },
] as const;

const isDone = (value: number | boolean | undefined | null) =>
  value === true || value === 1;

/**
 * Three dots instead of three chips: the dots read as a compact pipeline at a
 * glance, and the tooltip carries the actual wording on hover.
 */
const WorkflowDots = ({ row }: { row: MaterialProps }) => {
  const steps = STEPS.map((step) => ({
    ...step,
    done: isDone(row[step.key]),
  }));
  const completed = steps.filter((s) => s.done).length;

  return (
    <Tooltip
      title={
        <div className="flex flex-col gap-0.5">
          {steps.map((s) => (
            <span key={s.key}>
              {s.done ? '✓' : '○'} {s.label}
            </span>
          ))}
        </div>
      }
    >
      <div
        className="flex items-center gap-1.5"
        role="img"
        aria-label={`Workflow ${completed} of ${steps.length} complete`}
      >
        {steps.map((s) => (
          <span
            key={s.key}
            className={`h-1.5 w-1.5 rounded-full transition-colors ${
              s.done ? 'bg-emerald-500' : 'bg-slate-200'
            }`}
          />
        ))}
        <span className="ml-0.5 text-[0.7rem] tabular-nums text-slate-400">
          {completed}/{steps.length}
        </span>
      </div>
    </Tooltip>
  );
};

const MaterialCard = ({
  row,
  onEdit,
  refetch,
}: {
  row: MaterialProps;
  onEdit: () => void;
  refetch: () => void;
}) => {
  const categories = row.material_categories ?? [];
  const visible = categories.slice(0, MAX_VISIBLE_CATEGORIES);
  const hidden = categories.slice(MAX_VISIBLE_CATEGORIES);

  return (
    <div className="flex gap-3 border-b border-slate-100 px-4 py-4 last:border-b-0">
      <div className="min-w-0 flex-1">
        <button
          type="button"
          onClick={onEdit}
          className="block w-full truncate text-left text-sm font-semibold text-slate-800 hover:text-blue-700 hover:underline"
        >
          {row.title || 'Untitled material'}
        </button>

        <div className="mt-0.5 text-xs text-slate-400">ID #{row.id}</div>

        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <StatusChip status={row.status as never} />
          <WorkflowDots row={row} />
        </div>

        {categories.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {visible.map((cat) => (
              <span
                key={cat.id}
                className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-blue-200"
              >
                {cat.category.category}
              </span>
            ))}
            {hidden.length > 0 && (
              <Tooltip
                title={
                  <div className="flex flex-col gap-0.5">
                    {hidden.map((cat) => (
                      <span key={cat.id}>{cat.category.category}</span>
                    ))}
                  </div>
                }
              >
                <span className="inline-flex cursor-default items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
                  +{hidden.length}
                </span>
              </Tooltip>
            )}
          </div>
        )}

        <div className="mt-2 text-xs text-slate-400">
          {row.publish_date
            ? `Published ${dateFormat(row.publish_date as unknown as string)}`
            : 'Not published'}
        </div>
      </div>

      <div className="shrink-0 self-start">
        <MaterialDropdown refetch={refetch} row={row} />
      </div>
    </div>
  );
};

const AdminMaterialIndex = ({ title }: PageProps) => {
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;

  const [perPage, setPerPage] = useState(10);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  // Debounce the search term so we do not fire a request on every keystroke.
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data, isFetching, isError, error, refetch } = useQuery({
    queryKey: ['admin.materials', { page, perPage, search }],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        perpage: perPage.toString(),
        search,
      }).toString();

      const response = await axios.get<PaginateResponse<MaterialProps>>(`/admin/materials/data?${params}`);
      return response.data;
    },
    placeholderData: keepPreviousData,
  })

  // Any change to the result set must send the user back to the first page,
  // otherwise a narrow filter can land them on an empty page.
  useEffect(() => {
    setPage(1);
  }, [search, perPage]);

  const onPageChange = (nextPage: number, pageSize?: number) => {
    setPage(nextPage);
    if (pageSize) setPerPage(pageSize);
  };

  const rows = useMemo(() => data?.data ?? [], [data]);
  const total = data?.total ?? 0;
  const hasSearch = search !== '';

  const rangeStart = total === 0 ? 0 : (page - 1) * perPage + 1;
  const rangeEnd = total === 0 ? 0 : Math.min(page * perPage, total);

  const errorMessage = isAxiosError(error)
    ? (error.response?.data?.message ?? error.message)
    : 'Something went wrong while loading materials.';

  const paginationFooter = (
    <div
      className={`mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${
        isMobile ? 'px-4' : ''
      }`}
    >
      <div className="text-xs text-slate-500">
        {total === 0
          ? 'No materials to display.'
          : `Showing ${rangeStart.toLocaleString()}–${rangeEnd.toLocaleString()} of ${total.toLocaleString()} materials`}
      </div>
      <Pagination
        className="ml-auto"
        current={page}
        pageSize={perPage}
        onChange={onPageChange}
        total={total}
        size="small"
        showSizeChanger
        pageSizeOptions={[10, 20, 50]}
      />
    </div>
  );

  return (
    <>
      <Head title={title} />

      <div className="mx-2 md:mx-auto max-w-7xl">
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/60">
          <div className="flex flex-col gap-4 border-b border-slate-200/70 px-4 py-5 sm:flex-row sm:items-center sm:justify-between md:px-6">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Material</div>
              <div className="text-xl font-semibold text-slate-900">Material Management</div>
              <div className="text-sm text-slate-500">Manage your KM materials</div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {!isFetching && !isError && total > 0 && (
                <span className="text-sm text-slate-400">
                  {total.toLocaleString()} {total === 1 ? 'material' : 'materials'}
                </span>
              )}

              <Button icon={<Plus size={14}/>}
                type='primary'
                onClick={() => router.visit(route('admin.materials.create'))}>
                  New Material
              </Button>
            </div>
          </div>

          <div className='my-4 flex flex-col gap-3 px-4 sm:flex-row sm:items-center md:px-6'>
            <Input
              allowClear
              value={searchInput}
              placeholder='Search materials by title...'
              prefix={<Search size={15} className="text-slate-400" />}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  setSearch(searchInput.trim());
                }
              }}
              onChange={(e) => setSearchInput(e.target.value)}
            />

            {hasSearch && (
              <Button
                icon={<FilterX size={15} />}
                onClick={() => setSearchInput('')}>
                Clear
              </Button>
            )}
          </div>

          {isError ? (
            <div className="px-6 pb-6">
              <div className="flex flex-col items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 px-6 py-10 text-center">
                <AlertCircle size={28} className="text-rose-500" />
                <div>
                  <div className="font-semibold text-rose-800">Could not load materials</div>
                  <div className="text-sm text-rose-600">{errorMessage}</div>
                </div>
                <Button onClick={() => refetch()}>Try again</Button>
              </div>
            </div>
          ) : isMobile ? (
            <div className="pb-2">
              {isFetching && rows.length === 0 ? (
                <div className="flex justify-center py-16">
                  <Spin />
                </div>
              ) : rows.length === 0 ? (
                <div className="px-4 pb-4">
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={
                      hasSearch
                        ? `No materials match "${search}"`
                        : 'No materials yet. Create your first one to get started.'
                    }
                  >
                    {hasSearch ? (
                      <Button icon={<FilterX size={14} />} onClick={() => setSearchInput('')}>
                        Clear filters
                      </Button>
                    ) : (
                      <Button
                        type="primary"
                        icon={<Plus size={14} />}
                        onClick={() => router.visit(route('admin.materials.create'))}
                      >
                        New Material
                      </Button>
                    )}
                  </Empty>
                </div>
              ) : (
                rows.map((row) => (
                  <MaterialCard
                    key={row.id}
                    row={row}
                    refetch={refetch}
                    onEdit={() => router.visit(route('admin.materials.edit', row.id))}
                  />
                ))
              )}

              <div className="pb-4">{paginationFooter}</div>
            </div>
          ) : (
            <div className="px-6 pb-6">
              <Table
                dataSource={rows}
                loading={isFetching}
                rowKey={(row) => row.id}
                size="middle"
                pagination={false}
                tableLayout="fixed"
                rowClassName="transition-colors hover:bg-slate-50/80"
                locale={{
                  emptyText: hasSearch ? (
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description={
                        <span>
                          No materials match <span className="font-semibold text-slate-700">&ldquo;{search}&rdquo;</span>
                        </span>
                      }
                    >
                      <Button icon={<FilterX size={14} />} onClick={() => setSearchInput('')}>
                        Clear filters
                      </Button>
                    </Empty>
                  ) : (
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description="No materials yet. Create your first one to get started."
                    >
                      <Button
                        type="primary"
                        icon={<Plus size={14} />}
                        onClick={() => router.visit(route('admin.materials.create'))}
                      >
                        New Material
                      </Button>
                    </Empty>
                  ),
                }}
              >
                <Column
                  title="Title"
                  dataIndex="title"
                  key="title"
                  width="34%"
                  ellipsis
                  render={(title: string, row: MaterialProps) => (
                    <div className="flex min-w-0 flex-col gap-0.5 py-0.5">
                      <Tooltip title={title} placement="topLeft">
                        <button
                          type="button"
                          onClick={() => router.visit(route('admin.materials.edit', row.id))}
                          className="block w-full truncate text-left text-sm font-semibold text-slate-800 hover:text-blue-700 hover:underline"
                        >
                          {title || 'Untitled material'}
                        </button>
                      </Tooltip>
                      <span className="text-xs text-slate-400">ID #{row.id}</span>
                    </div>
                  )}
                />

                <Column
                  title="Categories"
                  key="categories"
                  dataIndex="material_categories"
                  width="19%"
                  render={(_, row: MaterialProps) => {
                    const categories = row.material_categories ?? [];
                    if (categories.length === 0) {
                      return <span className="text-sm text-slate-300">&mdash;</span>;
                    }
                    const visible = categories.slice(0, MAX_VISIBLE_CATEGORIES);
                    const hidden = categories.slice(MAX_VISIBLE_CATEGORIES);
                    return (
                      <div className="flex flex-wrap gap-1.5">
                        {visible.map((cat) => (
                          <span
                            key={cat.id}
                            className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 ring-1 ring-blue-200"
                          >
                            {cat.category.category}
                          </span>
                        ))}
                        {hidden.length > 0 && (
                          <Tooltip
                            title={
                              <div className="flex flex-col gap-0.5">
                                {hidden.map((cat) => (
                                  <span key={cat.id}>{cat.category.category}</span>
                                ))}
                              </div>
                            }
                          >
                            <span className="inline-flex cursor-default items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
                              +{hidden.length} more
                            </span>
                          </Tooltip>
                        )}
                      </div>
                    );
                  }}
                />

                <Column
                  title="Status"
                  key="status"
                  dataIndex="status"
                  width="12%"
                  render={(status: string) => <StatusChip status={status as never} />}
                />

                <Column
                  title="Workflow"
                  key="workflow"
                  width="13%"
                  render={(_, row: MaterialProps) => <WorkflowDots row={row} />}
                />

                <Column
                  title="Published"
                  key="publish_date"
                  dataIndex="publish_date"
                  width="13%"
                  render={(publishDate: MaterialProps['publish_date']) => (
                    publishDate ? (
                      <span className="whitespace-nowrap text-sm text-slate-600">
                        {dateFormat(publishDate as unknown as string)}
                      </span>
                    ) : (
                      <span className="text-sm text-slate-300">&mdash;</span>
                    )
                  )}
                />

                <Column
                  title={<span className="whitespace-nowrap">Action</span>}
                  key="action"
                  width="9%"
                  align="right"
                  render={(_, row: MaterialProps) => <MaterialDropdown refetch={refetch} row={row}/>}
                />
              </Table>

              {paginationFooter}
            </div>
          )}
        </div>
      </div>
    </>
  )
}



AdminMaterialIndex.layout = (page: ReactElement<SharedData>) => (
  <AdminLayout user={page.props.auth.user}>
    {page}
  </AdminLayout>
)

export default AdminMaterialIndex
