import { Link } from "@inertiajs/react";
import { App, Button, Dropdown, MenuProps, Space, Tag, Tooltip } from "antd";
import { Database, Globe, MoreHorizontal, Pencil, Tag as TagIcon, Trash2 } from "lucide-react";
import axios from 'axios'
import { ReactNode } from 'react'
import { MaterialProps } from "@/types/material";

type Prop = {
  refetch : ()=> void
  row: MaterialProps
}

const UNAVAILABLE = 'Not available yet — this action has no backend endpoint.';

const unavailableLabel = (label: string): ReactNode => (
  <span className="flex items-center gap-2">
    <span>{label}</span>
    <Tag bordered={false} className="!ml-auto !text-[0.65rem] !leading-4">Soon</Tag>
  </span>
);

export default function MaterialDropdown( { refetch, row } : Prop ) {

  const { modal, notification } = App.useApp();

  const handleDeleteClick = async (rowId:number) => {
    try {
      const res = await axios.delete('/admin/materials/' + rowId);
      if (res.data?.success) {
        notification.success({
          message: 'Material Deleted',
          description: 'The material was successfully removed.',
          placement: 'topRight',
        });
      } else {
        notification.error({
          message: 'Deletion Failed',
          description: res.data?.message ?? 'The material could not be deleted.',
          placement: 'topRight',
        });
      }
    } catch {
      notification.error({
        message: 'Deletion Failed',
        description: 'Unable to delete material. Please try again.',
        placement: 'topRight',
      });
    } finally {
      refetch()
    }
  }

  const handlePublish = async (rowId:number) => {
    try {
      const res = await axios.post(`/admin/materials/${rowId}/publish`);
      if (res.data?.success) {
        notification.success({
          message: 'Material Publish',
          description: 'The material was successfully published.',
          placement: 'topRight',
        });
      } else {
        notification.error({
          message: 'Publish Failed',
          description: res.data?.message ?? 'The material could not be publish.',
          placement: 'topRight',
        });
      }
    } catch {
      notification.error({
        message: 'Publish Failed',
        description: 'Unable to publish material. Please try again.',
        placement: 'topRight',
      });
    } finally {
      refetch()
    }
  }

  return (
    <Space size="small">
      <Dropdown
        trigger={['click']}
        placement="bottomRight"
        menu={{
          items: [
            {
              label: <Link href={route('admin.materials.edit', row.id)}>Edit Material</Link>,
              key: 'admin.materials.edit',
              icon: <Pencil size={14} className="text-blue-600" />,
            },
            {
              type: 'divider',
            },
            {
              label: 'Publish Material',
              key: 'admin.materials.publish',
              icon: <Globe size={14} className="text-emerald-600" />,
              onClick: ()=> handlePublish(row.id),
            },
            {
              label: unavailableLabel('Categorize'),
              key: 'admin.materials.categorize',
              icon: <TagIcon size={14} className="text-blue-600" />,
              disabled: true,
              title: UNAVAILABLE,
            },
            {
              label: unavailableLabel('Vectorize'),
              key: 'admin.materials.vectorize',
              icon: <Database size={14} className="text-emerald-600" />,
              disabled: true,
              title: UNAVAILABLE,
            },
            {
              type: 'divider',
            },
            {
              label: 'Delete Material',
              key: 'admin.materials.delete',
              danger: true,
              icon: <Trash2 size={14} className="text-rose-600" />,
              onClick: () => {
                modal.confirm({
                  title: 'Delete Material?',
                  icon: <Trash2 className="text-rose-500" size={22} />,
                  content: `Are you sure you want to delete "${row.title}"? This cannot be undone.`,
                  okText: 'Yes, delete',
                  okButtonProps: {
                    danger: true,
                    className: '!rounded-lg',
                  },
                  cancelText: 'Cancel',
                  cancelButtonProps: {
                    className: '!rounded-lg',
                  },
                  onOk: () => handleDeleteClick(row.id as number),
                });
              },
            },
          ] as MenuProps['items'],
        }}
      >
        <Tooltip title="Options">
          <Button
            aria-label={`Actions for ${row.title}`}
            size="small"
            type="text"
            icon={<MoreHorizontal size={17} />}
            className="flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-100 !w-8 !h-8 !p-0 rounded-lg transition-colors cursor-pointer"
          />
        </Tooltip>
      </Dropdown>
    </Space>
  )
}
