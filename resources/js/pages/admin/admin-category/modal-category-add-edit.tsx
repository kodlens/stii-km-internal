import { Button, Input, App, Form, Modal, Checkbox } from 'antd'
import { useEffect, useState } from 'react';
import axios from 'axios';

import { CloseOutlined } from '@ant-design/icons';
import { Save } from 'lucide-react';

import { Category } from '@/types/category';

type Props = {

  open: boolean;
  onRefetch: () => void;
  onClose: () => void;
  data?: Category
}

const ModalCategoryAddEdit = ({ open, onRefetch, onClose, data }: Props) => {
  const { notification } = App.useApp();
  const [form] = Form.useForm();
  const [errors, setErrors] = useState<Record<string, unknown[]>>({});

  useEffect(() => {
    setErrors({});
    form.resetFields();

    if (data && data.id > 0) {
      form.setFieldsValue({
        category: data.category || null,
        active: data.active ? 1 : 0,
      });
    }
  }, [open, data, form]);

  const handleSubmit = (values: object) => {
    if (data && data.id > 0) {
      axios.put(`/admin/categories/${data.id}`, values)
        .then((res) => {
          if (res.data.succes) {
            notification.success({
              placement: 'topRight',
              title: 'Category Updated',
              description: 'The category has been updated successfully.',
            });
            onRefetch();
            form.resetFields();
            onClose();
          }
        })
        .catch((error) => {
          setErrors(error.response?.data?.errors ?? {});
          if (error.response?.status === 500) {
            notification.error({
              placement: 'topRight',
              title: 'Error',
              description: 'There was an error updating the category.',
            });
          }
        });
      return;
    }

    axios.post(`/admin/categories`, values)
      .then((res) => {
        if (res.data.success) {
          notification.success({
            placement: 'topRight',
            title: 'Category Created',
            description: 'The category has been created successfully.',
          });
          onRefetch();
          form.resetFields();
          onClose();
        }
      })
      .catch((error) => {
        setErrors(error.response?.data?.errors ?? {});
        if (error.response?.status === 500) {
          notification.error({
            placement: 'topRight',
            title: 'Error',
            description: 'There was an error creating the category.',
          });
        }
      });
  };

  const handleCancel = () => {
    form.resetFields();
    setErrors({});
    onClose();
  };

  return (
    <Modal
      open={open}
      onCancel={handleCancel}
      footer={null}
      destroyOnHidden
      forceRender
      centered
      title={null}
    >
      <div className='pt-2'>
        <div className="text-lg font-semibold text-slate-900">
          {data?.id ? 'Update Category' : 'Create Category'}
        </div>
        <div className="mb-4 text-sm text-slate-500">Fill in the details for this category record.</div>

        <Form
          layout="vertical"
          className='my-4'
          form={form}
          initialValues={{
            category: null,
            active: null,
          }}
          onFinish={handleSubmit}
        >

          <Form.Item
            label="Category"
            name="category"
            validateStatus={errors.category ? 'error' : ''}
            help={errors.category ? errors.category[0] as string : ''}
          >
            <Input placeholder="Category" />
          </Form.Item>


          <Form.Item
            name="active"
            valuePropName="checked"
          >
            <Checkbox>Active</Checkbox>
          </Form.Item>

          <div className="mt-4 flex justify-end gap-2">
            <Button className='rounded-xl' icon={<CloseOutlined size={15} />} danger onClick={handleCancel}>
              Cancel
            </Button>
            <Button className='rounded-xl' type='primary' icon={<Save size={15} />} htmlType="submit">
              SAVE
            </Button>
          </div>
        </Form>
      </div>
    </Modal>
  )
}

export default ModalCategoryAddEdit
