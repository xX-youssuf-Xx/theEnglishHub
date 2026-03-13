import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [pluginReact()],
  source: {
    entry: {
      index: './src/main.tsx',
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  html: {
    template: './index.html',
    title: 'The English Hub',
  },
  output: {
    distPath: {
      root: 'dist',
    },
  },
  tools: {
    postcss: (config) => {
      config.postcssOptions = {
        plugins: [
          require('@tailwindcss/postcss'),
        ],
      };
      return config;
    },
  },
  server: {
    port: 5173,
    host: 'localhost',
  },
});
