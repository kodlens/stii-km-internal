import { Link } from "@inertiajs/react";
import { App, Button, Dropdown, MenuProps, Space, Tooltip } from "antd";
import { Database, Globe, MoreHorizontal, NotepadTextDashed, Pencil, Trash2 } from "lucide-react";
import axios from 'axios'
import { Material } from "@/types/material";

type Prop = {
  refetch : ()=> void
  row: Material
}
export default function MaterialDropdown( { refetch, row } : Prop ) {

  const { modal } = App.useApp();

  // const handleUpdateClassification = (row:Material) => {

  // }

  const handlePublish = (row:number) => {

  }

  const handleCategorize = (row:number) => {

  }

  const confirmVectorize = (row:Material) => {

  }

  const handleDeleteClick = (row:number) => {

  }



  return (
    <Space size="small">
      <Dropdown
        trigger={['click']}
        placement="bottomRight"
        menu={{
          items: [
            {
              label: <Link href={`/admin/materials/${row.id}/edit`}>Edit Material</Link>,
              key: 'admin.materials.edit',
              icon: <Pencil size={14} className="text-blue-600" />,
            },
            // {
            //   label: 'Update Classification',
            //   key: 'admin.materials.update-classification',
            //   icon: <GitCompareArrows size={14} className="text-indigo-600" />,
            //   onClick: () => handleUpdateClassification(row),
            // },
            {
              label: 'Publish Material',
              key: 'admin.materials.publish',
              icon: <Globe size={14} className="text-emerald-600" />,
              onClick: () => handlePublish(row.id),
            },
            {
              label: 'Categorize',
              key: 'admin.materials.categorize',
              icon: <NotepadTextDashed size={14} className="text-blue-600" />,
              onClick: () => handleCategorize(row.id),
            },
            {
              label: 'Vectorize',
              key: 'admin.materials.vectorize',
              icon: <Database size={14} className="text-emerald-600" />,
              onClick: () => confirmVectorize(row),
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
