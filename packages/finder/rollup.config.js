import nodeResolve from '@rollup/plugin-node-resolve'
import typescript from '@rollup/plugin-typescript'
import commonjs from '@rollup/plugin-commonjs'
import webWorkerLoader from 'rollup-plugin-web-worker-loader'
import { resolve } from 'path'

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
	alias: {
		"@fetcher": "../fetcher",
		"demuxer": "../demuxer",
	},
	plugins: [
		commonjs({ include: /node_modules/ }),
		nodeResolve({ browser: true, moduleDirectories: ['node_modules'] }),
		{
			name: 'custom-resolve',
			resolveId(source, importer) {
				if (source === 'mp4box') {
					return resolve("./node_modules/mp4box/dist/mp4box.all.min.js") 
				} else if (source === 'opfs-tools') {
					return resolve("./node_modules/opfs-tools/dist/opfs-tools.js") 
				}

				return null
			}
		},
		webWorkerLoader({  }),
		typescript({  tsconfig: 'tsconfig.json', module: 'ESNext' }),
	],
}