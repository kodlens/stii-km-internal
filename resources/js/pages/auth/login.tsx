import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { LockOutlined, LoginOutlined, UserOutlined } from '@ant-design/icons';
import { Button, ConfigProvider, Form, Input } from 'antd';
import { BookOpenCheck, ShieldCheck } from 'lucide-react';

type LoginErrors = Record<string, string[]>;

export default function Login() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<LoginErrors>({});

  const submit = (values: Record<string, string>) => {
    setLoading(true);
    setErrors({});

    router.post('/login', values, {
      onError: (pageErrors) => {
        const mappedErrors: LoginErrors = {};

        for (const [key, value] of Object.entries(pageErrors)) {
          mappedErrors[key] = Array.isArray(value) ? value : [String(value)];
        }

        setErrors(mappedErrors);
      },
      onFinish: () => {
        setLoading(false);
      },
    });
  };

  return (
    <>
      <Head title="Login" />

      <main className="relative flex min-h-screen overflow-hidden bg-[#0D4E86] text-white">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,#0D4E86_0%,#0B4273_52%,#07325A_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_22%,rgba(255,255,255,0.18),transparent_28%),radial-gradient(circle_at_84%_78%,rgba(125,211,252,0.16),transparent_30%)]" />

        <section className="relative z-10 mx-auto grid w-full max-w-7xl items-center gap-10 px-5 py-8 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:px-10">
          <div className="hidden lg:block">
            <img src="/img/app-logo-black-update.png" width={280} alt="dost-stii logo" />

            <div className="mt-16 max-w-xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-sky-100 backdrop-blur">
                <BookOpenCheck size={15} />
                Knowledge Management Internal
              </div>
              <h1 className="text-5xl font-bold leading-tight text-white">
                Secure access to trusted knowledge.
              </h1>
              <p className="mt-5 text-base leading-7 text-sky-100/85">
                Sign in to search published materials, manage internal references, and continue your knowledge workflow.
              </p>

              <div className="mt-8 grid max-w-lg gap-3 sm:grid-cols-2">
                {['Authenticated access', 'Managed resources'].map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-2 rounded-lg border border-white/15 bg-white/10 px-4 py-3 text-sm font-medium text-sky-50 backdrop-blur"
                  >
                    <ShieldCheck size={16} className="text-sky-200" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mx-auto w-full max-w-md">
            <div className="mb-8 flex justify-center lg:hidden">
              <img src="/img/app-logo-black-update.png" width={250} alt="dost-stii logo" />
            </div>

            <div className="rounded-2xl border border-white/20 bg-white p-8 text-slate-900 shadow-2xl shadow-slate-950/25">
              <div className="mb-7 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-[#0D4E86]/10 text-[#0D4E86]">
                  <LockOutlined className="text-xl" />
                </div>
                <h2 className="text-2xl font-bold text-slate-950">Welcome back</h2>
                <p className="mt-2 text-sm text-slate-500">
                  Sign in to continue to the Knowledge Hub.
                </p>
              </div>

              <ConfigProvider
                theme={{
                  token: {
                    colorPrimary: '#0D4E86',
                    borderRadius: 8,
                    fontFamily: 'Poppins, sans-serif',
                  },
                }}
              >
                <Form form={form} layout="vertical" onFinish={submit} autoComplete="off">
                  <Form.Item
                    label="Username"
                    name="username"
                    validateStatus={errors?.username ? 'error' : ''}
                    help={errors?.username?.[0]}
                  >
                    <Input
                      size="large"
                      placeholder="Enter your username"
                      prefix={<UserOutlined className="text-slate-400" />}
                    />
                  </Form.Item>

                  <Form.Item
                    label="Password"
                    name="password"
                    validateStatus={errors?.password ? 'error' : ''}
                    help={errors?.password?.[0]}
                  >
                    <Input.Password
                      size="large"
                      placeholder="Enter your password"
                      prefix={<LockOutlined className="text-slate-400" />}
                    />
                  </Form.Item>

                  <Button
                    htmlType="submit"
                    type="primary"
                    size="large"
                    loading={loading}
                    block
                    icon={<LoginOutlined />}
                    className="mt-2 !h-11 !font-semibold"
                  >
                    Sign In
                  </Button>
                </Form>
              </ConfigProvider>

              <div className="mt-7 border-t border-slate-200 pt-5 text-center text-xs text-slate-500">
                © {new Date().getFullYear()} DOST-STII Knowledge Management Internal
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
