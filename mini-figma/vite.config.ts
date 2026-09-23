import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  // GitHub Pages: репозиторий называется "Figma", значит сайт доступен по адресу
  // https://<ник>.github.io/Figma/ — все пути к ассетам в сборке должны
  // начинаться с "/Figma/" (иначе CSS/JS не загрузятся под этим под-путём).
  base: "/Figma/",
  plugins: [react(), tailwindcss()],
  server: {
    // Автоматически открывает браузер с приложением при старте dev-сервера.
    open: true,
  },
});