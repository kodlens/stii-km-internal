import { App, Button, Checkbox, Form, Input } from 'antd'
import { FileAddOutlined } from '@ant-design/icons'
import AuthenticatedLayout from '@/layouts/authenticated-layout'
import { ReactElement, ReactNode, useState } from 'react'
import { User } from '@/types'
import SelectCategory from '@/components/select-category'
import { Topic } from '@/types/topic'

type Pageprops = {
  id:number;
  data:Topic;
}


const AdminTopicAddEdit = ( {id, data }: Pageprops ) => {

  const [form] = Form.useForm();
  const [loading, setLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, unknown[]>>({});
  const { notification } = App.useApp();

  const submit = async(values:object) => {
    console.log(values);



  }

  return (
    <>
      <div className="mx-2 md:mx-auto max-w-2xl">
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/60">

          <div className="flex flex-col gap-4 border-b border-slate-200/70 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Topic</div>
              <div className="text-xl font-semibold text-slate-900">Topic Management</div>
              <div className="text-sm text-slate-500">Manage your KM topics</div>
            </div>
          </div>

          <div className='px-6 py-6'>
            <Form
              layout="vertical"
              form={form}
              autoComplete="off"
              initialValues={{
                category_id: null,
                topic: null,
                active: true,
              }}
              onFinish={submit}>

              <Form.Item
                name="category_id"
                label="Select Category"
                validateStatus={errors.category_id ? "error" : ""}
                help={errors.category_id ? errors.category_id[0] as string : ""}>
                <SelectCategory  />
              </Form.Item>


              <Form.Item className='w-full'
                name="topic"
                label="Topic"
                validateStatus={errors.topic ? "error" : ""}
                help={errors.topic ? errors.topic[0] as string : ""}>
                <Input placeholder="Topic" />
              </Form.Item>

              <Form.Item name="active" valuePropName="checked" className="w-full" label=""
                validateStatus={
                  errors.active ? "error" : ""
                }
                help={
                  errors.active
                    ? errors.active[0] as string
                    : ""
                }
              >
                <Checkbox>Active</Checkbox>
              </Form.Item>


              <Button
                icon={<FileAddOutlined />}
                type="primary"
                className="h-10 rounded-xl px-5"
                htmlType='submit'
              >
                Save
              </Button>

            </Form>

          </div>


        </div>

      </div>
    </>
  )
}

export default AdminTopicAddEdit

AdminTopicAddEdit.layout = (page: ReactNode) => (
  <AuthenticatedLayout
    user={(page as ReactElement<{ auth: { user: User } }>).props.auth.user}
  >
    {page}
  </AuthenticatedLayout>
)

