/**
 * Página de Gestión de Usuarios (solo admin)
 */
import { useEffect, useState, useRef } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef } from 'ag-grid-community';
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

    const columnDefs: ColDef[] = [
        { field: 'username', headerName: 'Usuario', width: 150 },
        { field: 'email', headerName: 'Email', flex: 1 },
        {
            field: 'is_active',
            headerName: 'Activo',
            width: 100,
            cellRenderer: (params: any) => (
                <span className={params.value ? 'text-success' : 'text-danger'}>
                    {params.value ? '✓' : '✗'}
                </span>
            )
        },
        {
            field: 'is_admin',
            headerName: 'Admin',
            width: 100,
            cellRenderer: (params: any) => (
                <span className={params.value ? 'text-warning' : 'text-dark-muted'}>
                    {params.value ? '✓' : '✗'}
                </span>
            )
        },
        {
            field: 'created_at',
            headerName: 'Creado',
            width: 150,
            valueFormatter: (params) => new Date(params.value).toLocaleDateString()
        },
        {
            headerName: 'Acciones',
            width: 150,
            cellRenderer: (params: any) => (
                <div className="flex space-x-2 h-full items-center">
                    <button
                        onClick={() => handleDelete(params.data.id)}
                        className="bg-danger hover:bg-danger/80 text-white px-3 py-1 rounded text-sm"
                        disabled={params.data.is_admin}
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
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar este usuario?')) return;

        try {
            await api.delete(`/users/${id}`);
            loadUsers();
        } catch (error) {
            console.error('Error deleting user:', error);
            alert('Error al eliminar usuario');
        }
    };

    return (
        <Layout>
            <div className="space-y-4 h-[calc(100vh-12rem)]">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold">Gestión de Usuarios</h1>
                    <button className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg">
                        + Nuevo Usuario
                    </button>
                </div>

                <div className="ag-theme-alpine-dark h-full rounded-lg overflow-hidden border border-dark-border">
                    <AgGridReact
                        ref={gridRef}
                        rowData={users}
                        columnDefs={columnDefs}
                        defaultColDef={{
                            sortable: true,
                            resizable: true,
                        }}
                        animateRows={true}
                        suppressCellFocus={true}
                    />
                </div>
            </div>
        </Layout>
    );
}
