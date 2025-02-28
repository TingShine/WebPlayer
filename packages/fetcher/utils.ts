
export const isFile = (file: unknown): file is File => file instanceof File

export const isURL = (url: unknown): url is string => typeof url === 'string' && url.startsWith('http')
