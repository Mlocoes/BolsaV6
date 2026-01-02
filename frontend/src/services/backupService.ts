import api from './api';

export const backupService = {
    /**
     * Descargar backup completo de la base de datos
     */
    downloadFullBackup: async () => {
        const response = await api.get('/backup/full', {
            responseType: 'blob'
        });
        
        // Crear URL para descarga
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `bolsav6_full_backup_${new Date().toISOString().split('T')[0]}.dump`);
        document.body.appendChild(link);
        link.click();
        link.remove();
    },

    /**
     * Restaurar backup completo
     */
    restoreFullBackup: async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        
        await api.post('/backup/full/restore', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
    },

    /**
     * Descargar backup de cotizaciones
     */
    downloadQuotesBackup: async () => {
        const response = await api.get('/backup/quotes', {
            responseType: 'blob'
        });
        
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `bolsav6_quotes_backup_${new Date().toISOString().split('T')[0]}.dump`);
        document.body.appendChild(link);
        link.click();
        link.remove();
    },

    /**
     * Restaurar backup de cotizaciones
     */
    restoreQuotesBackup: async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        
        await api.post('/backup/quotes/restore', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
    },

    /**
     * Descargar backup de transacciones de una cartera
     */
    downloadTransactionsBackup: async (portfolioId: string) => {
        const response = await api.get(`/backup/transactions/${portfolioId}`, {
            responseType: 'blob'
        });
        
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `transactions_${portfolioId}_${new Date().toISOString().split('T')[0]}.json`);
        document.body.appendChild(link);
        link.click();
        link.remove();
    },

    /**
     * Restaurar transacciones de una cartera
     */
    restoreTransactionsBackup: async (portfolioId: string, file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        
        await api.post(`/backup/transactions/${portfolioId}/restore`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
    }
};
