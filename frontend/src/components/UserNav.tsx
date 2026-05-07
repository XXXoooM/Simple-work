import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, KeyRound, Loader2, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/authStore';
import api from '@/lib/api';

export default function UserNav() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passwords, setPasswords] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleChangePassword = async () => {
    if (!passwords.oldPassword || !passwords.newPassword || !passwords.confirmPassword) {
      return toast.error('请填写完整信息');
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      return toast.error('两次输入的新密码不一致');
    }
    if (passwords.newPassword.length < 6) {
      return toast.error('新密码长度不能少于 6 位');
    }

    setLoading(true);
    try {
      const res = await api.post('/api/auth/change-password', {
        oldPassword: passwords.oldPassword,
        newPassword: passwords.newPassword,
      });
      toast.success(res.data.message || '密码修改成功，请重新登录');
      setPasswordOpen(false);
      setPasswords({ oldPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(handleLogout, 1500); // 改密成功后跳转登录
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || '修改失败';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative flex items-center gap-2 pl-2 pr-3 hover:bg-accent hover:text-accent-foreground">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10">
              <User className="h-4 w-4 text-primary" />
            </div>
            <span className="text-sm font-medium">{user?.name}</span>
            <ChevronDown className="h-4 w-4 text-muted-foreground opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{user?.name}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {user?.username}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem
              onClick={() => {
                setOpen(false);
                setPasswordOpen(true);
              }}
              className="cursor-pointer"
            >
              <KeyRound className="mr-2 h-4 w-4" />
              <span>修改密码</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer focus:text-red-600 focus:bg-red-50">
            <LogOut className="mr-2 h-4 w-4" />
            <span>退出登录</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={passwordOpen} onOpenChange={(v) => { if (!v) setPasswordOpen(false); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>修改密码</DialogTitle>
            <DialogDescription>
              请输入您的旧密码以验证身份，并设置新密码。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>旧密码</Label>
              <Input
                type="password"
                placeholder="请输入当前密码"
                value={passwords.oldPassword}
                onChange={(e) => setPasswords({ ...passwords, oldPassword: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>新密码</Label>
              <Input
                type="password"
                placeholder="请输入新密码（至少 6 位）"
                value={passwords.newPassword}
                onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>确认新密码</Label>
              <Input
                type="password"
                placeholder="请再次输入新密码"
                value={passwords.confirmPassword}
                onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPasswordOpen(false)}>
              取消
            </Button>
            <Button onClick={handleChangePassword} disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              确认修改
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
