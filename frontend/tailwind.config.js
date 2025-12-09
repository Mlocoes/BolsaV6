/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                // Tema oscuro profesional
                dark: {
                    bg: '#0f172a',
                    surface: '#1e293b',
                    border: '#334155',
                    text: '#e2e8f0',
                    muted: '#94a3b8'
                },
                primary: {
                    DEFAULT: '#3b82f6',
                    dark: '#2563eb'
                },
                success: '#10b981',
                danger: '#ef4444',
                warning: '#f59e0b'
            }
        },
    },
    plugins: [],
}
