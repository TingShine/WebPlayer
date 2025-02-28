import type { file } from "opfs-tools"

export type IFetcherInput = File  | string | ReadableStream<Uint8Array>

export type IFileReader = Awaited<ReturnType<ReturnType<typeof file>['createReader']>>
