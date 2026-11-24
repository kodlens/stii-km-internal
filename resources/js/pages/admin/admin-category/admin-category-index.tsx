import { Head } from '@inertiajs/react';
import { useQuery } from '@tanstack/react-query';
import { Button, Table, Pagination, Input, Space, Popconfirm, App } from 'antd';
import { FileAddOutlined } from '@ant-design/icons';
import Column from 'antd/es/table/Column';
import axios from 'axios';
import { ReactElement, ReactNode, useState } from 'react'
import { Edit2Icon, Search, Trash } from 'lucide-react';

import { User } from '@/types';

import AdminLayout from '@/layouts/admin-layout';
import { Category } from '@/types/category';
import { PaginateResponse } from '@/types/paginateResponse';
import { dateFormat } from '@/lib/utils';
import ModalCategoryAddEdit from './modal-category-add-edit';
import ActiveChip from '@/components/active-chip';

type PageProps = {
  title:string;
}

const AdminCategoryIndex = ( { title } : PageProps) => {
  const { notification } = App.useApp();
  const [perPage, setPerPage] = useState(10);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState({
    category: '',
  });
  const [category, setCategory] = useState<Category>();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data, isFetching, refetch } = useQuery({
    queryKey: ['categories', page, perPage],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: perPage.toString(),
        search: search.category,
        // from_date: search.date.format('YYYY-MM-DD'),
        // to_date: search.date.format('YYYY-MM-DD'),
      }).toString();

      const response = await axios.get<PaginateResponse<Category>>(`/admin/get-categories?${params}`);
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

      <div className="mx-2 md:mx-auto max-w-4xl">
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/60">
          <div className="flex flex-col gap-4 border-b border-slate-200/70 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Category</div>
              <div className="text-xl font-semibold text-slate-900">Category Management</div>
              <div className="text-sm text-slate-500">Manage your KM categories</div>
            </div>
            <Button
              icon={<FileAddOutlined />}
              type="primary"
              className="h-10 rounded-xl px-5"
              onClick={() => {
                setIsModalOpen(true);
                setCategory(undefined);
              }}
            >
              New Category
            </Button>
          </div>

          <div className='my-4 flex items-center gap-3 px-6'>
            <Input
              allowClear
              placeholder='Search categories by name...'
              value={search.category}
              onKeyDown={(e) => {
                if (e.key === 'Enter') refetch();
              }}
              onChange={(e) => setSearch({ ...search, category: e.target.value })}
            />

            <Button type='primary' icon={<Search size={15} />} onClick={() => refetch()}>
              Search
            </Button>
          </div>

          <div className="px-6 pb-6">
            <Table
              dataSource={data?.data ? data.data : []}
              loading={isFetching}
              rowKey={(row) => row.id}
              pagination={false}
              size="middle"
              locale={{ emptyText: 'No category records yet. Create your first record.' }}
            >
              <Column title="ID" dataIndex="id" key="id" width={70} />

              <Column
                title="Category"
                key="category"
                dataIndex="category"
                render={(cat: string) => (
                  <span className="font-semibold text-slate-800">{cat}</span>
                )}
              />

              <Column title="Slug" key="slug" dataIndex="slug" className="text-slate-400 font-mono text-xs" />

              <Column
                title="Materials"
                key="materials_count"
                render={(_, row: Category) => (
                  <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 ring-1 ring-blue-200">
                    {(row.material_categories_count ?? 0).toLocaleString()} {row.material_categories_count === 1 ? 'material' : 'materials'}
                  </span>
                )}
              />

              <Column
                title="Status"
                key="active"
                dataIndex="active"
                render={(active) => <ActiveChip status={active}/>}
              />

              <Column
                title="Created"
                key="created_at"
                dataIndex="created_at"
                render={(createdAt) => (<span className="text-xs text-slate-500">{dateFormat(createdAt)}</span>)}
              />

              <Column
                title="Action"
                key="action"
                align="right"
                render={(_, row: Category) => (
                  <Space size="small">
                    <Button
                      type='text'
                      icon={<Edit2Icon size={15} />}
                      onClick={() => {
                        setCategory(row);
                        setIsModalOpen(true);
                      }}
                    />
                    <Popconfirm
                      title="Delete Category"
                      description="Are you sure you want to delete this category?"
                      onConfirm={() => {
                        axios.delete(`/admin/categories/${row.id}`)
                          .then((res) => {
                            if (res.data?.success || res.data?.type === 'delete') {
                              notification.success({
                                message: 'Category Deleted',
                                description: 'The category has been deleted successfully.',
                              });
                            }
                            refetch();
                            setIsModalOpen(false);
                          })
                          .catch(() => {
                            notification.error({
                              message: 'Error',
                              description: 'There was an error deleting the category. It may have linked materials.',
                            });
                          });
                      }}
                      okText="Delete"
                      okType="danger"
                      cancelText="Cancel"
                    >
                      <Button type='text' danger icon={<Trash size={15} />} />
                    </Popconfirm>
                  </Space>
                )}
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

      <ModalCategoryAddEdit
        open={isModalOpen}
        data={category}
        onRefetch={() => refetch()}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  )
}

export default AdminCategoryIndex

AdminCategoryIndex.layout = (page: ReactNode) => (
  <AdminLayout
    user={(page as ReactElement<{ auth: { user: User } }>).props.auth.user}
  >
    {page}
  </AdminLayout>
)
