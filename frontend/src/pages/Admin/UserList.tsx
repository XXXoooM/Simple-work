import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { 
  Button, Chip, Input, Switch, Select, SelectItem, 
  Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Spinner
} from '@heroui/react';
import { toast } from 'sonner';
import { ArrowLeft, Plus, UserCog, Ban, CheckCircle, Trash2 } from 'lucide-react';

interface User {
  id: number;
  username: string;
  name: string;
  user_type: 'A' | 'B';
  role_id: number | null;
  role_name: string | null;
  status: number;
  created_at: string;
}

interface Role {
  id: number;
  name: string;
}

export default function UserList() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  // 创建用户弹窗
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '', password: '', name: '', userType: 'B' as 'A' | 'B', roleId: '',
  });

  // 分配角色弹窗
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignUserId, setAssignUserId] = useState<number | null>(null);
  const [assignRoleId, setAssignRoleId] = useState('');
  const [assigning, setAssigning] = useState(false);

  // 删除用户弹窗
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [usersRes, rolesRes] = await Promise.all([
        api.get('/api/admin/users'),
        api.get('/api/admin/roles'),
      ]);
      setUsers(usersRes.data.data);
      setRoles(rolesRes.data.data);
    } catch {
      toast.error('获取数据失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 创建用户
  const handleCreate = async () => {
    if (!newUser.username.trim() || !newUser.password || !newUser.name.trim()) {
      toast.error('请填写完整信息');
      return;
    }
    setCreating(true);
    try {
      await api.post('/api/admin/users', {
        username: newUser.username.trim(),
        password: newUser.password,
        name: newUser.name.trim(),
        userType: newUser.userType,
        roleId: newUser.roleId ? parseInt(newUser.roleId) : undefined,
      });
      toast.success('用户创建成功');
      setCreateOpen(false);
      setNewUser({ username: '', password: '', name: '', userType: 'B', roleId: '' });
      fetchData();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || '创建失败';
      toast.error(msg);
    } finally {
      setCreating(false);
    }
  };

  // 禁用/启用用户
  const handleToggleStatus = async (userId: number) => {
    try {
      const res = await api.put(`/api/admin/users/${userId}/disable`);
      toast.success(res.data.message);
      fetchData();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || '操作失败';
      toast.error(msg);
    }
  };

  // 分配角色
  const handleAssignRole = async () => {
    if (!assignUserId || !assignRoleId) return;
    setAssigning(true);
    try {
      const res = await api.put(`/api/admin/users/${assignUserId}/role`, {
        roleId: parseInt(assignRoleId),
      });
      toast.success(res.data.message);
      setAssignOpen(false);
      fetchData();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || '分配失败';
      toast.error(msg);
    } finally {
      setAssigning(false);
    }
  };

  // 删除用户
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await api.delete(`/api/admin/users/${deleteTarget.id}`);
      toast.success(res.data.message);
      setDeleteOpen(false);
      setDeleteTarget(null);
      fetchData();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || '删除失败';
      toast.error(msg);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <title>用户管理 - 管理后台</title>

      <Button variant="light" size="sm" onPress={() => navigate('/admin')} className="mb-4 -ml-2 text-default-600" startContent={<ArrowLeft className="h-4 w-4" />}>
        返回管理后台
      </Button>

      <div className="rounded-xl border border-divider bg-content1 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b border-divider px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">用户管理</h2>
            <p className="text-sm text-default-500">共 {users.length} 个用户</p>
          </div>
          <Button size="sm" color="primary" onPress={() => setCreateOpen(true)} startContent={<Plus className="h-4 w-4" />}>
            创建用户
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Spinner size="lg" color="primary" />
          </div>
        ) : (
          <Table removeWrapper aria-label="用户列表">
            <TableHeader>
              <TableColumn>ID</TableColumn>
              <TableColumn>用户名</TableColumn>
              <TableColumn>姓名</TableColumn>
              <TableColumn>类型</TableColumn>
              <TableColumn>角色</TableColumn>
              <TableColumn>状态</TableColumn>
              <TableColumn align="end">操作</TableColumn>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-mono text-xs text-default-400">#{u.id}</TableCell>
                  <TableCell className="font-medium">{u.username}</TableCell>
                  <TableCell>{u.name}</TableCell>
                  <TableCell>
                    <Chip size="sm" variant="flat" color={u.user_type === 'A' ? 'primary' : 'secondary'}>
                      {u.user_type} 端
                    </Chip>
                  </TableCell>
                  <TableCell>{u.role_name || <span className="text-default-400">未分配</span>}</TableCell>
                  <TableCell>
                    {u.status === 1 ? (
                      <Chip size="sm" variant="flat" color="success" startContent={<CheckCircle className="h-3 w-3" />}>
                        正常
                      </Chip>
                    ) : (
                      <Chip size="sm" variant="flat" color="danger" startContent={<Ban className="h-3 w-3" />}>
                        禁用
                      </Chip>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="flat"
                        size="sm"
                        onPress={() => {
                          setAssignUserId(u.id);
                          setAssignRoleId(u.role_id?.toString() || '');
                          setAssignOpen(true);
                        }}
                        startContent={<UserCog className="h-3.5 w-3.5" />}
                      >
                        角色
                      </Button>
                      <Switch
                        isSelected={u.status === 1}
                        onValueChange={() => handleToggleStatus(u.id)}
                        size="sm"
                        aria-label="启用/禁用"
                        color="success"
                      />
                      <Button
                        variant="flat"
                        color="danger"
                        size="sm"
                        onPress={() => {
                          setDeleteTarget(u);
                          setDeleteOpen(true);
                        }}
                        startContent={<Trash2 className="h-3.5 w-3.5" />}
                      >
                        删除
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* 创建用户 Modal */}
      <Modal isOpen={createOpen} onOpenChange={setCreateOpen}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                创建新用户
                <span className="text-sm font-normal text-default-500">填写用户信息，创建后用户即可登录系统。</span>
              </ModalHeader>
              <ModalBody>
                <div className="space-y-4 py-2">
                  <Input
                    label="用户名"
                    labelPlacement="outside"
                    placeholder="英文字母/数字"
                    value={newUser.username}
                    onValueChange={(val) => setNewUser({ ...newUser, username: val })}
                    variant="bordered"
                  />
                  <Input
                    type="password"
                    label="密码"
                    labelPlacement="outside"
                    placeholder="至少 6 位"
                    value={newUser.password}
                    onValueChange={(val) => setNewUser({ ...newUser, password: val })}
                    variant="bordered"
                  />
                  <Input
                    label="姓名"
                    labelPlacement="outside"
                    placeholder="显示名称"
                    value={newUser.name}
                    onValueChange={(val) => setNewUser({ ...newUser, name: val })}
                    variant="bordered"
                  />
                  <Select 
                    label="用户类型" 
                    labelPlacement="outside"
                    selectedKeys={[newUser.userType]}
                    onSelectionChange={(keys) => {
                      const selectedKey = Array.from(keys)[0] as 'A' | 'B';
                      setNewUser({ ...newUser, userType: selectedKey });
                    }}
                    variant="bordered"
                  >
                    <SelectItem key="A">A 端（下单方）</SelectItem>
                    <SelectItem key="B">B 端（接单方）</SelectItem>
                  </Select>
                  <Select 
                    label="角色（可选）" 
                    labelPlacement="outside"
                    placeholder="选择角色..."
                    selectedKeys={newUser.roleId ? [newUser.roleId] : []}
                    onSelectionChange={(keys) => {
                      const selectedKey = Array.from(keys)[0] as string;
                      setNewUser({ ...newUser, roleId: selectedKey || '' });
                    }}
                    variant="bordered"
                  >
                    {roles.map((r) => (
                      <SelectItem key={String(r.id)}>{r.name}</SelectItem>
                    ))}
                  </Select>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>取消</Button>
                <Button color="primary" onPress={handleCreate} isLoading={creating}>
                  {creating ? '创建中' : '创建'}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* 分配角色 Modal */}
      <Modal isOpen={assignOpen} onOpenChange={setAssignOpen}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                分配角色
                <span className="text-sm font-normal text-default-500">为用户 #{assignUserId} 分配角色</span>
              </ModalHeader>
              <ModalBody>
                <div className="py-2">
                  <Select 
                    label="选择角色" 
                    placeholder="请选择"
                    selectedKeys={assignRoleId ? [assignRoleId] : []}
                    onSelectionChange={(keys) => {
                      const selectedKey = Array.from(keys)[0] as string;
                      setAssignRoleId(selectedKey || '');
                    }}
                    variant="bordered"
                  >
                    {roles.map((r) => (
                      <SelectItem key={String(r.id)}>{r.name}</SelectItem>
                    ))}
                  </Select>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>取消</Button>
                <Button color="primary" onPress={handleAssignRole} isLoading={assigning} isDisabled={!assignRoleId}>
                  {assigning ? '分配中' : '确认分配'}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* 删除用户确认 Modal */}
      <Modal isOpen={deleteOpen} onOpenChange={setDeleteOpen}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="text-danger">删除用户</ModalHeader>
              <ModalBody>
                <p className="text-default-600">
                  确定要删除用户 <strong className="text-foreground">{deleteTarget?.username}</strong>（{deleteTarget?.name}）吗？
                </p>
                <p className="text-danger font-medium mt-2">此操作不可恢复。</p>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>取消</Button>
                <Button color="danger" onPress={handleDelete} isLoading={deleting}>
                  {deleting ? '删除中' : '确认删除'}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
