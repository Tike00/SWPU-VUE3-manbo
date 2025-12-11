// src/mock/utils.ts
export interface MockRequestOptions {
  url: string
  type: string
  body?: string
}

// 简单的查询参数解析工具
export const parseQuery = (url: string) => {
  const queryIndex = url.indexOf('?')
  if (queryIndex === -1) return {}
  const search = url.slice(queryIndex)
  const u = new URL(search, 'http://dummy.base')
  const params: Record<string, string> = {}
  u.searchParams.forEach((v, k) => {
    params[k] = v
  })
  return params
}
