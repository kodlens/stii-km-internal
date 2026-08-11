import AuthenticatedLayout from '@/layouts/authenticated-layout'
import { SharedData } from '@/types'
import { ReactElement, ReactNode } from 'react'

export default function EncoderDashboard() {
  return (
    <div className='md:w-4xl md:mx-auto mx-2'>
      <div className='bg-white h-100 w-full rounded-2xl justify-center px-8 py-6'>
        <div className='font-semibold text-xl text-slate-700'>
          Encoder Dashboard
        </div>
      </div>

    </div>
  )
}

EncoderDashboard.layout = (page: ReactNode) =>
  <AuthenticatedLayout
    user={(page as ReactElement<SharedData>).props.auth.user}
  >
    {page}
  </AuthenticatedLayout>


