import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { ArrowLeft, Plus, Loader2, Pencil, Trash2, Lock } from 'lucide-react';

// 所有可分配的权限
const ALL_PERMISSIONS = [
  { key: 'user:list', label: '用户列表' },
  { key: 'user:create', label: '创建用户' },
  { key: 'user:edit', label: '编辑用户' },
  { key: 'user:disable', label: '禁用用户' },
  { key: 'user:assign', label: '分配角色' },
  { key: 'role:list', label: '角色列表' },
  { key: 'role:create', label: '创建角色' },
  { key: 'role:edit', label: '编辑角色' },
  { key: 'role:delete', label: '删除角色' },
];

interface Role {
  id: number;
  name: string;
  permissions: string[];
  is_preset: number;
  created_at: string;
}

export default function RoleList() {
  const navigate = useNavigate();
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  // 创建/编辑弹窗
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Role | null>(null);
  const [saving, setSaving] = useState(false);
  const [formName, setFormName] = useState('');
  const [formPerms, setFormPerms] = useState<string[]>([]);

  const fetchRoles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/admin/roles');
      setRoles(res.data.data);
    } catch {
      toast.error('获取角色列表失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  // 打开创建弹窗
  const openCreate = () => {
    setEditing(null);
    setFormName('');
    setFormPerms([]);
    setDialogOpen(true);
  };

  // 打开编辑弹窗
  const openEdit = (role: Role) => {
    setEditing(role);
    setFormName(role.name);
    setFormPerms([...role.permissions]);
    setDialogOpen(true);
  };

  // 切换权限
  const togglePerm = (key: string) => {
    setFormPerms((prev) =>
      prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]
    );
  };

  // 保存
  const handleSave = async () => {
    if (!formName.trim()) {
      toast.error('角色名不能为空');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/api/admin/roles/${editing.id}`, {
          name: formName.trim(),
          permissions: formPerms,
        });
        toast.success('角色已更新');
      } else {
        await api.post('/api/admin/roles', {
          name: formName.trim(),
          permissions: formPerms,
        });
        toast.success('角色创建成功');
      }
      setDialogOpen(false);
      fetchRoles();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || '操作失败';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  // 删除
  const handleDelete = async (role: Role) => {
    if (!confirm(`确定删除角色「${role.name}」？`)) return;
    try {
      await api.delete(`/api/admin/roles/${role.id}`);
      toast.success('角色已删除');
      fetchRoles();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || '删除失败';
      toast.error(msg);
    }
  };

  return (
    <div>
      <title>角色管理 - 管理后台</title>

      <Button variant="ghost" size="sm" onClick={() => navigate('/admin')} className="mb-4 -ml-2">
        <ArrowLeft className="mr-1.5 h-4 w-4" />
        返回管理后台
      </Button>

      <div className="rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">角色管理</h2>
            <p className="text-sm text-muted-foreground">共 {roles.length} 个角色</p>
          </div>
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-1.5 h-4 w-4" />
            创建角色
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
                <TableHead>角色名</TableHead>
                <TableHead>权限</TableHead>
                <TableHead>类型</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.map((role) => (
                <TableRow key={role.id} className="transition-colors duration-150">
                  <TableCell className="font-mono text-xs text-muted-foreground">#{role.id}</TableCell>
                  <TableCell className="font-medium">{role.name}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {role.permissions.includes('*') ? (
                        <Badge variant="default">全部权限</Badge>
                      ) : role.permissions.length === 0 ? (
                        <span className="text-xs text-muted-foreground">无权限</span>
                      ) : (
                        role.permissions.map((p) => (
                          <Badge key={p} variant="outline" className="text-xs">{p}</Badge>
                        ))
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {role.is_preset ? (
                      <Badge variant="secondary">
                        <Lock className="mr-1 h-3 w-3" />预设
                      </Badge>
                    ) : (
                      <Badge variant="outline">自定义</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEdit(role)}>
                        <Pencil className="mr-1 h-3.5 w-3.5" />
                        编辑
                      </Button>
                      {!role.is_preset && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(role)}
                        >
                          <Trash2 className="mr-1 h-3.5 w-3.5" />
                          删除
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* 创建/编辑角色 Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? '编辑角色' : '创建新角色'}</DialogTitle>
            <DialogDescription>
              {editing ? '修改角色名称和权限配置。' : '设置角色名称并选择权限。'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>角色名称</Label>
              <Input
                placeholder="例如：编辑主管"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>权限配置</Label>
              <div className="grid grid-cols-3 gap-2 rounded-lg border border-border p-3">
                {ALL_PERMISSIONS.map((p) => (
                  <label
                    key={p.key}
                    className="flex items-center gap-2 cursor-pointer rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted"
                  >
                    <input
                      type="checkbox"
                      checked={formPerms.includes(p.key)}
                      onChange={() => togglePerm(p.key)}
                      className="h-4 w-4 rounded border-border accent-primary"
                    />
                    {p.label}
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {editing ? '保存' : '创建'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
