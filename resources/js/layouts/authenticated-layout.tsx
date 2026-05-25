import { PropsWithChildren, ReactNode } from 'react';

import { Layout } from 'antd';

import { User } from '@/types';
import EncoderLayout from './encoder-layout';
import AdminLayout from './admin-layout';

export default function AuthenticatedLayout(
  { user, children }: PropsWithChildren<{ user: User, header?: ReactNode }>) {

  return (

    <>
      <Layout>
        {user.role.toLowerCase() === 'admin' || user.role.toLowerCase() === 'administrator' && (
          <AdminLayout user={user} children={children}></AdminLayout>
        )}

        {user.role.toLowerCase() === 'encoder' && (
          <EncoderLayout user={user} children={children}></EncoderLayout>
        )}


      </Layout>
    </>


  );
}
