import { App, Button, Checkbox, Form, Input, Upload, UploadProps } from 'antd'
import { FileAddOutlined, UploadOutlined } from '@ant-design/icons'
import AuthenticatedLayout from '@/layouts/authenticated-layout'
import { ReactElement, ReactNode, useState } from 'react'
import { User } from '@/types'
import { Material } from '@/types/material'
import Ckeditor from '@/components/ckeditor'
import axios from 'axios'

type Pageprops = {
  id: number;
  material: Material;
  ckLicense: string;
}


const EncoderNewMaterial = ({ id, material, ckLicense }: Pageprops) => {

  const [form] = Form.useForm();
  const [loading, setLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, unknown[]>>({});
  const { notification, message } = App.useApp();
  const csrfToken =
    document.querySelector('meta[name="csrf-token"]')?.getAttribute("content") ?? "";


  const uploadProps: UploadProps = {
    name: "docs",
    action: "/docs/temp-upload",
    headers: csrfToken ? { "X-CSRF-TOKEN": csrfToken } : undefined,
    beforeUpload: (file) => {
      const isPDF = file.type === "application/pdf";

      if (!isPDF) {
        notification.error({
          description: `${file.name} is not a PDF file`
        });
      }
      return isPDF || Upload.LIST_IGNORE;
    },

    onChange(info) {
      if (id > 0) {
        //console.log(info);
        //form.setFieldValue('featured_image', info.file.name)
      } else {
        if (info.file.status === "done") {
          notification.success({
            description: `${info.file.name} file uploaded successfully`
          });
          form.setFieldValue("featured_image", info.file.response);
        } else if (info.file.status === "error") {
          notification.error({
            description: `${info.file.name} file upload failed.`
          });
        }
      }
    },
    onRemove(info) {
      if (id > 0) {
        //remove image if mode is update (temp,uploadedfiles)
        axios
          .post(`/panel/image-remove/${id}/${info.name}`)
          .then((res) => {
            if (res.data.status === "temp_deleted") {
              message.success("File removed.");
            }
          });
      } else {
        //remove image in temp folder if mode is create
        axios
          .post("/panel/temp-remove/" + info.response)
          .then((res) => {
            if (res.data.status === "temp_deleted") {
              message.success("File removed.");
            }
          });
      }
    },
  };


  const submit = async (values: object) => {
    console.log(values);

  }

  return (
    <>
      <div className="mx-2 md:mx-auto max-w-6xl">
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/60">

          <div className="flex flex-col gap-4 border-b border-slate-200/70 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">MATERIALS</div>
              <div className="text-xl font-semibold text-slate-900">Add/Update Material</div>
              <div className="text-sm text-slate-500">Manage your KM maerials</div>
            </div>
          </div>

          <div className='px-6 py-6'>
            <Form
              layout="vertical"
              form={form}
              autoComplete="off"
              initialValues={{
                title: null,
                content: null,
                content_text: true,
                upload: [],
              }}
              onFinish={submit}>

              <Form.Item className='w-full'
                name="title"
                label="Title"
                validateStatus={errors.title ? "error" : ""}
                help={errors.title ? errors.title[0] as string : ""}>
                <Input placeholder="Title" />
              </Form.Item>


              <div className="min-h-[300px] ">
                <Form.Item
                  label="Write your content here"
                  name="content"
                  className="!max-w-none"
                  validateStatus={
                    errors.content ? "error" : ""
                  }
                  help={
                    errors.content
                      ? errors.content[0] as string
                      : ""
                  }
                >
                  <Ckeditor material={material || undefined}
                    form={form}
                    ckLicense={ckLicense} />
                </Form.Item>
              </div>


              <Form.Item
                name="upload"
                valuePropName="fileList"
                className="w-full"
                label="Upload PDF Document"
                getValueFromEvent={(e) => {
                    // Normalize the value to fit what the Upload component expects
                    if (Array.isArray(e)) {
                        return e;
                    }
                    return e?.fileList;
                }}
                validateStatus={errors.upload ? "error" : ""}
                help={errors.upload ? errors.upload[0] as string : ""}
            >
                <Upload
                    maxCount={1}
                    accept=".pdf,application/pdf"
                    // fileList={fileList}
                    listType="text"
                    {...uploadProps}
                >
                    <Button icon={<UploadOutlined />}>
                        Click to Upload
                    </Button>
                </Upload>
            </Form.Item>



              {/* <Form.Item name="active" valuePropName="checked" className="w-full" label=""
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
              </Form.Item> */}


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

export default EncoderNewMaterial

EncoderNewMaterial.layout = (page: ReactNode) => (
  <AuthenticatedLayout
    user={(page as ReactElement<{ auth: { user: User } }>).props.auth.user}
  >
    {page}
  </AuthenticatedLayout>
)
