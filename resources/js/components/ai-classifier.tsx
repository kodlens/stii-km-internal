import { useEffect, useState } from 'react';
import { App, Button, Form, FormInstance, Popconfirm } from 'antd';
import axios from 'axios';
import { Bot, Plus, Sparkles, X } from 'lucide-react';
import ModalSelectCategory from './modal-select-category';
import { Category } from '@/types/category';

type PageProps = {
  id: number;
  form: FormInstance;
  errors: Record<string, unknown[]>;
};

type AIResult = {
  id: number;
  score: number;
  analysis: string;
};

type CategoryItem = {
  category_id: number;
  category: string;
  score: number;
  analysis: string;
};

export default function AiClassifier({ form, errors }: PageProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const { notification, message } = App.useApp();
  const [categoryData, setCategoryData] = useState<Category[]>([]);

  const loadCategories = () => {
    axios
      .get<Category[]>('/load-categories')
      .then((res) => {
        setCategoryData(res.data);
      })
      .catch((err) => {
        console.error(err);
      });
  };

  const handleClassification = () => {
    setLoading(true);
    const content = form.getFieldValue('content');

    if (!content || typeof content !== 'string' || content.trim() === '') {
      notification.warning({
        message: 'Content Required',
        description: 'Please write or upload PDF content first before requesting AI category suggestions.',
      });
      setLoading(false);
      return;
    }

    axios
      .post('/classify-content', { content })
      .then((res) => {
        if (!res.data?.results || res.data.results.length === 0) {
          notification.info({
            message: 'No Categories Matched',
            description: 'STII-Agent did not detect strong matches for this content. You can assign categories manually.',
          });
          return;
        }

        const resData: AIResult[] = res.data.results;
        const matchedCategories = resData.map((datum) => {
          const matched = categoryData.find((cat: Category) => cat.id === datum.id);
          return {
            category_id: datum.id,
            category: matched?.category || `Category #${datum.id}`,
            score: datum.score,
            analysis: datum.analysis,
          };
        });

        // Merge with existing avoiding duplicates
        const currentCategories: CategoryItem[] = form.getFieldValue('categories') || [];
        const existingIds = new Set(currentCategories.map((c) => c.category_id));
        const newAdditions = matchedCategories.filter((m) => !existingIds.has(m.category_id));

        form.setFieldValue('categories', [...currentCategories, ...newAdditions]);
        notification.success({
          message: 'AI Categories Suggested',
          description: `Identified ${newAdditions.length} relevant categories.`,
        });
      })
      .catch((error) => {
        notification.error({
          message: 'Classification Error',
          description: error.response?.data?.message || 'Unable to connect to AI classifier.',
        });
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleDelete = (categoryId: number) => {
    const categories: CategoryItem[] = form.getFieldValue('categories') || [];
    form.setFieldValue(
      'categories',
      categories.filter((item) => item.category_id !== categoryId)
    );
  };

  const handleAddManualCategory = (row: CategoryItem) => {
    const categories: CategoryItem[] = form.getFieldValue('categories') || [];
    if (categories.some((item) => item.category_id === row.category_id)) {
      message.warning('This category is already assigned.');
      return;
    }
    form.setFieldValue('categories', [...categories, row]);
    message.success('Category added.');
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const assignedCategories: CategoryItem[] = Form.useWatch('categories', form) || [];

  return (
    <div className="space-y-3 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-blue-50 p-1.5 text-blue-700">
            <Bot size={16} />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">Assigned Categories</h3>
            <span className="text-[11px] text-slate-400">Categories used to index and discover this document</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="primary"
            icon={<Sparkles size={13} className={loading ? 'animate-spin' : ''} />}
            loading={loading}
            onClick={handleClassification}
            className="h-8 bg-gradient-to-r from-blue-600 to-indigo-600 text-xs font-semibold hover:from-blue-500 hover:to-indigo-500"
          >
            AI Suggest
          </Button>

          <ModalSelectCategory
            onSelectCategory={handleAddManualCategory}
            triggerButton={
              <Button icon={<Plus size={13} />} className="h-8 border-slate-200 text-xs font-medium text-slate-700">
                Add
              </Button>
            }
          />
        </div>
      </div>

      {/* Category Pills / List */}
      {assignedCategories.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-4 text-center">
          <p className="text-xs text-slate-500">No categories assigned yet.</p>
          <p className="mt-1 text-[11px] text-slate-400">
            Click <strong className="text-slate-700">AI Suggest</strong> to auto-tag from content, or <strong className="text-slate-700">Add</strong> to select manually.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {assignedCategories.map((item) => (
            <div
              key={item.category_id}
              className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-slate-50/50 p-2.5 transition-colors hover:bg-slate-100/60"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-xs font-semibold text-slate-800">{item.category}</span>
                  {item.score > 0 ? (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 border border-indigo-200">
                      <Sparkles size={10} /> {Math.round(item.score * 100)}% match
                    </span>
                  ) : (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                      Manual
                    </span>
                  )}
                </div>
                {item.analysis && item.analysis !== 'Manually added.' && (
                  <p className="mt-0.5 line-clamp-1 text-[11px] text-slate-500 italic" title={item.analysis}>
                    {item.analysis}
                  </p>
                )}
              </div>

              <Popconfirm
                title="Remove Category"
                description={`Remove "${item.category}" from this material?`}
                onConfirm={() => handleDelete(item.category_id)}
                okText="Remove"
                cancelText="Cancel"
                okButtonProps={{ danger: true }}
              >
                <Button
                  type="text"
                  size="small"
                  icon={<X size={14} className="text-slate-400 hover:text-rose-600" />}
                  className="shrink-0"
                />
              </Popconfirm>
            </div>
          ))}

          {assignedCategories.length > 1 && (
            <div className="flex justify-end pt-1">
              <Button
                type="link"
                size="small"
                danger
                onClick={() => form.setFieldValue('categories', [])}
                className="!px-0 text-[11px]"
              >
                Clear all categories
              </Button>
            </div>
          )}
        </div>
      )}

      {errors.category && (
        <div className="text-xs text-rose-600">{errors.category[0] as string}</div>
      )}
    </div>
  );
}
