import { resolve } from 'path'
import { defineConfig } from 'vite'
import { svg } from './build/plugins/svg' // https://github.com/jpkleemans/vite-svg-loader

export default defineConfig({
  plugins: [
    svg({
      tsConfigFilePath: resolve(__dirname, 'tsconfig.json'),
      outDir: resolve(__dirname, 'dist', 'types'),
    }),
  ],
  build: {
    minify: true,
    emptyOutDir: false,
    outDir: resolve(__dirname, 'dist'),
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['es'],
      fileName: () => '[name].js',
    },
    rollupOptions: {
      external: ['vue'],
      output: {
        preserveModules: true,
      },
    },
  },
})
