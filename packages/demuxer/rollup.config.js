import nodeResolve from '@rollup/plugin-node-resolve'
import typescript from '@rollup/plugin-typescript'
import commonjs from '@rollup/plugin-commonjs'

const input = "./src/index.ts"

const outputFile = "./dist/index.mjs"

const output = {
	file: outputFile,
	format: 'es',
	exports: "named"
}

export default  {
	input: input,
	output,
	plugins: [
		commonjs(),
		typescript({ tsconfig: 'tsconfig.json', module: 'ESNext' }),
		nodeResolve({ browser: true })
	]
}