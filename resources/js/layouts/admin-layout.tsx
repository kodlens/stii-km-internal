import { useEffect, useMemo, useState, PropsWithChildren, ReactNode } from 'react';
import { router, useForm } from '@inertiajs/react';

import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined, ProfileOutlined,
  FormOutlined,
  DashboardOutlined,
  DownOutlined
} from '@ant-design/icons';

import { Avatar, Button, ConfigProvider, Dropdown, Layout, Menu, MenuProps } from 'antd';

import { Book,
    LogOut, Plus,
    SquareChartGantt, UserPen,
     UserRoundCog } from 'lucide-react';

import PanelSideBarLogo from '@/components/panel-sidebar-logo';
import { User } from '@/types';
const { Header, Sider, Content } = Layout;

const siderStyle: React.CSSProperties = {
  background: `
    radial-gradient(circle at top right, rgba(59, 130, 246, 0.24), transparent 42%),
    radial-gradient(circle at bottom left, rgba(14, 165, 233, 0.18), transparent 38%),
    linear-gradient(180deg, #1e3a8a 0%, #1e2a68 48%, #16224f 100%)
  `,
  borderRight: '1px solid rgba(191, 219, 254, 0.24)',
};

export default function AdminLayout(
  { user, children, header }: PropsWithChildren<{ user: User, header?: ReactNode }>) {

  const { post } = useForm();

  const [collapsed, setCollapsed] = useState(false);
  const [openKeys, setOpenKeys] = useState<string[]>(['materials']);

  const handleLogout = () => {
    post(route('logout'));
  }

  type MenuItem = Required<MenuProps>['items'][number];

  const currentRoute = `${route().current() ?? ''}`;
  // e.g. admin.materials.index -> admin.materials
  const currentMenuKey = currentRoute.split('.').slice(0, -1).join('.');

  // Open the section containing the current page, so the active item is
  // never hidden behind a closed submenu after a full page load.
  useEffect(() => {
    if (currentMenuKey.startsWith('admin.materials') || currentMenuKey.startsWith('admin.ojt')) {
      setOpenKeys((keys) => (keys.includes('materials') ? keys : [...keys, 'materials']));
    }
  }, [currentMenuKey]);

  const userInitials = `${user?.fname?.[0] ?? ''}${user?.lname?.[0] ?? ''}`.toUpperCase();
  const fullName = `${user?.lname ?? ''}, ${user?.fname ?? ''}`.trim();
  const compactName = `${user?.lname ?? ''}, ${user?.fname?.[0] ?? ''}.`.trim();

  const PAGE_TITLES: Record<string, string> = {
    'admin.dashboard': 'Dashboard',
    'admin.categories': 'Categories',
    'admin.topics': 'Topics',
    'admin.materials': 'Materials',
    'admin.ojt-materials': 'OJT Entry Materials',
    'admin.users': 'Users',
  };

  const pageTitle =
    PAGE_TITLES[currentMenuKey] ??
    PAGE_TITLES[currentRoute] ??
    (currentRoute.startsWith('admin.materials') ? 'New Material' : 'Admin Panel');

  // "New Material" should highlight itself rather than "All Materials".
  const selectedKeys = currentRoute.startsWith('admin.materials.create')
    ? ['admin.materials.create']
    : [currentMenuKey];

  const navigationItems = useMemo<MenuItem[]>(() => ([
    {
      key: 'admin.dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
      onClick: () => router.visit(route('admin.dashboard')),
    },
    {
      key: 'admin.categories',
      icon: <ProfileOutlined />,
      label: 'Categories', //this is subjects, but display as categories
      onClick: () => router.visit(route('admin.categories.index')),
    },
    {
      key: 'admin.topics',
      icon: <Book size={15}/>,
      label: 'Topics', //this is subjects, but display as categories
      onClick: () => router.visit(route('admin.topics.index')),
    },
    // {
    //   key: 'admin.categories',
    //   icon: <ProfileOutlined />,
    //   label: 'Categories',
    //   onClick: () => router.visit('/admin/categories'),
    // },
    // {
    //   key: 'admin.regions',
    //   icon: <LandPlot size={15} />,
    //   label: 'Regions',
    //   onClick: () => router.visit('/admin/regions'),
    // },
    // {
    //   key: 'admin.filter-types',
    //   icon: <FunnelPlus size={15} />,
    //   label: 'Filter Types',
    //   onClick: () => router.visit('/admin/filter-types'),
    // },
    {
      type: 'divider',
    },
    {
      key: 'materials',
      icon: <FormOutlined />,
      label: 'Materials',
      children: [
        {
          key: 'admin.materials',
          label: 'All Materials',
          icon: <FormOutlined />,
          onClick: () => router.visit(route('admin.materials.index')),
        },
        {
          key: 'admin.ojt-materials',
          label: 'OJT Entry Materials',
          icon: <UserPen size={15} />,
          onClick: () => router.visit(route('admin.ojt-materials.index')),
        },
        // {
        //   key: 'admin.trash-articles',
        //   label: 'Trash Post/Article',
        //   icon: <DatabaseZap size={15} />,
        //   onClick: () => router.visit('/admin/trash-materials'),
        // },
        {
          key: 'admin.materials.create',
          label: 'New Material',
          icon: <Plus size={15} />,
          onClick: () => router.visit(route('admin.materials.create')),
        },

      ],
    },

    // {
    //   key: 'admin.external-api',
    //   icon: <SquareArrowOutUpRight size={15} />,
    //   label: 'External API',
    //   children: [
    //     {
    //       key: 'admin.external-apis.dostv',
    //       label: 'DOSTV API',
    //       icon: <Sparkle size={15} />,
    //       onClick: () => router.visit('/admin/external-api/dostv'),
    //     },

    //     // {
    //     //   key: 'admin.external-apis.science-gov',
    //     //   label: 'Science.gov API',
    //     //   icon: <SquareArrowOutUpRight size={15} />,
    //     //   onClick: () => router.visit('/admin/external-api/science-gov'),
    //     // },
    //   ]
    // },
    {
      type: 'divider'
    },
    {
      key: 'admin.material-assignments',
      icon: <UserRoundCog size={15} />,
      label: 'Material Assignments',
      onClick: () => router.visit('/admin/material-assignments'),
    },
    {
      key: 'admin.users',
      icon: <UserOutlined />,
      label: 'Users',
      onClick: () => router.visit(route('admin.users.index')),
    },
    {
      key: 'admin.activity-logs',
      icon: <SquareChartGantt size={15} />,
      label: 'Activity Logs',
      onClick: () => router.visit('/admin/activity-logs'),
    },
  ]), []);

  return (
    <>
      <Layout>
        <Sider trigger={null}
          style={siderStyle}
          collapsible
          collapsed={collapsed} width={260}
          breakpoint='md'
          onBreakpoint={(broken) => {
            setCollapsed(broken)
            if (!broken) setOpenKeys(['materials'])
          }}>
          <div className='border-b border-blue-100/25 px-4 pb-4 pt-5'>
            {collapsed ? (
              <div className='flex justify-center'>
                <span className='inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-sm font-bold text-blue-50'>
                  {userInitials || 'AD'}
                </span>
              </div>
            ) : (
              <>
                <PanelSideBarLogo />
                <div className='mt-4 rounded-xl border border-blue-100/25 bg-white/10 px-3 py-2'>
                  <p className='text-[10px] font-semibold uppercase tracking-[0.14em] text-blue-100/90'>Admin Workspace</p>
                  <div className='mt-1.5 flex items-center gap-2'>
                    <div className='inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-blue-100/35 bg-blue-200/20 text-[11px] font-semibold text-white'>
                      {userInitials || 'AD'}
                    </div>
                    <p className='truncate text-xs text-blue-50/90'>{user.lname}, {user.fname}</p>
                  </div>
                </div>
              </>
            )}
          </div>
          <ConfigProvider
            theme={{
              token: {
                colorText: '#eff6ff',
                colorBgBase: '#1e3a8a',
                colorBgContainer: '#1e3a8a',
              },
              components: {
                Menu: {
                  itemBg: 'transparent',
                  itemColor: 'rgba(239,246,255,0.86)',
                  itemHoverColor: '#ffffff',
                  itemHoverBg: 'rgba(96, 165, 250, 0.18)',
                  itemSelectedColor: '#ffffff',
                  itemSelectedBg: 'rgba(37, 99, 235, 0.42)',
                  subMenuItemBg: 'transparent',
                  itemBorderRadius: 10,
                  iconSize: 15,
                },
              }
            }}
          >
            <Menu
              mode="inline"
              style={{
                background: 'transparent',
                color: '#eff6ff',
                borderInlineEnd: 0,
                paddingInline: 8,
                paddingTop: 8,
              }}
              selectedKeys={selectedKeys}
              openKeys={collapsed ? [] : openKeys}
              onOpenChange={(keys) => setOpenKeys(keys as string[])}
              items={navigationItems}
            />
          </ConfigProvider>


        </Sider>
        <Layout>
          <Header
            className='border-b border-slate-200'
            style={{ padding: 0, background: 'white' }}
          >
            <div className='flex h-16 items-center justify-between px-3'>
              <div className='flex items-center gap-3'>
                <Button
                  type="text"
                  icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                  onClick={() => setCollapsed(!collapsed)}
                  aria-label="Toggle sidebar"
                  style={{
                    fontSize: '16px',
                    width: 42,
                    height: 42,
                  }}
                />
                <div className='h-7 w-px bg-slate-200' />
                <div className='leading-tight'>
                  <p className='text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500'>Admin Workspace</p>
                  <p className='text-sm font-semibold text-slate-800'>{header ?? pageTitle}</p>
                </div>
              </div>
              <div className='flex items-center'>
                <Dropdown
                  trigger={['click']}
                  menu={{
                    items: [
                      {
                        key: 'logout',
                        danger: true,
                        icon: <LogOut size={14} />,
                        label: 'Logout',
                        onClick: handleLogout,
                      },
                    ],
                  }}
                >
                  <button
                    type='button'
                    className='inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm text-slate-700 hover:bg-slate-50'
                    title={fullName}
                  >
                    <Avatar size="small" style={{ backgroundColor: '#1d4ed8' }}>{userInitials || 'AD'}</Avatar>
                    <span className='max-w-[140px] truncate font-medium lg:max-w-[190px]'>{compactName}</span>
                    <DownOutlined className='text-xs text-slate-500' />
                  </button>
                </Dropdown>
              </div>

            </div>
          </Header>
          <Content
            style={{
              margin: 0,
              padding: 0,
              height: 'calc(100vh - 64px)', // 100vh',
              background: "#dce6ec",
              overflow: 'auto',
              borderRadius: 0,
            }}
          >
            <main className='py-4'>{children}</main>
          </Content>
        </Layout>
      </Layout>
    </>


  );
}
