import React, { useEffect } from 'react'
import { Button, Input, Modal, Table } from 'antd';

import axios from 'axios';
import { ListPlus } from 'lucide-react';
import { Category } from '@/types/category';
import ModalSelectCategory from './modal-select-category';
import { Topic } from '@/types/topic';
type PageProps = {
  onSelectTopic: (record: Topic) => void
}
const ModalTopics = ( { onSelectTopic } : PageProps) => {
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [topics, setTopics] = React.useState<Topic[]>([]);
  const [search, setSearch] = React.useState<string>("");
  const [category, setCategory] = React.useState<Category>();

  const loadTopics = () => {
    // Load subject headings from the server or use static data
    // setSubjectHeadings(data);
    setLoading(true);
    axios.get(`/load-topics/${category ? category.id : 0}?search=${search}`).then(res => {
      setTopics(res.data);
      setLoading(false);
    }).catch(err => {
      setLoading(false);
      console.log(err);

    });
  }


  useEffect(() => {
    loadTopics();
  }, []);

  useEffect(() => {
    if(category) {
      loadTopics();
    }
  }, [category]);

  const handleCancel = () => {
    setIsModalOpen(false);
  }

  const handleSelectTopics = (record: Topic) => () => {
    // Handle the selection of a subject heading (e.g., add it to the article)
    //("Selected Subject Heading:", record);
    // You can also close the modal after selection if desired
    onSelectTopic(record);
    setIsModalOpen(false);
  }
  return (
    <div>

      <Button
        icon={<ListPlus  size={15}/>}
        type='primary'
        onClick={() => setIsModalOpen(true)}>
        Add Manually
      </Button>

      <Modal
        title="Browse Category"
        open={isModalOpen}
        footer={null}
        destroyOnHidden
        onCancel={handleCancel}>

          <div>
            {/* <SelectSubjects form={undefined} /> */}
            <ModalSelectCategory onSelectCategory={(record)=> {
              setCategory(record);

            }}/>
          </div>

        <div className='my-2'>
          <Input placeholder="Search Subject Headings"
            disabled={loading}
            onChange={ (e) => setSearch(e.target.value) }
            onKeyDown={(e) => {
              if(e.key === 'Enter') {
                loadTopics();
              }
            }} />
        </div>
        <Table
          loading={loading}
          dataSource={topics}
          rowKey={(record) => record.id}
          columns={[
            {
              title: 'ID',
              dataIndex: 'id',
              key: 'id'
            },
            {
              title: 'Topics',
              dataIndex: 'subject_heading',
              key: 'subject_heading'
            },
            {
              title: 'Actions',
              key: 'actions',
              render: (_, record) => (
                <Button type="link" onClick={handleSelectTopics(record)}>
                  Add
                </Button>
              )
            }
          ]}
        ></Table>

      </Modal>

    </div>
  )
}

export default ModalTopics

