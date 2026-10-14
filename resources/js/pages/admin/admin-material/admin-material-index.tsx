import { Head, Link } from '@inertiajs/react';
import { useQuery } from '@tanstack/react-query';
import { Button, Table, Pagination, Input } from 'antd';
import { FileAddOutlined } from '@ant-design/icons';
import Column from 'antd/es/table/Column';
import axios from 'axios';
import { ReactElement, ReactNode, useState } from 'react'
import { Search } from 'lucide-react';

import { User } from '@/types';

import AuthenticatedLayout from '@/layouts/authenticated-layout';
import { PaginateResponse } from '@/types/paginateResponse';
import { dateFormat } from '@/lib/utils';
import { Material } from '@/types/material';
import StatusChip from '@/components/status-chip';
import MaterialDropdown from './partials/material-dropdown';

type PageProps = {
  title:string;
}

type MaterialCategory = {
  id: number;
  category: {
    id: number;
    category: string;
  };
};

const AdminMaterialIndex = ( { title } : PageProps) => {

  const [perPage, setPerPage] = useState(10);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState({
    search: '',
  });

  const { data, isFetching, refetch } = useQuery({
    queryKey: ['categories', page, perPage],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        perpage: perPage.toString(),
        search: search.search,
        // from_date: search.date.format('YYYY-MM-DD'),
        // to_date: search.date.format('YYYY-MM-DD'),
      }).toString();

      const response = await axios.get<PaginateResponse<Material>>(`/admin/get-materials?${params}`);
      return response.data;
    },
  })

  const onPageChange = (nextPage: number, pageSize?: number) => {
    setPage(nextPage);
    if (pageSize) setPerPage(pageSize);
  };


  return (
    <>
      <Head title={title}></Head>

      <div className="mx-2 md:mx-auto max-w-7xl">
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/60">
          <div className="flex flex-col gap-4 border-b border-slate-200/70 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Material</div>
              <div className="text-xl font-semibold text-slate-900">Material Management</div>
              <div className="text-sm text-slate-500">Manage your KM materials</div>
            </div>
            <Link
              type="primary"
              className="bg-blue-500 h-10 rounded-xl px-5"
              href={'/admin/materials/create'}            >
              Add Material
            </Link>
          </div>

          <div className='my-4 flex items-center gap-3 px-6'>
            <Input
              placeholder='Search Materials...'
              value={search.search}
              onKeyDown={(e) => {
                if (e.key === 'Enter') refetch();
              }}
              onChange={(e) => setSearch({ ...search, search: e.target.value })}
            />

            <Button type='primary' icon={<Search size={15} />} onClick={() => refetch()}>
              Search
            </Button>
          </div>

          {/* <div className="px-6 pb-2">
            <div className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-rose-700">Total Daily Expenses</span>
              <span className="text-base font-bold text-rose-800">
              </span>
            </div>
          </div> */}

          <div className="px-6 pb-6">
            <Table
              dataSource={data?.data ? data.data : []}
              loading={isFetching}
              rowKey={(row) => row.id}
              pagination={false}
              size="middle"
              locale={{ emptyText: 'No category records yet. Create your first record.' }}
            >
              <Column title="Id" dataIndex="id" key="id" />
              <Column title="Title" dataIndex="title" key="title" />

              <Column title="Categories" key="categories" dataIndex="material_categories" render={(_, row) => (
                <>
                  { row.material_categories.map((cat: MaterialCategory) =>
                      <div className="my-1 inline-block px-2 py-1 rounded-2xl bg-blue-100 mx-2 text-sm" key={cat.id}>
                        { cat.category.category }
                      </div>
                    )
                  }
                </>
              )} />

              <Column
                className=''
                title="Status"
                key="status"
                dataIndex="status"
                render={(status) => <StatusChip status={status} />}
              />

              <Column
                className=''
                title="Created"
                key="created_at"
                dataIndex="created_at"
                render={(createdAt) => (<>{dateFormat(createdAt)}</>)}
              />

              <Column
                title="Action"
                key="action"
                render={(_, row: Material) => <MaterialDropdown refetch={refetch} row={row}/>}
              />
            </Table>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs text-slate-500">
                Showing page {page} with {perPage} rows per page.
              </div>
              <Pagination
                className="ml-auto"
                current={page}
                pageSize={perPage}
                onChange={onPageChange}
                defaultCurrent={1}
                total={data?.total}
                showSizeChanger
                pageSizeOptions={[10, 20, 50]}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default AdminMaterialIndex

AdminMaterialIndex.layout = (page: ReactNode) => (
  <AuthenticatedLayout
    user={(page as ReactElement<{ auth: { user: User } }>).props.auth.user}
  >
    {page}
  </AuthenticatedLayout>
)


