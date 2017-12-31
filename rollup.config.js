import babel from 'rollup-plugin-babel';
import uglify from 'rollup-plugin-uglify';

export default {
  input: 'src/index.js',
  output: {
    file: 'lib/stato.js',
    format: 'cjs'
  },
  sourcemap: true,
  external: ['baconjs'],
  plugins: [
    babel({
      exclude: 'node_modules/**'
    }),
    uglify()
  ]
};
