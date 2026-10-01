import process from 'node:process';
import react from '@vitejs/plugin-react';
import {defineConfig} from 'vite';
export default defineConfig({plugins:[react()],server:{port:5173,proxy:{'/api':{target:process.env.API_PROXY_TARGET||'http://localhost:8081',changeOrigin:true}}},preview:{port:4173,proxy:{'/api':{target:process.env.API_PROXY_TARGET||'http://localhost:8081',changeOrigin:true}}}});
