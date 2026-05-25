import { PropsWithChildren, ReactNode } from 'react';

import { Layout } from 'antd';

import { User } from '@/types';
import EncoderLayout from './encoder-layout';
import AdminLayout from './admin-layout';

export default function AuthenticatedLayout(
  { user, children }: PropsWithChildren<{ user: User, header?: ReactNode }>) {

  const role = user.role.toLowerCase();

  return (
    <Layout>

      {(role === 'admin' || role === 'administrator') && (
        <AdminLayout user={user} children={children}></AdminLayout>
      )}

      {role === 'encoder' && (
        <EncoderLayout user={user} children={children}></EncoderLayout>
      )}

    </Layout>


  );
}
