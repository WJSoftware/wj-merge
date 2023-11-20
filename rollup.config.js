import terser from "@rollup/plugin-terser";
import typescript from "@rollup/plugin-typescript";

export default {
    plugins: [typescript()],
    input: 'src/index.ts',
    output: [{
        file: './out/dist/index.es.min.js',
        format: 'es',
        plugins: [terser()]
    },
    {
        file: './out/dist/index.es.js',
        format: 'es'
    }]
}