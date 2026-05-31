import { App, Form } from 'antd'
import AuthenticatedLayout from '@/layouts/authenticated-layout'
import { ReactElement, ReactNode, useState } from 'react'
import { User } from '@/types'
import {  MaterialProps } from '@/types/material'
import axios, { isAxiosError } from 'axios'
import CreateEditMaterial from '@/components/create-edit-materials'
import { router } from '@inertiajs/react'

type Pageprops = {
  material: MaterialProps;
  ckLicense: string;
}


const EncoderNewMaterial = ({ material, ckLicense }: Pageprops) => {

  const [form] = Form.useForm();
  const [loading, setLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, unknown[]>>({});
  const { notification } = App.useApp();

  // const removeTempFile = async (fileName?: string) => {
  //   if (!fileName) return;
  //   try {
  //     await axios.post(`/docs/temp-remove/${fileName}`);
  //   } catch {
  //     // Ignore cleanup failures so we do not block the main flow.
  //   }
  // };


  const submit = async (values: object) => {
    setLoading(true)
    if(material && material.id > 0) {
      update(values, material.id);
    }else{
      store(values);
    }
  }

  const store = (values: object) => {
    axios.post('/encoder/materials/new-material', values).then(res=> {
      if(res.data.success) {
        notification.success({
          title: 'SAVED!',
          description: 'Material successfully recorded.'
        });
        router.reload();
      }
      setLoading(false)
    }).catch((error:unknown) => {
      setLoading(false);
      if(isAxiosError(error) && error.response && error.response.status === 422){
        setErrors(error.response.data.errors);
        notification.error({
          title: 'Error!',
          description: error.response.data.message
        });
      }else{
        notification.error({
          title: 'ERROR!',
          description: `Unknown error. ${error}`
        })
      }
    })
  }

  const update = (values: object, id:number) => {
    axios.put(`/encoder/materials/new-material/${id}`, values).then(res=> {
      if(res.data.success) {
        notification.success({
          title: 'UDPATED!',
          description: 'Material successfully updated.'
        });
        router.reload();
      }
      setLoading(false)
    }).catch((error:unknown) => {
      setLoading(false);
      if(isAxiosError(error) && error.response && error.response.status === 422){
        setErrors(error.response.data.errors);
        notification.error({
          title: 'Error!',
          description: error.response.data.message
        });
      }else{
        notification.error({
          title: 'ERROR!',
          description: `Unknown error. ${error}`
        })
      }
    })
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

            <CreateEditMaterial
              material={material}
              ckLicense={ckLicense}
              form={form}
              onSubmit={submit}
              errors={errors} loading={loading} />

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
