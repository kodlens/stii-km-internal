import AuthenticatedLayout from '@/layouts/authenticated-layout'
import { SharedData } from '@/types'
import { ReactElement, ReactNode } from 'react'

export default function EncoderDashboard() {
  return (
    <div>AdminDashboard</div>
  )
}

EncoderDashboard.layout = (page: ReactNode) =>
  <AuthenticatedLayout
    user={(page as ReactElement<SharedData>).props.auth.user}
  >
    {page}
  </AuthenticatedLayout>


