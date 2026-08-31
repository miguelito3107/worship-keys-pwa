import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
// import react from '@vitejs/plugin-react' (si estás usando React)

export default defineConfig({
  plugins: [
    tailwindcss(),
    // react(), (si usas React)
  ],
})