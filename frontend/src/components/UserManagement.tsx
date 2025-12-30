/**
 * Componente para Gestión de Usuarios (Extraído de Users.tsx)
 */
import { useEffect, useState, useRef, useMemo } from 'react';
import Handsontable from 'handsontable';
import 'handsontable/dist/handsontable.full.min.css';
import { toast } from 'react-toastify';
import api from '../services/api';
import { getActionRenderer } from '../utils/handsontableUtils';

interface User {
    id: string;
    username: string;
    email: string;
    is_active: boolean;
    is_admin: boolean;
    created_at: string;
}

export default function UserManagement() {
    const hotTableRef = useRef<HTMLDivElement>(null);
    const hotInstance = useRef<Handsontable | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        is_admin: false
    });

    const stats = {
        total: users.length,
        admins: users.filter(u => u.is_admin).length,
        regulars: users.filter(u => !u.is_admin).length
    };

    useEffect(() => {
        loadUsers();
    }, []);

    // Memoized table data
    const tableData = useMemo(() => users, [users]);

    // Ref to avoid stale closures in event listeners
    const usersRef = useRef(users);
    useEffect(() => {
        usersRef.current = users;
    }, [users]);

    const initializeHandsontable = () => {
        if (!hotTableRef.current) return;

        if (hotInstance.current) {
            hotInstance.current.destroy();
        }

        hotInstance.current = new Handsontable(hotTableRef.current, {
            data: tableData,
            licenseKey: 'non-commercial-and-evaluation',
            width: '100%',
            height: '100%',
            colHeaders: ['Usuario', 'Email', 'Admin', 'Creado', 'Acciones'],
            columns: [
                { data: 'username', readOnly: true, width: 150, className: 'htLeft' },
                { data: 'email', readOnly: true, width: 250, className: 'htLeft' },
                {
                    data: 'is_admin',
                    readOnly: true,
                    width: 100,
                    className: 'htCenter',
                    renderer: function (_instance: any, td: HTMLTableCellElement, _row: number, _col: number, _prop: any, value: any) {
                        td.textContent = value ? 'Sí' : 'No';
                        td.style.textAlign = 'center';
                        return td;
                    }
                },
                {
                    data: 'created_at',
                    readOnly: true,
                    width: 150,
                    className: 'htRight',
                    renderer: function (_instance: any, td: HTMLTableCellElement, _row: number, _col: number, _prop: any, value: any) {
                        if (value) {
                            td.textContent = new Date(value).toLocaleDateString(undefined, { day: '2-digit', month: '2-digit', year: '2-digit' });
                        } else {
                            td.textContent = '';
                        }
                        td.style.textAlign = 'right';
                        return td;
                    }
                },
                {
                    data: 'id',
                    readOnly: true,
                    width: 120,
                    className: 'htCenter htMiddle',
                    renderer: getActionRenderer([
                        { name: 'edit', tooltip: 'Editar Usuario' },
                        { name: 'delete', tooltip: 'Eliminar Usuario' }
                    ])
                }
            ],
            rowHeaders: true,
            stretchH: 'all',
            filters: true,
            dropdownMenu: ['filter_by_condition', 'filter_by_value', 'filter_action_bar'],
            columnSorting: true,
            manualColumnResize: true,
            wordWrap: false,
            rowHeights: 28
        });
    };

    // Dedicated effect for the click event listener
    useEffect(() => {
        const tableElement = hotTableRef.current;
        if (!tableElement) return;

        const handleTableClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const btn = target.closest('button');
            if (!btn) return;

            const action = btn.dataset.action;
            if (!action) return;

            const td = target.closest('td');
            if (!td) return;

            const coords = hotInstance.current?.getCoords(td as HTMLTableCellElement);
            if (!coords || coords.row < 0) return;

            const userId = hotInstance.current?.getDataAtRowProp(coords.row, 'id');
            if (!userId) return;

            const user = usersRef.current.find(u => u.id === userId);
            if (!user) return;

            if (action === 'edit') {
                handleEdit(user);
            } else if (action === 'delete') {
                handleDelete(userId);
            }
        };

        tableElement.addEventListener('click', handleTableClick);
        return () => tableElement.removeEventListener('click', handleTableClick);
    }, []);

    // Effect for initializing and updating data
    useEffect(() => {
        if (!hotInstance.current) {
            initializeHandsontable();
        } else {
            hotInstance.current.loadData(tableData);
        }
    }, [tableData]);

    // Cleanup
    useEffect(() => {
        return () => {
            if (hotInstance.current) {
                hotInstance.current.destroy();
                hotInstance.current = null;
            }
        };
    }, []);

    const loadUsers = async () => {
        try {
            const response = await api.get('/users');
            setUsers(response.data);
        } catch (error) {
            console.error('Error loading users:', error);
            toast.error('Error al cargar los usuarios.');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editMode && selectedUser) {
                const updateData: any = {
                    email: formData.email,
                    is_active: selectedUser.is_active,
                    is_admin: formData.is_admin
                };
                if (formData.password) {
                    updateData.password = formData.password;
                }
                await api.patch(`/users/${selectedUser.id}`, updateData);
                toast.success('Usuario actualizado correctamente');
            } else {
                await api.post('/admin/users', formData);
                toast.success('Usuario creado correctamente');
            }
            setShowForm(false);
            setEditMode(false);
            setSelectedUser(null);
            setFormData({ username: '', email: '', password: '', is_admin: false });
            loadUsers();
        } catch (error) {
            console.error('Error saving user:', error);
            toast.error(editMode ? 'Error al actualizar usuario.' : 'Error al crear usuario.');
        }
    };

    const handleEdit = (user: User) => {
        setSelectedUser(user);
        setEditMode(true);
        setFormData({
            username: user.username,
            email: user.email,
            password: '',
            is_admin: user.is_admin
        });
        setShowForm(true);
    };

    const handleDelete = async (userId: string) => {
        if (!confirm('¿Estás seguro de eliminar este usuario?')) return;

        try {
            await api.delete(`/admin/users/${userId}`);
            toast.success('Usuario eliminado correctamente');
            loadUsers();
        } catch (error) {
            console.error('Error deleting user:', error);
            toast.error('Error al eliminar usuario.');
        }
    };

    return (
        <div className="space-y-4 flex flex-col h-full overflow-hidden">
            {/* Action Bar */}
            <div className="flex justify-between items-center bg-dark-bg/40 p-3 rounded-lg border border-dark-border flex-none">
                <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                        <span className="text-[10px] text-dark-muted font-bold uppercase tracking-widest">Total</span>
                        <span className="text-sm font-bold text-white">{stats.total}</span>
                    </div>
                    <div className="w-px h-6 bg-dark-border"></div>
                    <div className="flex flex-col">
                        <span className="text-[10px] text-dark-muted font-bold uppercase tracking-widest">Admins</span>
                        <span className="text-sm font-bold text-primary-light">{stats.admins}</span>
                    </div>
                </div>
                {!showForm && (
                    <button
                        onClick={() => setShowForm(true)}
                        className="bg-primary hover:bg-primary-dark text-white px-4 py-1 rounded text-xs transition-colors font-bold uppercase"
                    >
                        + Nuevo Usuario
                    </button>
                )}
            </div>

            {showForm && (
                <div className="bg-dark-surface/50 p-4 rounded-xl border border-dark-border flex-none animate-in fade-in slide-in-from-top-2">
                    <h2 className="text-[11px] font-bold mb-4 text-white uppercase tracking-widest flex items-center gap-2">
                        {editMode ? '✏️ Editar Usuario' : '🆕 Nuevo Usuario'}
                    </h2>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
                        <div>
                            <label className="block text-[10px] uppercase font-bold text-dark-muted mb-1">Usuario *</label>
                            <input
                                type="text"
                                value={formData.username}
                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                className="w-full px-2 py-1.5 bg-dark-bg border border-dark-border rounded-lg text-xs text-white focus:outline-none focus:border-primary transition-all"
                                required
                                disabled={editMode}
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] uppercase font-bold text-dark-muted mb-1">Email *</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full px-2 py-1.5 bg-dark-bg border border-dark-border rounded-lg text-xs text-white focus:outline-none focus:border-primary transition-all"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] uppercase font-bold text-dark-muted mb-1">
                                Contraseña {editMode ? '(vacía = igual)' : '*'}
                            </label>
                            <input
                                type="password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                className="w-full px-2 py-1.5 bg-dark-bg border border-dark-border rounded-lg text-xs text-white focus:outline-none focus:border-primary transition-all"
                                required={!editMode}
                                minLength={8}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="flex items-center space-x-2 cursor-pointer p-1.5 border border-dark-border rounded-lg bg-dark-bg/50 flex-1">
                                <input
                                    type="checkbox"
                                    checked={formData.is_admin}
                                    onChange={(e) => setFormData({ ...formData, is_admin: e.target.checked })}
                                    className="w-3.5 h-3.5 rounded border-dark-border bg-dark-bg text-primary"
                                />
                                <span className="text-[11px] text-dark-text font-bold uppercase tracking-tighter">Admin</span>
                            </label>
                            <div className="flex gap-1.5">
                                <button type="submit" className="bg-primary hover:bg-primary-dark text-white px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all">
                                    {editMode ? 'OK' : 'Crear'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowForm(false);
                                        setEditMode(false);
                                        setSelectedUser(null);
                                        setFormData({ username: '', email: '', password: '', is_admin: false });
                                    }}
                                    className="bg-dark-bg border border-dark-border hover:bg-dark-border/50 text-dark-muted hover:text-white px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all"
                                >
                                    X
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            )}

            {/* Table Area */}
            <div className="flex-1 min-h-[400px] border border-dark-border rounded-xl overflow-hidden bg-dark-surface/20">
                <div ref={hotTableRef} className="handsontable-dark h-full"></div>
            </div>
        </div>
    );
}
