import { ReactElement, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { App, Button, Form } from 'antd';
import axios, { isAxiosError } from 'axios';
import { ArrowLeft, CheckCircle2, RefreshCw, Sparkles } from 'lucide-react';

import AdminLayout from '@/layouts/admin-layout';
import CreateEditMaterial from '@/components/create-edit-materials';
import { SharedData, User } from '@/types';
import { Material, MaterialProps } from '@/types/material';

type VectorStatus = {
  is_vectorized: boolean;
  qdrant_synced: boolean;
  chunks_count: number;
  content_hash: string;
  embedding_model: string;
};

type PageProps = {
  material: MaterialProps | null;
  vectorStatus?: VectorStatus | null;
  ckLicense: string;
  auth: {
    user: User;
  };
};

export default function AdminMaterialAddEdit({ auth, material, vectorStatus, ckLicense }: PageProps) {
  const role = auth.user.role.toLowerCase();

  const [form] = Form.useForm();
  const [loading, setLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, unknown[]>>({});
  const [liveVectorStatus, setLiveVectorStatus] = useState<VectorStatus | null | undefined>(vectorStatus);
  const [isVectorizing, setIsVectorizing] = useState<boolean>(false);
  const { notification } = App.useApp();

  const isEditing = !!(material && material.id > 0);

  const handleVectorizeNow = async () => {
    if (!material?.id) return;
    try {
      setIsVectorizing(true);
      const res = await axios.post(`/admin/materials/${material.id}/vectorize`, { override: true });
      if (res.data?.success) {
        notification.success({
          message: 'AI Vectorization Complete',
          description: `Material successfully re-embedded and synchronized in Qdrant (${res.data.chunks_count} chunks).`,
          placement: 'topRight',
        });
        setLiveVectorStatus((prev) =>
          prev
            ? { ...prev, is_vectorized: true, qdrant_synced: true, chunks_count: res.data.chunks_count }
            : null
        );
      } else {
        notification.error({
          message: 'Vectorization Failed',
          description: res.data?.message ?? 'Could not synchronize vectors.',
        });
      }
    } catch {
      notification.error({
        message: 'Vectorization Error',
        description: 'Unable to reach the embedding service or Qdrant.',
      });
    } finally {
      setIsVectorizing(false);
    }
  };

  const submit = async (action: string) => {
    const values = await form.validateFields();

    setLoading(true);
    if (isEditing) {
      update(values, action, material.id);
    } else {
      store(values, action);
    }
  };

  const store = (values: Material, action: string) => {
    axios
      .post('/admin/materials', {
        ...values,
        publish_date: values.publish_date
          ? values.publish_date.format('YYYY-MM-DD')
          : null,
        submit_type: action,
      })
      .then((res) => {
        if (res.data.success) {
          notification.success({
            message: action === 'publish' ? 'Saved & Published!' : 'Material Saved',
            description:
              action === 'publish'
                ? 'Material published and automatically queued for AI vectorization.'
                : 'Material saved successfully.',
          });
          setLoading(false);
          router.visit(route('admin.materials.index'));
        }
      })
      .catch((error: unknown) => {
        setLoading(false);
        if (isAxiosError(error) && error.response && error.response.status === 422) {
          setErrors(error.response.data.errors);
          notification.error({
            message: 'Validation Error',
            description: error.response.data.message,
          });
        } else {
          notification.error({
            message: 'Error Saving Material',
            description: `An unexpected error occurred: ${error}`,
          });
        }
      });
  };

  const update = (values: Material, action: string, id: number) => {
    axios
      .put(`/admin/materials/${id}`, {
        ...values,
        publish_date: values.publish_date
          ? values.publish_date.format('YYYY-MM-DD')
          : null,
        submit_type: action,
      })
      .then((res) => {
        if (res.data.success) {
          notification.success({
            message: action === 'publish' ? 'Updated & Published!' : 'Material Updated',
            description:
              action === 'publish'
                ? 'Material updated, published, and queued for AI vector re-sync.'
                : 'Material changes saved successfully.',
          });
          setLoading(false);
          router.visit(route('admin.materials.index'));
        }
      })
      .catch((error: unknown) => {
        setLoading(false);
        if (isAxiosError(error) && error.response && error.response.status === 422) {
          setErrors(error.response.data.errors);
          notification.error({
            message: 'Validation Error',
            description: error.response.data.message,
          });
        } else {
          notification.error({
            message: 'Error Updating Material',
            description: `An unexpected error occurred: ${error}`,
          });
        }
      });
  };

  return (
    <>
      <Head title={isEditing ? `Edit Material #${material.id}` : 'New Material'} />

      <div className="mx-2 md:mx-auto max-w-6xl space-y-4">
        {/* Navigation Breadcrumb & Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Button
              icon={<ArrowLeft size={15} />}
              onClick={() => router.visit(route('admin.materials.index'))}
              className="text-slate-600 hover:text-slate-900 border-slate-300"
            >
              Back to Materials
            </Button>
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                {isEditing ? `Edit Material #${material.id}` : 'Create New Material'}
              </h1>
              <p className="text-xs text-slate-500">
                Author, classify, and publish KM materials for internal retrieval and STII-Agent AI grounding.
              </p>
            </div>
          </div>

          {/* AI Vector Status Badge & Quick Re-sync */}
          {isEditing && liveVectorStatus && (
            <div className="flex flex-wrap items-center gap-2">
              {liveVectorStatus.qdrant_synced ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  <CheckCircle2 size={13} className="text-emerald-600" />
                  Qdrant Synced ({liveVectorStatus.chunks_count} chunks)
                </span>
              ) : liveVectorStatus.is_vectorized ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                  <Sparkles size={13} className="text-amber-600" />
                  Pending Re-sync
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                  Unindexed
                </span>
              )}

              <Button
                icon={<RefreshCw size={13} className={isVectorizing ? 'animate-spin text-indigo-600' : 'text-indigo-600'} />}
                loading={isVectorizing}
                onClick={handleVectorizeNow}
                className="border-indigo-200 text-indigo-700 hover:!border-indigo-400 font-medium text-xs h-8"
              >
                Re-Sync AI
              </Button>
            </div>
          )}
        </div>

        {/* Main Card */}
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/60 p-6">
          <CreateEditMaterial
            material={material as never}
            ckLicense={ckLicense}
            form={form}
            role={role}
            handleSubmit={(action) => submit(action)}
            errors={errors}
            setErrors={setErrors}
            loading={loading}
          />
        </div>
      </div>
    </>
  );
}

AdminMaterialAddEdit.layout = (page: ReactElement<SharedData>) => (
  <AdminLayout user={page.props.auth.user}>{page}</AdminLayout>
);
