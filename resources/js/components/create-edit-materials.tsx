import { lazy, useEffect, useRef, type Dispatch, type SetStateAction } from 'react';
import { usePage } from '@inertiajs/react';
import { App, Button, DatePicker, Form, FormInstance, Input, Upload, UploadProps } from 'antd';
import Dragger from 'antd/es/upload/Dragger';
import axios, { isAxiosError } from 'axios';
import dayjs from 'dayjs';
import {
  Calendar,
  FileCheck,
  FileText,
  FileUp,
  SendHorizontal,
  Sparkles,
  UploadCloud,
} from 'lucide-react';

import AiClassifier from '@/components/ai-classifier';
import { MaterialProps } from '@/types/material';

const Ckeditor = lazy(() => import('@/components/ckeditor'));

type SubmitAction = 'save' | 'draft' | 'submit' | 'publish';

type PageProps = {
  material: MaterialProps | null;
  ckLicense: string;
  form: FormInstance;
  handleSubmit: (action: SubmitAction) => Promise<void>;
  errors: Record<string, unknown[]>;
  setErrors: Dispatch<SetStateAction<Record<string, unknown[]>>>;
  loading: boolean;
  role: string;
};

export default function CreateEditMaterial({
  material,
  ckLicense,
  form,
  errors,
  setErrors,
  role,
  loading,
  handleSubmit,
}: PageProps) {
  const { csrf_token } = usePage().props;
  const { notification, message } = App.useApp();
  const titleCheckVersion = useRef(0);

  const clearTitleError = () => {
    titleCheckVersion.current += 1;
    setErrors((prev) => {
      const next = { ...prev };
      delete next.title;
      return next;
    });
  };

  const uploadProps: UploadProps = {
    name: 'docs',
    action: '/docs/temp-upload',
    headers: csrf_token ? { 'X-CSRF-TOKEN': csrf_token as string } : undefined,
    beforeUpload: (file) => {
      const isPDF = file.type === 'application/pdf';
      if (!isPDF) {
        notification.error({
          message: 'Invalid File',
          description: `${file.name} is not a PDF file. Please select a PDF document.`,
        });
      }
      return isPDF || Upload.LIST_IGNORE;
    },

    onChange(info) {
      if (info.file.status === 'done') {
        notification.success({
          message: 'PDF Uploaded',
          description: `${info.file.name} uploaded successfully. Text has been extracted into the editor below.`,
        });

        // Auto-populate editor with extracted text if available
        if (info.file.response?.success && info.file.response?.message) {
          form.setFieldValue('content', info.file.response.message);
        }

        form.setFieldValue('docs', info.file.response);
      } else if (info.file.status === 'error') {
        notification.error({
          message: 'Upload Failed',
          description: `${info.file.name} upload failed: ${info.file.response?.message || 'Server error'}`,
        });
      }
    },

    onRemove(info) {
      if (material && material.id > 0) {
        axios.post(`/panel/image-remove/${material.id}/${info.name}`).then((res) => {
          if (res.data.status === 'temp_deleted') {
            message.success('File removed.');
          }
        });
      } else if (info.response?.path) {
        axios.post('/docs/temp-remove/' + info.response.path).then((res) => {
          if (res.data.status === 'temp_deleted') {
            message.success('File removed.');
          }
        });
      }
    },
  };

  useEffect(() => {
    if (material && material.id > 0) {
      form.setFieldsValue({
        title: material.title,
        content: material.content,
        publish_date: material.publish_date ? dayjs(material.publish_date) : null,
        categories: (material.material_categories || []).map((category) => ({
          category_id: category.category_id,
          score: category.score,
          analysis: category.analysis,
          category: category.category?.category || `Category #${category.category_id}`,
        })),
      });
    } else {
      form.resetFields();
    }
  }, [material, form]);

  const handleCheckTitle = () => {
    if (role !== 'encoder') return;

    const title = form.getFieldValue('title');
    const id = material?.id ?? 0;
    const version = ++titleCheckVersion.current;
    const isCurrent = () => version === titleCheckVersion.current && form.getFieldValue('title') === title;

    if (!title?.trim()) return;

    axios
      .get<{ exists: boolean }>(`/${role}/materials/${id}/check-title`, {
        params: { title },
      })
      .then((res) => {
        if (!isCurrent()) return;

        setErrors((prev) => {
          const next = { ...prev };
          if (res.data.exists) {
            next.title = ['This title already exists. Please choose a distinct title.'];
          } else {
            delete next.title;
          }
          return next;
        });
      })
      .catch((error) => {
        if (!isCurrent()) return;

        if (isAxiosError(error) && error.response?.status === 422 && error.response.data.errors?.title) {
          setErrors((prev) => ({ ...prev, title: error.response!.data.errors.title }));
          return;
        }

        notification.error({
          message: 'Title Check Failed',
          description: 'Unable to check title availability.',
        });
      });
  };

  return (
    <Form
      layout="vertical"
      form={form}
      autoComplete="off"
      initialValues={{
        title: null,
        content: null,
        publish_date: null,
        upload: [],
        categories: [],
      }}
      className="space-y-5"
    >
      {/* 1. Upper / First Section: Document Overview Card */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
              <FileText size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Document Information</h2>
              <p className="text-xs text-slate-400">
                Primary title and publication schedule for this material
              </p>
            </div>
          </div>

          {material?.status && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 uppercase tracking-wide border border-slate-200">
              Status: {material.status}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
          {/* Document Title (8 cols on desktop) */}
          <div className="md:col-span-8">
            <Form.Item
              name="title"
              label={
                <div className="flex items-center gap-1.5 font-bold text-slate-700 text-xs uppercase tracking-wide">
                  <span>Document Title</span>
                  <span className="text-rose-500">*</span>
                </div>
              }
              rules={[{ required: true, message: 'Please enter a document title' }]}
              validateStatus={errors.title ? 'error' : ''}
              help={errors.title ? (errors.title[0] as string) : ''}
              className="!mb-0"
            >
              <Input
                size="large"
                placeholder="e.g. ISO 9001:2015 Activity Profile and Line-Item Budget"
                className="text-base font-semibold rounded-xl text-slate-900 placeholder:font-normal placeholder:text-slate-400"
                onChange={clearTitleError}
                onBlur={handleCheckTitle}
              />
            </Form.Item>
          </div>

          {/* Publication Date (4 cols on desktop) */}
          <div className="md:col-span-4">
            <Form.Item
              name="publish_date"
              label={
                <div className="flex items-center gap-1.5 font-bold text-slate-700 text-xs uppercase tracking-wide">
                  <Calendar size={13} className="text-slate-500" />
                  <span>Publish Date</span>
                  <span className="text-[10px] font-normal text-slate-400 capitalize">(Optional)</span>
                </div>
              }
              validateStatus={errors.publish_date ? 'error' : ''}
              help={errors.publish_date ? (errors.publish_date[0] as string) : ''}
              className="!mb-0"
            >
              <DatePicker
                size="large"
                className="w-full rounded-xl"
                format="YYYY-MM-DD"
                placeholder="Select date (optional)..."
              />
            </Form.Item>
          </div>
        </div>
      </div>

      {/* 2. Lower Section: 2-Column Responsive Workspace */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: Primary Content Area (Rich Text Editor) */}
        <div className="space-y-4 lg:col-span-8">
          {/* Document Rich Text Editor */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Document Body & Extracted Text</h3>
                <p className="text-xs text-slate-400">
                  Full text indexed by Qdrant and retrieved by STII-Agent for AI-grounded responses.
                </p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-1 text-[11px] font-semibold text-blue-700">
                <FileText size={12} /> Rich Text / HTML
              </span>
            </div>

            <Form.Item
              name="content"
              rules={[{ required: true, message: 'Please provide document text content' }]}
              validateStatus={errors.content ? 'error' : ''}
              help={errors.content ? (errors.content[0] as string) : ''}
              className="!mb-0"
            >
              <div className="min-h-[460px] rounded-xl overflow-hidden">
                <Ckeditor
                  material={material || undefined}
                  form={form}
                  ckLicense={ckLicense}
                />
              </div>
            </Form.Item>
          </div>
        </div>

        {/* Right Column: Metadata Sidebar (PDF Upload & AI Categories) */}
        <div className="space-y-4 lg:col-span-4">
          {/* PDF Document Attachment Card */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
            <div className="mb-3 flex items-center gap-2 border-b border-slate-100 pb-3">
              <div className="rounded-lg bg-sky-50 p-1.5 text-sky-700">
                <FileUp size={16} />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">PDF Attachment</h3>
                <span className="text-[11px] text-slate-400">Source PDF for public download and preview</span>
              </div>
            </div>

            {material?.uploaded_file && (
              <div className="mb-3 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50/60 p-3">
                <div className="flex items-center gap-2 min-w-0">
                  <FileCheck size={18} className="text-emerald-600 shrink-0" />
                  <div className="min-w-0">
                    <span className="block truncate text-xs font-semibold text-emerald-900" title={material.original_filename || material.uploaded_file}>
                      {material.original_filename || material.uploaded_file}
                    </span>
                    <span className="text-[10px] text-emerald-700 font-medium">Currently attached</span>
                  </div>
                </div>
              </div>
            )}

            <Form.Item
              name="upload"
              valuePropName="fileList"
              getValueFromEvent={(e) => (Array.isArray(e) ? e : e?.fileList)}
              validateStatus={errors.upload ? 'error' : ''}
              help={errors.upload ? (errors.upload[0] as string) : ''}
              className="!mb-0"
            >
              <Dragger
                {...uploadProps}
                maxCount={1}
                accept=".pdf,application/pdf"
                className="!rounded-xl !border-dashed !border-slate-300 !bg-slate-50/70 hover:!border-blue-500 hover:!bg-blue-50/30 transition-all p-3"
              >
                <div className="py-2 text-center">
                  <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                    <UploadCloud size={20} />
                  </div>
                  <p className="text-xs font-semibold text-slate-800">
                    {material?.uploaded_file ? 'Drop a new PDF to replace' : 'Click or drop PDF here to upload'}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-400">
                    Text will be automatically extracted into the editor
                  </p>
                </div>
              </Dragger>
            </Form.Item>
          </div>

          {/* Categories & AI Classifier Card */}
          <Form.Item name="categories" className="!mb-0">
            <AiClassifier id={material?.id ?? 0} form={form} errors={errors} />
          </Form.Item>
        </div>
      </div>

      {/* Bottom Sticky Action Bar Card */}
      <div className="sticky bottom-4 z-20 mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white/95 px-6 py-4 shadow-lg backdrop-blur-md">
        {role === 'admin' && (
          <>
            <Button
              type="default"
              loading={loading}
              className="h-10 rounded-xl px-5 border-slate-300 text-slate-700 hover:border-slate-400 font-medium"
              onClick={() => handleSubmit('draft')}
            >
              Save as Draft
            </Button>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="default"
                loading={loading}
                className="h-10 rounded-xl px-5 border-blue-300 text-blue-700 hover:border-blue-500 font-semibold"
                onClick={() => handleSubmit('save')}
              >
                Save Changes
              </Button>

              <Button
                type="primary"
                icon={<Sparkles size={15} />}
                loading={loading}
                className="h-10 rounded-xl px-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold shadow-md shadow-emerald-700/20"
                onClick={() => handleSubmit('publish')}
              >
                Save & Publish (Sync AI)
              </Button>
            </div>
          </>
        )}

        {role === 'publisher' && (
          <div className="ml-auto flex items-center gap-3">
            <Button
              type="default"
              loading={loading}
              className="h-10 rounded-xl px-5"
              onClick={() => handleSubmit('submit')}
            >
              Save
            </Button>

            <Button
              type="primary"
              icon={<SendHorizontal size={15} />}
              loading={loading}
              className="h-10 rounded-xl px-6 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
              onClick={() => handleSubmit('publish')}
            >
              Save & Publish
            </Button>
          </div>
        )}

        {role === 'encoder' && (
          <div className="ml-auto flex items-center gap-3">
            <Button
              type="default"
              loading={loading}
              className="h-10 rounded-xl px-5"
              onClick={() => handleSubmit('draft')}
            >
              Save as Draft
            </Button>

            <Button
              type="primary"
              icon={<SendHorizontal size={15} />}
              loading={loading}
              className="h-10 rounded-xl px-6 bg-blue-600 hover:bg-blue-500 text-white font-semibold"
              onClick={() => handleSubmit('submit')}
            >
              Save & Submit for Review
            </Button>
          </div>
        )}
      </div>
    </Form>
  );
}
