import AuthenticatedLayout from '@/layouts/authenticated-layout'
import { SharedData } from '@/types'
import { ReactElement, ReactNode } from 'react'

export default function PublisherDashboard() {
  return (
    <div>Publisher Dashboard</div>
  )
}

PublisherDashboard.layout = (page: ReactNode) =>
  <AuthenticatedLayout
    user={(page as ReactElement<SharedData>).props.auth.user}
  >
    {page}
  </AuthenticatedLayout>


