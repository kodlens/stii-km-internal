import { useEffect, useState } from 'react';
import { Button, Empty, Input, Modal, Table } from 'antd';
import axios from 'axios';
import { FolderPlus, Plus, Search } from 'lucide-react';
import { Category } from '@/types/category';
import { PaginateResponse } from '@/types/paginateResponse';

type CategoryResult = {
  category_id: number;
  category: string;
  score: number;
  analysis: string;
};

type PageProps = {
  onSelectCategory: (record: CategoryResult) => void;
  triggerButton?: React.ReactNode;
};

export default function ModalSelectCategory({ onSelectCategory, triggerButton }: PageProps) {
  const [data, setData] = useState<PaginateResponse<Category>>();
  const [loading, setLoading] = useState<boolean>(false);
  const [open, setOpen] = useState<boolean>(false);
  const [search, setSearch] = useState<string>('');
  const [page, setPage] = useState<number>(1);

  const loadData = async (searchTerm = search, pageNum = page) => {
    setLoading(true);
    try {
      const res = await axios.get<PaginateResponse<Category>>('/load-categories-with-paginate', {
        params: {
          search: searchTerm,
          page: pageNum,
          perpage: 10,
        },
      });
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadData(search, page);
    }
  }, [open, page]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
    loadData(value, 1);
  };

  return (
    <>
      {triggerButton ? (
        <span onClick={() => setOpen(true)}>{triggerButton}</span>
      ) : (
        <Button
          icon={<Plus size={14} />}
          onClick={() => setOpen(true)}
          className="border-slate-300 text-slate-700 hover:border-blue-500 hover:text-blue-600 text-xs font-medium"
        >
          Add Category
        </Button>
      )}

      <Modal
        title={
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-blue-50 p-1.5 text-blue-700">
              <FolderPlus size={18} />
            </div>
            <div>
              <span className="font-bold text-slate-900 block text-base leading-tight">Select Category</span>
              <span className="text-xs text-slate-400 font-normal">
                Choose a knowledge management category for this document
              </span>
            </div>
          </div>
        }
        open={open}
        onCancel={() => setOpen(false)}
        footer={[
          <Button key="close" onClick={() => setOpen(false)}>
            Close
          </Button>,
        ]}
        width={600}
      >
        <div className="py-2 space-y-3">
          <Input
            allowClear
            placeholder="Search categories by name..."
            prefix={<Search size={15} className="text-slate-400" />}
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
          />

          <Table
            rowKey="id"
            dataSource={Array.isArray(data?.data) ? data.data : []}
            pagination={{
              current: page,
              pageSize: 10,
              total: data?.total ?? 0,
              size: 'small',
              onChange: (p) => setPage(p),
              showSizeChanger: false,
            }}
            loading={loading}
            size="small"
            locale={{
              emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No categories match your search." />,
            }}
            columns={[
              {
                title: 'Category',
                dataIndex: 'category',
                key: 'category',
                render: (cat: string, record: Category) => (
                  <div className="py-0.5">
                    <span className="font-semibold text-slate-800 text-xs block">{cat}</span>
                    <span className="text-[11px] text-slate-400 font-mono">/{record.slug}</span>
                  </div>
                ),
              },
              {
                title: 'Action',
                key: 'action',
                align: 'right',
                width: 100,
                render: (_, record: Category) => (
                  <Button
                    type="primary"
                    size="small"
                    icon={<Plus size={13} />}
                    onClick={() => {
                      onSelectCategory({
                        category_id: record.id,
                        category: record.category,
                        score: 0,
                        analysis: 'Manually added.',
                      });
                    }}
                    className="text-xs"
                  >
                    Select
                  </Button>
                ),
              },
            ]}
          />
        </div>
      </Modal>
    </>
  );
}
