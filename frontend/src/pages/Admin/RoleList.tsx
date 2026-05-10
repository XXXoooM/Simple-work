import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { 
  Button, Chip, Input, Checkbox, 
  Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Spinner
} from '@heroui/react';
import { toast } from 'sonner';
import { ArrowLeft, Plus, Pencil, Trash2, Lock } from 'lucide-react';

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
  const togglePerm = (key: string, isSelected: boolean) => {
    if (isSelected) {
      setFormPerms((prev) => [...prev, key]);
    } else {
      setFormPerms((prev) => prev.filter((p) => p !== key));
    }
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

      <Button variant="light" size="sm" onPress={() => navigate('/admin')} className="mb-4 -ml-2 text-default-600" startContent={<ArrowLeft className="h-4 w-4" />}>
        返回管理后台
      </Button>

      <div className="rounded-xl border border-divider bg-content1 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b border-divider px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">角色管理</h2>
            <p className="text-sm text-default-500">共 {roles.length} 个角色</p>
          </div>
          <Button size="sm" color="primary" onPress={openCreate} startContent={<Plus className="h-4 w-4" />}>
            创建角色
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Spinner size="lg" color="primary" />
          </div>
        ) : (
          <Table removeWrapper aria-label="角色列表">
            <TableHeader>
              <TableColumn>ID</TableColumn>
              <TableColumn>角色名</TableColumn>
              <TableColumn>权限</TableColumn>
              <TableColumn>类型</TableColumn>
              <TableColumn align="end">操作</TableColumn>
            </TableHeader>
            <TableBody>
              {roles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell className="font-mono text-xs text-default-400">#{role.id}</TableCell>
                  <TableCell className="font-medium">{role.name}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {role.permissions.includes('*') ? (
                        <Chip size="sm" color="primary" variant="flat">全部权限</Chip>
                      ) : role.permissions.length === 0 ? (
                        <span className="text-xs text-default-400">无权限</span>
                      ) : (
                        role.permissions.map((p) => (
                          <Chip key={p} size="sm" variant="flat" className="text-xs">{p}</Chip>
                        ))
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {role.is_preset ? (
                      <Chip size="sm" variant="flat" color="secondary" startContent={<Lock className="h-3 w-3" />}>
                        预设
                      </Chip>
                    ) : (
                      <Chip size="sm" variant="flat">自定义</Chip>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="flat" size="sm" onPress={() => openEdit(role)} startContent={<Pencil className="h-3.5 w-3.5" />}>
                        编辑
                      </Button>
                      {!role.is_preset && (
                        <Button
                          variant="flat"
                          color="danger"
                          size="sm"
                          onPress={() => handleDelete(role)}
                          startContent={<Trash2 className="h-3.5 w-3.5" />}
                        >
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

      {/* 创建/编辑角色 Modal */}
      <Modal isOpen={dialogOpen} onOpenChange={setDialogOpen} size="2xl">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                {editing ? '编辑角色' : '创建新角色'}
                <span className="text-sm font-normal text-default-500">
                  {editing ? '修改角色名称和权限配置。' : '设置角色名称并选择权限。'}
                </span>
              </ModalHeader>
              <ModalBody>
                <div className="space-y-6 py-2">
                  <Input
                    label="角色名称"
                    labelPlacement="outside"
                    placeholder="例如：编辑主管"
                    value={formName}
                    onValueChange={setFormName}
                    variant="bordered"
                  />
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-3">权限配置</label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 rounded-lg border border-divider p-4">
                      {ALL_PERMISSIONS.map((p) => (
                        <Checkbox
                          key={p.key}
                          isSelected={formPerms.includes(p.key)}
                          onValueChange={(isSelected) => togglePerm(p.key, isSelected)}
                          size="sm"
                        >
                          {p.label}
                        </Checkbox>
                      ))}
                    </div>
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>取消</Button>
                <Button color="primary" onPress={handleSave} isLoading={saving}>
                  {saving ? '保存中' : (editing ? '保存' : '创建')}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
