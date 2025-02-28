import nodeResolve from '@rollup/plugin-node-resolve'
import typescript from '@rollup/plugin-typescript'
import commonjs from '@rollup/plugin-commonjs'
import webWorkerLoader from 'rollup-plugin-web-worker-loader'
import postcss from 'rollup-plugin-postcss'

const input = "./index.ts"

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
		commonjs({ include: /node_modules/ }),
		nodeResolve({ browser: true, moduleDirectories: ['node_modules'] }),
		webWorkerLoader(),
		postcss({ extract: true }),
		typescript({  tsconfig: 'tsconfig.json', module: 'ESNext' }),
	],
}