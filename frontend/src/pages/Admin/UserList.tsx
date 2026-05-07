import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { ArrowLeft, Plus, Loader2, UserCog, Ban, CheckCircle, Trash2 } from 'lucide-react';

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

      <Button variant="ghost" size="sm" onClick={() => navigate('/admin')} className="mb-4 -ml-2">
        <ArrowLeft className="mr-1.5 h-4 w-4" />
        返回管理后台
      </Button>

      <div className="rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">用户管理</h2>
            <p className="text-sm text-muted-foreground">共 {users.length} 个用户</p>
          </div>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            创建用户
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">ID</TableHead>
                <TableHead>用户名</TableHead>
                <TableHead>姓名</TableHead>
                <TableHead>类型</TableHead>
                <TableHead>角色</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id} className="transition-colors duration-150">
                  <TableCell className="font-mono text-xs text-muted-foreground">#{u.id}</TableCell>
                  <TableCell className="font-medium">{u.username}</TableCell>
                  <TableCell>{u.name}</TableCell>
                  <TableCell>
                    <Badge variant={u.user_type === 'A' ? 'default' : 'secondary'}>
                      {u.user_type} 端
                    </Badge>
                  </TableCell>
                  <TableCell>{u.role_name || <span className="text-muted-foreground">未分配</span>}</TableCell>
                  <TableCell>
                    {u.status === 1 ? (
                      <Badge variant="outline" className="text-green-600 border-green-200">
                        <CheckCircle className="mr-1 h-3 w-3" />正常
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-red-500 border-red-200">
                        <Ban className="mr-1 h-3 w-3" />禁用
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setAssignUserId(u.id);
                          setAssignRoleId(u.role_id?.toString() || '');
                          setAssignOpen(true);
                        }}
                      >
                        <UserCog className="mr-1 h-3.5 w-3.5" />
                        角色
                      </Button>
                      <Switch
                        checked={u.status === 1}
                        onCheckedChange={() => handleToggleStatus(u.id)}
                        aria-label="启用/禁用"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => {
                          setDeleteTarget(u);
                          setDeleteOpen(true);
                        }}
                      >
                        <Trash2 className="mr-1 h-3.5 w-3.5" />
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

      {/* 创建用户 Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>创建新用户</DialogTitle>
            <DialogDescription>填写用户信息，创建后用户即可登录系统。</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>用户名</Label>
              <Input
                placeholder="英文字母/数字"
                value={newUser.username}
                onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>密码</Label>
              <Input
                type="password"
                placeholder="至少 6 位"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>姓名</Label>
              <Input
                placeholder="显示名称"
                value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>用户类型</Label>
              <Select value={newUser.userType} onValueChange={(v) => setNewUser({ ...newUser, userType: v as 'A' | 'B' })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">A 端（下单方）</SelectItem>
                  <SelectItem value="B">B 端（接单方）</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>角色 <span className="text-muted-foreground">（可选）</span></Label>
              <Select value={newUser.roleId} onValueChange={(v) => setNewUser({ ...newUser, roleId: v })}>
                <SelectTrigger><SelectValue placeholder="选择角色..." /></SelectTrigger>
                <SelectContent>
                  {roles.map((r) => (
                    <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>取消</Button>
            <Button onClick={handleCreate} disabled={creating}>
              {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              创建
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 分配角色 Dialog */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>分配角色</DialogTitle>
            <DialogDescription>
              为用户 #{assignUserId} 分配角色
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Select value={assignRoleId} onValueChange={setAssignRoleId}>
              <SelectTrigger><SelectValue placeholder="选择角色..." /></SelectTrigger>
              <SelectContent>
                {roles.map((r) => (
                  <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignOpen(false)}>取消</Button>
            <Button onClick={handleAssignRole} disabled={assigning || !assignRoleId}>
              {assigning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              确认分配
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除用户确认 Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-red-600">删除用户</DialogTitle>
            <DialogDescription>
              确定要删除用户 <strong>{deleteTarget?.username}</strong>（{deleteTarget?.name}）吗？
              <br />
              <span className="text-red-500 font-medium">此操作不可恢复。</span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>取消</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              确认删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
