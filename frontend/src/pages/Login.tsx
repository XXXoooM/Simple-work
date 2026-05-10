import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { Button, Input, Card, CardBody } from '@heroui/react';
import { LogIn, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      toast.error('请输入用户名和密码');
      return;
    }

    setLoading(true);
    try {
      await login(username, password);
      const user = useAuthStore.getState().user;
      toast.success(`欢迎回来，${user?.name}`);

      // 按 userType 跳转
      if (user?.permissions.includes('*')) {
        navigate('/admin', { replace: true });
      } else if (user?.userType === 'A') {
        navigate('/a', { replace: true });
      } else {
        navigate('/b', { replace: true });
      }
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        '登录失败，请重试';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-50 via-background to-secondary-50">
      <div className="w-full max-w-md px-6">
        {/* Logo 区域 */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            部门协作下单系统
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            请使用管理员分配的账号登录
          </p>
        </div>

        {/* 登录表单 */}
        <Card className="shadow-md">
          <CardBody className="p-8">
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <Input
                label="用户名"
                placeholder="请输入用户名"
                variant="bordered"
                value={username}
                onValueChange={setUsername}
                isRequired
              />

              <Input
                label="密码"
                placeholder="请输入密码"
                variant="bordered"
                value={password}
                onValueChange={setPassword}
                type={showPassword ? "text" : "password"}
                isRequired
                endContent={
                  <button className="focus:outline-none" type="button" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? (
                      <EyeOff className="text-2xl text-default-400 pointer-events-none" />
                    ) : (
                      <Eye className="text-2xl text-default-400 pointer-events-none" />
                    )}
                  </button>
                }
              />

              <Button
                type="submit"
                color="primary"
                size="lg"
                className="mt-2"
                isLoading={loading}
                startContent={!loading && <LogIn className="h-4 w-4" />}
              >
                {loading ? '登录中...' : '登录'}
              </Button>

              <p className="text-center text-xs text-default-400 mt-2">
                本系统无注册功能，请联系管理员创建账号
              </p>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
