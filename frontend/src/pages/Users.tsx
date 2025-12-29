/**
 * Página de Gestión de Usuarios (solo admin)
 */
import { useEffect, useState, useRef } from 'react';
import Handsontable from 'handsontable';
import 'handsontable/dist/handsontable.full.min.css';
import { toast } from 'react-toastify';
import Layout from '../components/Layout';
import api from '../services/api';
import Modal from '../components/Modal';

interface User {
    id: string;
    username: string;
    email: string;
    is_active: boolean;
    is_admin: boolean;
    created_at: string;
}

export default function Users() {
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

    // Inicializar Handsontable
    useEffect(() => {
        if (!hotTableRef.current) return;

        if (hotInstance.current) {
            hotInstance.current.destroy();
        }

        hotInstance.current = new Handsontable(hotTableRef.current, {
            data: users,
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
                    renderer: function(instance: any, td: HTMLTableCellElement, row: number, col: number, prop: any, value: any) {
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
                    renderer: function(instance: any, td: HTMLTableCellElement, row: number, col: number, prop: any, value: any) {
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
                    width: 200,
                    className: 'htCenter htMiddle',
                    renderer: function(instance: any, td: HTMLTableCellElement, row: number, col: number, prop: any, value: any) {
                        td.innerHTML = '';
                        const container = document.createElement('div');
                        container.style.display = 'inline-flex';
                        container.style.gap = '8px';
                        container.style.alignItems = 'center';
                        const editBtn = `<button type="button" class="text-yellow-500 hover:text-yellow-700 text-sm font-medium cursor-pointer" data-action="edit" data-id="${value}">✏️ Editar</button>`;
                        const deleteBtn = `<button type="button" class="text-red-500 hover:text-red-700 text-sm font-medium cursor-pointer" data-action="delete" data-id="${value}">🗑️ Eliminar</button>`;
                        container.innerHTML = `${editBtn}${deleteBtn}`;
                        td.appendChild(container);
                        td.style.textAlign = 'center';
                        return td;
                    }
                }
            ],
            rowHeaders: true,
            stretchH: 'all',
            autoColumnSize: false,
            filters: true,
            dropdownMenu: [
                'filter_by_condition',
                'filter_by_value',
                'filter_action_bar'
            ],
            columnSorting: true,
            manualColumnResize: true,
            wordWrap: false,
            rowHeights: 28
        });

        // Handle clicks on action buttons
        if (hotTableRef.current) {
            hotTableRef.current.addEventListener('click', (e: any) => {
                const target = e.target as HTMLElement;
                const btn = target.closest('button');
                if (!btn) return;

                const action = btn.dataset.action;
                const id = btn.dataset.id;

                if (!id || !action) return;

                const user = users.find(u => u.id === id);
                if (!user) return;

                if (action === 'edit') {
                    handleEdit(user);
                } else if (action === 'delete') {
                    handleDelete(id);
                }
            });
        }

        return () => {
            if (hotInstance.current) {
                hotInstance.current.destroy();
                hotInstance.current = null;
            }
        };
    }, [users]);

    const loadUsers = async () => {
        try {
            const response = await api.get('/users');
            setUsers(response.data);
        } catch (error) {
            console.error('Error loading users:', error);
            toast.error('Error al cargar los usuarios. Por favor, inténtelo de nuevo.');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editMode && selectedUser) {
                // Actualizar usuario existente
                const updateData: any = {
                    email: formData.email,
                    is_active: selectedUser.is_active,
                    is_admin: formData.is_admin
                };
                // Solo enviar password si se ingresó uno nuevo
                if (formData.password) {
                    updateData.password = formData.password;
                }
                await api.patch(`/users/${selectedUser.id}`, updateData);
                toast.success('Usuario actualizado correctamente');
            } else {
                // Crear nuevo usuario
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

    /**
     * Maneja la acción de editar un usuario, precargando el formulario.
     * @param user El objeto de usuario a editar.
     */
    const handleEdit = (user: User) => {
        setSelectedUser(user);
        setEditMode(true);
        setFormData({
            username: user.username,
            email: user.email,
            password: '', // Password is not pre-filled for security
            is_admin: user.is_admin
        });
        setShowForm(true);
    };

    /**
     * Elimina un usuario tras confirmación.
     * @param userId El ID del usuario a eliminar.
     */
    const handleDelete = async (userId: string) => {
        if (!confirm('¿Estás seguro de eliminar este usuario?')) return;

        try {
            await api.delete(`/admin/users/${userId}`);
            toast.success('Usuario eliminado correctamente');
            loadUsers();
        } catch (error) {
            console.error('Error deleting user:', error);
            toast.error('Error al eliminar usuario. Por favor, inténtelo de nuevo.');
        }
    };

    return (
        <Layout>
            <div className="h-full overflow-hidden p-3 bg-dark-bg">
                <div className="space-y-3 max-w-full mx-auto flex flex-col h-full">
                    {/* Header Row: Title & Action inline */}
                    <div className="flex flex-row justify-between items-center bg-dark-surface p-3 rounded-lg border border-dark-border flex-none">
                        <h1 className="text-lg font-bold text-white flex items-center gap-2">
                            👥 Gestión de Usuarios
                        </h1>
                        <button
                            onClick={() => setShowForm(true)}
                            className="bg-primary hover:bg-primary-dark text-white px-4 py-1 rounded text-xs transition-colors font-medium border border-primary"
                        >
                            + Nuevo Usuario
                        </button>
                    </div>

                    {showForm && (
                        <div className="bg-dark-surface p-4 rounded-lg border border-dark-border mb-0 flex-none animate-in fade-in slide-in-from-top-4">
                            <h2 className="text-sm font-bold mb-4 text-white uppercase tracking-wider">{editMode ? 'Editar Usuario' : 'Nuevo Usuario'}</h2>
                            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
                                <div>
                                    <label className="block text-[10px] uppercase font-bold text-dark-muted mb-1">Usuario *</label>
                                    <input
                                        type="text"
                                        value={formData.username}
                                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                        className="w-full px-2 py-1 bg-dark-bg border border-dark-border rounded text-xs text-white focus:outline-none focus:border-primary"
                                        required
                                        disabled={editMode}
                                        placeholder="Username"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] uppercase font-bold text-dark-muted mb-1">Email *</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full px-2 py-1 bg-dark-bg border border-dark-border rounded text-xs text-white focus:outline-none focus:border-primary"
                                        required
                                        placeholder="email@example.com"
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
                                        className="w-full px-2 py-1 bg-dark-bg border border-dark-border rounded text-xs text-white focus:outline-none focus:border-primary"
                                        required={!editMode}
                                        minLength={8}
                                        placeholder="********"
                                    />
                                </div>
                                <div className="flex items-center space-x-3 h-[28px]">
                                    <label className="flex items-center space-x-2 cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            checked={formData.is_admin}
                                            onChange={(e) => setFormData({ ...formData, is_admin: e.target.checked })}
                                            className="w-3.5 h-3.5 rounded border-dark-border bg-dark-bg text-primary focus:ring-primary focus:ring-offset-dark-surface"
                                        />
                                        <span className="text-xs text-dark-text group-hover:text-white transition-colors">Admin</span>
                                    </label>
                                    <div className="flex-1"></div>
                                    <button type="submit" className="bg-primary hover:bg-primary-dark text-white px-3 py-1 rounded text-xs font-medium transition-colors">
                                        {editMode ? 'Actualizar' : 'Crear'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowForm(false);
                                            setEditMode(false);
                                            setSelectedUser(null);
                                            setFormData({ username: '', email: '', password: '', is_admin: false });
                                        }}
                                        className="bg-dark-bg border border-dark-border hover:bg-dark-border/50 text-dark-muted hover:text-white px-3 py-1 rounded text-xs transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Summary Cards Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-none">
                        <div className="bg-dark-surface border border-dark-border rounded-lg p-3 flex flex-col justify-center">
                            <h3 className="text-dark-muted text-[10px] uppercase tracking-wider font-semibold mb-0.5">Total Usuarios</h3>
                            <div className="text-lg font-bold text-white leading-tight">
                                {stats.total}
                            </div>
                        </div>
                        <div className="bg-dark-surface border border-dark-border rounded-lg p-3 flex flex-col justify-center">
                            <h3 className="text-dark-muted text-[10px] uppercase tracking-wider font-semibold mb-0.5">Administradores</h3>
                            <div className="text-lg font-bold text-primary-light leading-tight">
                                {stats.admins}
                            </div>
                        </div>
                        <div className="bg-dark-surface border border-dark-border rounded-lg p-3 flex flex-col justify-center">
                            <h3 className="text-dark-muted text-[10px] uppercase tracking-wider font-semibold mb-0.5">Regulares</h3>
                            <div className="text-lg font-bold text-dark-text leading-tight">
                                {stats.regulars}
                            </div>
                        </div>
                    </div>

                    {/* Table Container */}
                    <div ref={hotTableRef} className="rounded-lg border border-dark-border flex-1 min-h-[300px] overflow-hidden handsontable-dark"></div>
                </div>
            </div>
        </Layout>
    );
}
