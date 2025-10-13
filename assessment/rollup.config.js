import { nodeResolve } from '@rollup/plugin-node-resolve';
import { terser } from '@rollup/plugin-terser';

export default {
  input: 'js/main.js',
  output: {
    file: 'dist/js/main.min.js',
    format: 'iife',
    sourcemap: true,
    plugins: [terser()]
  },
  plugins: [
    nodeResolve()
  ]
};