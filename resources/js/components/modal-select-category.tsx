import { Category } from "@/types/category";
import { PaginateResponse } from "@/types/paginateResponse";
import { Button, Modal, Table } from "antd";
import axios from "axios";
import { MousePointer2 } from "lucide-react";
import { useEffect, useState } from "react";
type PageProps = {
  onSelectCategory: (record: CategoryResult) => void
}

type CategoryResult = {
  category_id: number,
  category: string,
  score: number,
  analysis: string
}

const ModalSelectCategory = ( { onSelectCategory } : PageProps) => {

  const [data, setData] = useState<PaginateResponse<Category>>();
  const [loading, setLoading] = useState<boolean>(false);
  const [open, setOpen] = useState<boolean>(false);


  const loadData = async () => {
    // Load subject headings from the server or use static data
    // setSubjectHeadings(data);
    setLoading(true);
    axios.get(`/load-categories-with-paginate`).then(res => {
      setData(res.data);
      setLoading(false);
    }).catch(err => {
      setLoading(false);
      console.log(err);
    });
  }

  useEffect(() => {
    loadData();
  }, [open]);

  const handleOk = () => {
    setOpen(false);
  };

  const handleCancel = () => {
    setOpen(false);
  };

  return (
    <>
      <Button onClick={() => {
        setOpen(true);
      }}>
        Open Categories
      </Button>

      <Modal
        title="Sample Modal"
        open={open}
        onOk={handleOk}
        onCancel={handleCancel}
        okButtonProps={{ style: { display: 'none' } }}
        okText="Save"
        cancelText="Close"
      >
        <Table
          rowKey="id"
          dataSource={Array.isArray(data?.data) ? data.data : []}
          pagination={false}
          size="small"
          columns={[
            {
              title: "Id",
              dataIndex: "id",
              key: "id",
              width: 120,
            },
            {
              title: "Cattegory",
              dataIndex: "category",
              key: "category",
              width: 200,
            },
            {
              title: "Action",
              key: "action",
              align: "center",
              width: 150,
              render: (_, record) => (
                <>
                  <Button
                    type="primary"
                    icon={<MousePointer2 size={15} />}
                    loading={loading}
                    onClick={() => {
                      onSelectCategory({
                        category_id: record.id,
                        category: record.category,
                        score: 0,
                        analysis: "Manually added."
                      });
                    }}
                  >

                  </Button>
                </>
              ),
            },
          ]}
        />
      </Modal>

    </>
  )
}

export default ModalSelectCategory
