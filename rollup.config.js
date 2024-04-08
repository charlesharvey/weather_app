import svelte from "rollup-plugin-svelte";
import resolve from "rollup-plugin-node-resolve";
import commonjs from "rollup-plugin-commonjs";
import livereload from "rollup-plugin-livereload";
import { terser } from "rollup-plugin-terser";

const production = !process.env.ROLLUP_WATCH;

const svelte_files = ["svelte/weather.js"];

// https://github.com/Rich-Harris/rollup-svelte-code-splitting
// I USED THIS AS A REFERENCE TO HAVE MULTIPLE MODULES
// TWO OUTPUTS, ONE FOR OLDER BROWSERS
export default [
  {
    input: svelte_files,
    output: {
      sourcemap: true,
      // format: 'iife',
      format: "es",
      dir: "js/module",
      name: "app",
      // file: 'js/svelte-bundle.js'
    },
    plugins: [
      svelte({
        // enable run-time checks when not in production
        dev: !production,
        // we'll extract any component CSS out into
        // a separate file — better for performance
        css: (css) => {
          css.write("css/svelte-bundle.css");
        },
      }),

      // If you have external dependencies installed from
      // npm, you'll most likely need these plugins. In
      // some cases you'll need additional configuration —
      // consult the documentation for details:
      // https://github.com/rollup/rollup-plugin-commonjs
      resolve({ browser: true }),
      commonjs(),

      // Watch the `public` directory and refresh the
      // browser on changes when not in production
      !production && livereload("public"),

      // If we're building for production (npm run build
      // instead of npm run dev), minify
      production && terser(),
    ],

    watch: {
      clearScreen: false,
    },
  },
  {
    /// FOR OLDER BROWSERS
    input: svelte_files,
    output: {
      sourcemap: true,
      // format: 'iife',
      format: "system",
      dir: "js/nomodule",
      name: "app",
      // file: 'js/svelte-bundle.js'
    },
    plugins: [
      svelte({
        // enable run-time checks when not in production
        dev: !production,
        // we'll extract any component CSS out into
        // a separate file — better for performance
        css: (css) => {
          css.write("css/svelte-bundle.css");
        },
      }),

      // If you have external dependencies installed from
      // npm, you'll most likely need these plugins. In
      // some cases you'll need additional configuration —
      // consult the documentation for details:
      // https://github.com/rollup/rollup-plugin-commonjs
      resolve({ browser: true }),
      commonjs(),

      // Watch the `public` directory and refresh the
      // browser on changes when not in production
      ////   !production && livereload('public'),

      // If we're building for production (npm run build
      // instead of npm run dev), minify
      production && terser(),
    ],
    watch: {
      clearScreen: false,
    },
  },
];
