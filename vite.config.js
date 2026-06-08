import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        login: resolve(__dirname, 'login.html'),
        profile: resolve(__dirname, 'profile.html'),
        trending: resolve(__dirname, 'trending.html'),
        wishlist: resolve(__dirname, 'wishlist.html')
      }
    }
  }
});
