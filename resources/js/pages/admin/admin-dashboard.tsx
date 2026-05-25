import AuthenticatedLayout from '@/layouts/authenticated-layout'
import { SharedData } from '@/types'
import { ReactElement, ReactNode } from 'react'

export default function AdminDashboard() {
  return (
    <div>AdminDashboard</div>
  )
}

AdminDashboard.layout = (page: ReactNode) =>
  <AuthenticatedLayout
    user={(page as ReactElement<SharedData>).props.auth.user}
  >
    {page}
  </AuthenticatedLayout>


