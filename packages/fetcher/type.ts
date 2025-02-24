import type { file } from "opfs-tools"

export type IFetcherInput = File  | string | ReadableStream<ArrayBufferLike>

export type IFileReader = Awaited<ReturnType<ReturnType<typeof file>['createReader']>>
