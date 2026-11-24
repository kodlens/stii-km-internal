import { lazy, useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { usePage } from '@inertiajs/react';
import { App, Button, DatePicker, Form, FormInstance, Input, Spin, Upload, UploadProps } from 'antd';
import Dragger from 'antd/es/upload/Dragger';
import axios, { isAxiosError } from 'axios';
import dayjs from 'dayjs';
import {
  Calendar,
  CheckCircle2,
  FileCheck,
  FileText,
  ScanLine,
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
  const [ocrLoading, setOcrLoading] = useState(false);
  const [currentFileName, setCurrentFileName] = useState<string>('');
  const [editorContent, setEditorContent] = useState<string>(material?.content || '');

  const clearTitleError = () => {
    titleCheckVersion.current += 1;
    setErrors((prev) => {
      const next = { ...prev };
      delete next.title;
      return next;
    });
  };

  const csrfToken =
    (csrf_token as string) ||
    (typeof document !== 'undefined'
      ? document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? ''
      : '');

  const uploadProps: UploadProps = {
    name: 'docs',
    action: '/docs/temp-upload',
    headers: csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : undefined,
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
      if (info.file.status === 'uploading') {
        setOcrLoading(true);
      } else if (info.file.status === 'done') {
        setOcrLoading(false);
        setCurrentFileName(info.file.name);

        const res = info.file.response;
        // The backend reads and parses PDF content via ScanPdf and external OCR service
        if (res?.success && res?.message) {
          setEditorContent(res.message);
          form.setFieldValue('content', res.message);
          form.setFieldsValue({ content: res.message });
          notification.success({
            message: 'PDF Content Extracted!',
            description: `${info.file.name} successfully parsed. The extracted text has been printed directly into the editor below for review and editing.`,
            placement: 'topRight',
          });
        } else {
          notification.warning({
            message: 'PDF Uploaded (No Text Detected)',
            description: res?.ocr_error || 'Could not extract text content from this document. You can type or paste content manually.',
            placement: 'topRight',
          });
        }

        form.setFieldValue('docs', res);
      } else if (info.file.status === 'error') {
        setOcrLoading(false);
        const errMsg = info.file.response?.message || info.file.response?.ocr_error || 'Upload or OCR extraction failed.';
        notification.error({
          message: 'PDF Processing Failed',
          description: `${info.file.name}: ${errMsg}`,
          placement: 'topRight',
        });
      }
    },

    onRemove(info) {
      setCurrentFileName('');
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
      setEditorContent(material.content || '');
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

  const onActionClick = async (action: SubmitAction) => {
    const title = form.getFieldValue('title');
    if (!title || typeof title !== 'string' || !title.trim()) {
      setErrors((prev) => ({
        ...prev,
        title: ['Document Title is required.'],
      }));
      notification.error({
        message: 'Title is Required',
        description: 'Please enter a document title before saving.',
        placement: 'topRight',
      });
      form.scrollToField('title');
      return;
    }
    await handleSubmit(action);
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

      {/* 2. Middle Section: PDF Document Reader & Text Extractor (Dedicated Card) */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
              <ScanLine size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-800">PDF Document Reader & Text Extractor</h3>
                <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-700">
                  OCR & PDF Parser
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Upload a PDF document to automatically read and extract its content directly into the editor below.
              </p>
            </div>
          </div>

          {ocrLoading && (
            <div className="flex items-center gap-2 rounded-xl bg-amber-50 px-3.5 py-2 text-xs font-semibold text-amber-800 ring-1 ring-amber-200 animate-pulse">
              <Spin size="small" />
              <span>Reading PDF content via OCR parser...</span>
            </div>
          )}
        </div>

        {/* Currently Loaded / Extracted Document Status */}
        {(material?.uploaded_file || currentFileName) && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                <FileCheck size={20} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className="truncate text-xs font-bold text-emerald-950"
                    title={(currentFileName || material?.original_filename || material?.uploaded_file) ?? undefined}
                  >
                    {currentFileName || material?.original_filename || material?.uploaded_file}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                    <CheckCircle2 size={11} /> Content Loaded in Editor
                  </span>
                </div>
                <span className="text-[11px] text-emerald-700">
                  Document parsed. The extracted text is displayed in the editor below and ready for review, formatting, or publishing.
                </span>
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
            className="!rounded-2xl !border-dashed !border-slate-300 !bg-slate-50/70 hover:!border-blue-500 hover:!bg-blue-50/40 transition-all p-4"
          >
            <div className="py-3 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 shadow-xs">
                <UploadCloud size={24} />
              </div>
              <p className="text-sm font-bold text-slate-800">
                {material?.uploaded_file || currentFileName
                  ? 'Click or drag a new PDF here to re-extract content'
                  : 'Click or drop PDF document here to parse and extract text'}
              </p>
              <p className="mt-1 text-xs text-slate-500 max-w-lg mx-auto">
                Supports digital PDFs and scanned image documents (OCR). Extracted text will automatically print into the Document Editor below. Max file size: 50MB.
              </p>
            </div>
          </Dragger>
        </Form.Item>
      </div>

      {/* 3. Lower Section: 2-Column Responsive Workspace */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: Primary Content Area (Rich Text Editor) */}
        <div className="space-y-4 lg:col-span-8">
          {/* Document Rich Text Editor */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Document Content (PDF Content)</h3>
                <p className="text-xs text-slate-400">
                  Extracted text from the PDF above. Edit and format here before saving or publishing.
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
              <Ckeditor
                material={material || undefined}
                form={form}
                ckLicense={ckLicense}
                value={editorContent}
                onChange={(val) => {
                  setEditorContent(val);
                  form.setFieldValue('content', val);
                }}
              />
            </Form.Item>
          </div>
        </div>

        {/* Right Column: AI Categories Classification */}
        <div className="space-y-4 lg:col-span-4">
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
              onClick={() => onActionClick('draft')}
            >
              Save as Draft
            </Button>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="default"
                loading={loading}
                className="h-10 rounded-xl px-5 border-blue-300 text-blue-700 hover:border-blue-500 font-semibold"
                onClick={() => onActionClick('save')}
              >
                Save Changes
              </Button>

              <Button
                type="primary"
                icon={<Sparkles size={15} />}
                loading={loading}
                className="h-10 rounded-xl px-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold shadow-md shadow-emerald-700/20"
                onClick={() => onActionClick('publish')}
              >
                Publish & Vectorize
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
              onClick={() => onActionClick('submit')}
            >
              Save
            </Button>

            <Button
              type="primary"
              icon={<Sparkles size={15} />}
              loading={loading}
              className="h-10 rounded-xl px-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold shadow-md shadow-emerald-700/20"
              onClick={() => onActionClick('publish')}
            >
              Approve & Publish (Vectorize)
            </Button>
          </div>
        )}

        {role === 'encoder' && (
          <div className="ml-auto flex items-center gap-3">
            <Button
              type="default"
              loading={loading}
              className="h-10 rounded-xl px-5"
              onClick={() => onActionClick('draft')}
            >
              Save as Draft
            </Button>

            <Button
              type="primary"
              icon={<SendHorizontal size={15} />}
              loading={loading}
              className="h-10 rounded-xl px-6 bg-blue-600 hover:bg-blue-500 text-white font-semibold"
              onClick={() => onActionClick('submit')}
            >
              Save & Submit for Review
            </Button>
          </div>
        )}
      </div>
    </Form>
  );
}
