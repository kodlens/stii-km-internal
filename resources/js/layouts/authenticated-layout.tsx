import { PropsWithChildren, ReactNode } from 'react';

import { Layout } from 'antd';

import { User } from '@/types';
import EncoderLayout from './encoder-layout';
import AdminLayout from './admin-layout';
import PublisherLayout from './publisher-layout';

export default function AuthenticatedLayout(
  { user, children, header }: PropsWithChildren<{ user: User, header?: ReactNode }>) {

  const role = user.role.toLowerCase();

  return (
    <Layout>

      {(role === 'admin' || role === 'administrator') && (
        <AdminLayout user={user} header={header} children={children}></AdminLayout>
      )}

      {(role === 'publisher') && (
        <PublisherLayout user={user} header={header} children={children}></PublisherLayout>
      )}

      {role === 'encoder' && (
        <EncoderLayout user={user} header={header} children={children}></EncoderLayout>
      )}

    </Layout>


  );
}
