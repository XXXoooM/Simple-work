import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, KeyRound, ChevronDown } from 'lucide-react';
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
} from '@heroui/react';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/authStore';
import api from '@/lib/api';

export default function UserNav() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
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
      <Dropdown placement="bottom-end">
        <DropdownTrigger>
          <Button variant="light" className="relative flex items-center gap-2 px-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10">
              <User className="h-4 w-4 text-primary" />
            </div>
            <span className="text-sm font-medium">{user?.name}</span>
            <ChevronDown className="h-4 w-4 text-default-400" />
          </Button>
        </DropdownTrigger>
        <DropdownMenu aria-label="User Actions" variant="flat">
          <DropdownItem key="profile" className="h-14 gap-2" textValue="Profile">
            <p className="font-semibold">{user?.name}</p>
            <p className="text-xs text-default-500">{user?.username}</p>
          </DropdownItem>
          <DropdownItem
            key="password"
            startContent={<KeyRound className="h-4 w-4" />}
            onPress={() => setPasswordOpen(true)}
          >
            修改密码
          </DropdownItem>
          <DropdownItem
            key="logout"
            color="danger"
            startContent={<LogOut className="h-4 w-4" />}
            onPress={handleLogout}
          >
            退出登录
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>

      <Modal isOpen={passwordOpen} onOpenChange={setPasswordOpen} placement="center">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">修改密码</ModalHeader>
              <ModalBody>
                <p className="text-sm text-default-500 mb-4">
                  请输入您的旧密码以验证身份，并设置新密码。
                </p>
                <Input
                  type="password"
                  label="旧密码"
                  placeholder="请输入当前密码"
                  variant="bordered"
                  value={passwords.oldPassword}
                  onValueChange={(val) => setPasswords({ ...passwords, oldPassword: val })}
                />
                <Input
                  type="password"
                  label="新密码"
                  placeholder="请输入新密码（至少 6 位）"
                  variant="bordered"
                  value={passwords.newPassword}
                  onValueChange={(val) => setPasswords({ ...passwords, newPassword: val })}
                />
                <Input
                  type="password"
                  label="确认新密码"
                  placeholder="请再次输入新密码"
                  variant="bordered"
                  value={passwords.confirmPassword}
                  onValueChange={(val) => setPasswords({ ...passwords, confirmPassword: val })}
                />
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  取消
                </Button>
                <Button color="primary" onPress={handleChangePassword} isLoading={loading}>
                  确认修改
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
