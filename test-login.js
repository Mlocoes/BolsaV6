/* 
 * Script de prueba de Login - Ejecuta esto en la consola del navegador
 * en la página http://192.168.0.8:3000/login
 */

async function testLogin() {
    const API_URL = 'http://192.168.0.8:8000/api';
    
    console.log('🔍 Iniciando prueba de login...');
    console.log('📍 API URL:', API_URL);
    
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include', // Importante para cookies
            body: JSON.stringify({
                username: 'admin',
                password: 'admin123_change_me'
            })
        });
        
        console.log('📡 Status:', response.status);
        console.log('📋 Headers:', [...response.headers.entries()]);
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Login exitoso!');
            console.log('👤 Usuario:', data.user);
            console.log('🍪 Cookies:', document.cookie);
            return data;
        } else {
            const error = await response.json();
            console.error('❌ Error en login:', error);
            return error;
        }
    } catch (error) {
        console.error('💥 Error de red:', error);
        throw error;
    }
}

// Ejecutar la prueba
testLogin();
