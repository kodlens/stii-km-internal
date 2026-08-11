import { App, Button, Form, FormInstance, Input, Upload, UploadProps } from 'antd'
import { FileAddOutlined, InboxOutlined } from '@ant-design/icons'
import {  MaterialProps } from '@/types/material'
import axios from 'axios'
import AiClassifier from '@/components/ai-classifier'
import { lazy, useEffect } from 'react'
import { SendHorizontal } from 'lucide-react'
import { usePage } from '@inertiajs/react'
import Dragger from 'antd/es/upload/Dragger'
const Ckeditor = lazy(() => import('@/components/ckeditor'))

type SubmitAction = 'save' | 'draft' | 'submit' | 'publish';

type Pageprops = {
  material: MaterialProps;
  ckLicense: string;
  form: FormInstance;
  handleSubmit: (action: SubmitAction) => Promise<void>;
  errors: Record<string, unknown[]>;
  loading: boolean;
  role: string;
}

//extends material since additional fields are added

const CreateEditMaterial = ({
  material,
  ckLicense,
  form,
  errors,
  role,
  loading,
  handleSubmit
}
  : Pageprops) => {


  const { csrf_token }  = usePage().props;

  const { notification, message } = App.useApp();

  const uploadProps: UploadProps = {
    name: "docs",
    action: "/docs/temp-upload",
    headers: csrf_token ? { "X-CSRF-TOKEN": (csrf_token) as string } : undefined,
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

      if (material && material.id > 0) {
        //form.setFieldValue('docs', info.file.name)
      } else {
        if (info.file.status === "done") {
          notification.success({
            title: 'Success!',
            description: `${info.file.name} file uploaded successfully`
          });

          //set text to the editor
          if(info.file.response.success){
            form.setFieldValue('content', info.file.response.message);
          }

          form.setFieldValue("docs", info.file.response);
        } else if (info.file.status === "error") {
          notification.error({
            title: 'ERROR!',
            description: `${info.file.name} file upload failed. ${info.file.response.message}`
          });
        }
      }
    },

    onRemove(info) {

      //return;
      if (material && material.id > 0) {
        //remove image if mode is update (temp,uploadedfiles)
        axios
          .post(`/panel/image-remove/${material.id}/${info.name}`)
          .then((res) => {
            if (res.data.status === "temp_deleted") {
              message.success("File removed.");
            }
          });
      } else {
        //remove image in temp folder if mode is create
        axios
          .post("/docs/temp-remove/" + info.response.path)
          .then((res) => {
            if (res.data.status === "temp_deleted") {
              message.success("File removed.");
            }
          });
      }
    },
  };

  useEffect(() => {
    if (material && material.id > 0) {
      //set text to the editor
      setDataForUpdate();
    }
  }, [material])

  const setDataForUpdate = () => {

    form.setFieldsValue({
      title: material.title,
      content: material.content,
      categories: material.material_categories.map((category) => ({
        category_id: category.category_id,
        score: category.score,
        analysis: category.analysis,
        category: category.category.category
      })),
    })
  }



  return (
    <>

      <Form
        layout="vertical"
        form={form}
        autoComplete="off"
        initialValues={{
          title: null,
          content: null,
          content_text: true,
          upload: [],
          categories: [],
          submit_type: null
        }}
      >

        <Form.Item className='w-full'
          name="title"
          label="Title"
          validateStatus={errors.title ? "error" : ""}
          help={errors.title ? errors.title[0] as string : ""}>
          <Input placeholder="Title" />
        </Form.Item>

        <Form.Item
          name="upload"
          valuePropName="fileList"
          className="w-full mb-2"
          label="Upload PDF Document"
          getValueFromEvent={(e) => {
              // Normalize the value to fit what the Upload component expects
              if (Array.isArray(e)) {
                  return e;
              }
              return e?.fileList;
          }}
          validateStatus={errors.upload ? "error" : ""}
          help={errors.upload ? errors.upload[0] as string : ""}>

          {/* <Upload
            maxCount={1}
            accept=".pdf,application/pdf"
            // fileList={fileList}
            listType="text"
            {...uploadProps}
          >
            <Button icon={<UploadOutlined />}>
                Click to Upload
            </Button>
          </Upload> */}

          <Dragger {...uploadProps}
            maxCount={1}
            accept=".pdf,application/pdf">
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">Click or drag file to this area to upload</p>
            <p className="ant-upload-hint">
              Support for a single or bulk upload. Strictly prohibited from uploading company data or
              other banned files.
            </p>
          </Dragger>

        </Form.Item>

        <div className="min-h-[300px] ">
          <Form.Item
            label="PDF Content here"
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
          name="categories">
          <AiClassifier id={0} form={form} errors={errors} />
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

        { role === 'publisher' && (
            <div className='flex'>

              <div className="ml-auto flex gap-3">
                <Button
                  icon={<SendHorizontal size={15} />}
                  type="primary"
                  loading={loading}
                  className="h-10 rounded-xl px-5 bg-green-600! text-white
                    hover:bg-green-500!
                    active:bg-green-700!
                    focus:outline-none! focus:ring-3! focus:ring-green-500!
                    focus:ring-offset-1!"
                  onClick={() => handleSubmit('publish')}
                >
                  Save & Publish
                </Button>

                <Button
                  icon={<FileAddOutlined />}
                  type="primary"
                  loading={loading}
                  className="h-10 rounded-xl px-5"
                  onClick={() => handleSubmit('submit')}

                >
                  Save
                </Button>
              </div>

            </div>
          )}



          { role === 'encoder' && (
            <div className='flex'>

              <div className="ml-auto flex gap-3">
                <Button
                  icon={<SendHorizontal size={15} />}
                  type="primary"
                  loading={loading}
                  className="h-10 rounded-xl px-5 bg-green-600! text-white
                    hover:bg-green-500!
                    active:bg-green-700!
                    focus:outline-none! focus:ring-3! focus:ring-green-500!
                    focus:ring-offset-1!"
                  onClick={() => handleSubmit('submit')}
                >
                  Save & Submit
                </Button>

                <Button
                  icon={<FileAddOutlined />}
                  type="primary"
                  loading={loading}
                  className="h-10 rounded-xl px-5"
                  onClick={() => handleSubmit('draft')}

                >
                  Save as Draft
                </Button>
              </div>

            </div>
          )}

          { role === 'admin' && (
            <Button
              icon={<FileAddOutlined />}
              type="primary"
              loading={loading}
              className="h-10 rounded-xl px-5"
              onClick={() => handleSubmit('save')}

            >
              Save as Draft
            </Button>
          )}


      </Form>

    </>
  )
}

export default CreateEditMaterial
