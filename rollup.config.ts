import resolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'
import sourceMaps from 'rollup-plugin-sourcemaps'
import camelCase from 'lodash.camelcase'
import typescript from 'rollup-plugin-typescript2'
import json from 'rollup-plugin-json'
import copy from 'rollup-plugin-copy-glob'
import external from '@yelo/rollup-node-external'
import builtins from 'rollup-plugin-node-builtins'
import globals from 'rollup-plugin-node-globals'

const pkg = require('./package.json')

const libraryName = 'alexa-language-model-generator'

export default {
  input: `src/${libraryName}.ts`,
  output: [
    { file: pkg.main, name: camelCase(libraryName), format: 'cjs', sourcemap: true },
    { file: pkg.module, format: 'es', sourcemap: true }
  ],
  // Indicate here external modules you don't wanna include in your bundle (i.e.: 'lodash')
  external: external(),
  watch: {
    include: 'src/**'
  },
  plugins: [
    copy([{ files: 'src/languagemodel.pegjs', dest: 'dist' }], {
      verbose: true,
      watch: false
    }),
    // Allow json resolution
    json(),
    // Compile TypeScript files
    typescript({ useTsconfigDeclarationDir: true }),
    // Allow bundling cjs modules (unlike webpack, rollup doesn't understand cjs)
    commonjs(),
    // Allow node_modules resolution, so you can use 'external' to control
    // which external modules to include in the bundle
    // https://github.com/rollup/rollup-plugin-node-resolve#usage
    resolve({
      jsnext: true,
      main: true,
      browser: false
    }),
    globals(),
    // Resolve source maps to the original source
    sourceMaps()
  ]
}
