/**
 * Página de Gestión de Usuarios (solo admin)
 */
import { useEffect, useState, useRef } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef } from 'ag-grid-community';
import { toast } from 'react-toastify';
import Layout from '../components/Layout';
import api from '../services/api';

interface User {
    id: string;
    username: string;
    email: string;
    is_active: boolean;
    is_admin: boolean;
    created_at: string;
}

export default function Users() {
    const gridRef = useRef<AgGridReact>(null);
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

    const columnDefs: ColDef[] = [
        { field: 'username', headerName: 'Usuario', width: 150 },
        { field: 'email', headerName: 'Email', flex: 1 },
        {
            field: 'is_admin',
            headerName: 'Admin',
            width: 100,
            valueFormatter: (params) => params.value ? 'Sí' : 'No'
        },
        {
            field: 'created_at',
            headerName: 'Creado',
            width: 150,
            valueFormatter: (params) => new Date(params.value).toLocaleDateString()
        },
        {
            headerName: 'Acciones',
            width: 200,
            cellRenderer: (params: any) => (
                <div className="flex space-x-2 h-full items-center">
                    <button
                        onClick={() => handleEdit(params.data)}
                        className="bg-primary hover:bg-primary/80 text-white px-3 py-1 rounded text-sm"
                    >
                        Editar
                    </button>
                    <button
                        onClick={() => handleDelete(params.data.id)}
                        className="bg-danger hover:bg-danger/80 text-white px-3 py-1 rounded text-sm"
                    >
                        Eliminar
                    </button>
                </div>
            ),
        },
    ];

    useEffect(() => {
        loadUsers();
    }, []);

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
                await api.post('/users', formData);
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
            await api.delete(`/users/${userId}`);
            toast.success('Usuario eliminado correctamente');
            loadUsers();
        } catch (error) {
            console.error('Error deleting user:', error);
            toast.error('Error al eliminar usuario. Por favor, inténtelo de nuevo.');
        }
    };

    return (
        <Layout>
            <div className="p-6 h-full flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-3xl font-bold">Gestión de Usuarios</h1>
                    <button
                        onClick={() => setShowForm(true)}
                        className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg"
                    >
                        + Nuevo Usuario
                    </button>
                </div>

                {showForm && (
                    <div className="bg-dark-card p-4 rounded-lg border border-dark-border mb-4">
                        <h2 className="text-xl font-bold mb-4">{editMode ? 'Editar Usuario' : 'Nuevo Usuario'}</h2>
                        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Usuario *</label>
                                <input
                                    type="text"
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg"
                                    required
                                    disabled={editMode}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Email *</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg"
                                    required
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-sm font-medium mb-1">
                                    Contraseña {editMode ? '(dejar vacío para mantener la actual)' : '*'}
                                </label>
                                <input
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg"
                                    required={!editMode}
                                    minLength={8}
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        checked={formData.is_admin}
                                        onChange={(e) => setFormData({ ...formData, is_admin: e.target.checked })}
                                        className="w-4 h-4"
                                    />
                                    <span className="text-sm font-medium">Administrador</span>
                                </label>
                            </div>
                            <div className="col-span-2 flex space-x-2">
                                <button type="submit" className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg">
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
                                    className="bg-dark-border hover:bg-dark-border/80 text-white px-4 py-2 rounded-lg"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                <div className="ag-theme-quartz-dark rounded-lg border border-dark-border" style={{ width: '100%', flex: '1 1 auto', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                    <AgGridReact
                        ref={gridRef}
                        rowData={users}
                        columnDefs={columnDefs}
                        defaultColDef={{
                            sortable: true,
                            resizable: true,
                            filter: true,
                        }}
                        animateRows={true}
                        suppressCellFocus={true}
                        domLayout='normal'
                        containerStyle={{ height: '100%', width: '100%' }}
                    />
                </div>
            </div>
        </Layout>
    );
}
