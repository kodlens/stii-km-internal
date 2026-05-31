import { Head } from '@inertiajs/react';
import { useQuery } from '@tanstack/react-query';
import { Button, Table, Pagination, Input, Space, Popconfirm, App } from 'antd';
import Column from 'antd/es/table/Column';
import axios from 'axios';
import { ReactElement, ReactNode, useState } from 'react'
import { Edit2Icon, Search, Trash } from 'lucide-react';

import { User } from '@/types';

import AuthenticatedLayout from '@/layouts/authenticated-layout';
import { Category } from '@/types/category';
import { PaginateResponse } from '@/types/paginateResponse';
import { dateFormat } from '@/lib/utils';
// import ActiveChip from '@/components/active-chip';

type PageProps = {
  title:string;
}

const EncoderAllMaterialsIndex = ( { title } : PageProps) => {
  const { notification } = App.useApp();
  const [perPage, setPerPage] = useState(10);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState({
    topic: '',
  });

  const { data, isFetching, refetch } = useQuery({
    queryKey: ['categories', page, perPage],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: perPage.toString(),
        search: search.topic,
        // from_date: search.date.format('YYYY-MM-DD'),
        // to_date: search.date.format('YYYY-MM-DD'),
      }).toString();

      const response = await axios.get<PaginateResponse<Category>>(`/encoder/materials/get-all-materials?${params}`);
      return response.data;
    },
  })

  const onPageChange = (nextPage: number, pageSize?: number) => {
    setPage(nextPage);
    if (pageSize) setPerPage(pageSize);
  };

  const handleEdit = (record: Category) => {
    console.log(record);
  }

  return (
    <>
      <Head title={title}></Head>

      <div className="mx-2 md:mx-auto max-w-4xl">
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/60">
          <div className="flex flex-col gap-4 border-b border-slate-200/70 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Topic</div>
              <div className="text-xl font-semibold text-slate-900">All Materials</div>
              <div className="text-sm text-slate-500">Manage your KM topics</div>
            </div>

            {/* <Button
              icon={<FileAddOutlined />}
              type="primary"
              className="h-10 rounded-xl px-5"
              onClick={() => {
                router.visit('/encoder/create')
              }}
            >
              New Topic
            </Button> */}
          </div>


          <div className='my-4 flex items-center gap-3 px-6'>
            <Input
              placeholder='Search ...'
              value={search.topic}
              onKeyDown={(e) => {
                if (e.key === 'Enter') refetch();
              }}
              onChange={(e) => setSearch({ ...search, topic: e.target.value })}
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

              <Column title="Title" key="title" dataIndex="title" />
              {/* <Column title="Slug" key="slug" dataIndex="slug" /> */}
              {/* <Column title="Category" key="category" dataIndex={['category', 'category']} /> */}

              <Column
                title="Content"
                key="content_text"
                dataIndex="content_text"
                render={(content_text) => (<>
                  {content_text?.length > 100 ? content_text.slice(0, 100) + '...' : content_text}
                </>)}
              />

              <Column
                title="Created"
                key="created_at"
                dataIndex="created_at"
                render={(createdAt) => (<>{dateFormat(createdAt)}</>)}
              />

              {/* <Column
                title="Status"
                key="active"
                dataIndex="active"
                render={(active) => <ActiveChip status={active}/>}
              /> */}

              <Column
                title="Action"
                key="action"
                render={(_, row: Category) => (
                  <Space size="small">
                    <Button
                      type='text'
                      icon={<Edit2Icon size={15} />}
                      onClick={() => handleEdit(row)}
                    />
                    <Popconfirm
                      title="Delete Category"
                      description="Are you sure you want to delete this category record?"
                      onConfirm={() => {
                        axios.delete(`/admin/topics/${row.id}`)
                          .then((res) => {
                            if (res.data.status === 'deleted') {
                              notification.success({
                                message: 'Daily Expense Deleted',
                                description: 'The daily expense record has been deleted successfully.',
                              });
                            }
                            refetch();
                            //setIsModalOpen(false);
                          })
                          .catch(() => {
                            notification.error({
                              message: 'Error',
                              description: 'There was an error deleting the category.',
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


    </>
  )
}

export default EncoderAllMaterialsIndex

EncoderAllMaterialsIndex.layout = (page: ReactNode) => (
  <AuthenticatedLayout
    user={(page as ReactElement<{ auth: { user: User } }>).props.auth.user}
  >
    {page}
  </AuthenticatedLayout>
)
