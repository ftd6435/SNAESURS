import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
// https://vitejs.dev/config/
export default defineConfig(function (_a) {
    var command = _a.command;
    return ({
        base: command === 'build' ? '/app/' : '/',
        plugins: [react()],
        resolve: {
            alias: {
                '@': path.resolve(__dirname, './src'),
            },
        },
        build: command === 'build'
            ? {
                outDir: '../public/app',
                emptyOutDir: true,
            }
            : undefined,
        server: {
            port: 3000,
            proxy: {
                '/api': {
                    target: 'http://localhost:8000',
                    changeOrigin: true,
                },
            },
        },
    });
});
