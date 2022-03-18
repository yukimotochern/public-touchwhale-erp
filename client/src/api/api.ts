import axios, { AxiosRequestConfig, AxiosRequestHeaders, Method } from 'axios'
import { useRef, useEffect } from 'react'
import { UserIO } from '@api/user/userHandlerIO'
import { ApiPromise } from './apiPromise'

// Custom Abort Controll Hook
const initAbortController = () => new AbortController()
export const useAbortController = (shouldAutoRestart = false) => {
  const abortController = useRef(initAbortController())

  useEffect(() => {
    if (shouldAutoRestart && abortController.current.signal.aborted) {
      abortController.current = initAbortController()
    }
  }, [abortController.current.signal.aborted, shouldAutoRestart])

  useEffect(() => () => abortController.current.abort(), [])

  return abortController.current
}

let config: AxiosRequestConfig = {
  timeout: +process.env.REACT_APP_API_TIMEOUT,
  baseURL: process.env.REACT_APP_URL,
  headers: { 'content-type': 'application/json' },
}

// class ApiPromise<T = any> extends Promise<T> {
//   async onMongooseError(cb: Function = () => {}): ApiPromise {
//     return new ApiPromise((resolve, reject) => reject(this))
//   }
// }

class api1 {
  static Request() {
    return new ApiPromise((resolve, reject) => reject(1))
  }
  static url(url: string) {
    return `/api/v${process.env.REACT_APP_API_VERSION}${url}`
  }
  static checkToSend() {
    if (process.env.NODE_ENV === 'development') {
    }
  }
  static async request<DataType, BodyType = any>(
    url: string,
    method: Method,
    data: DataType,
    abortController: AbortController | undefined = undefined,
    cof: AxiosRequestConfig = {}
  ) {
    try {
      // avj req check
      // make the actural request
      const res = await axios.request<
        DataType,
        AxiosRequestConfig<BodyType>,
        BodyType
      >({
        url: this.url(url),
        method,
        data,
        ...config,
        ...cof,
        signal: abortController?.signal || undefined,
      })
      console.log(res.data)
      // ajv res check
    } catch (err) {
      this.errorCatcher(err)
    }
  }
  static errorCatcher(err: any) {
    // mongoose Error
    // mongoDB Error
    // Axios Error
    // Network Error
    // customError
    // err instanceof axios.Cancel
    // Unknown Error
  }
  static async get(
    url: string,
    cof: AxiosRequestConfig = {},
    abortController: AbortController | undefined = undefined
  ) {
    return this.request<undefined>(url, 'GET', undefined, abortController, cof)
  }

  static async post<DataType, BodyType = any>(
    url: string,
    data: any,
    cof: AxiosRequestConfig = {},
    abortController: AbortController | undefined = undefined
  ) {
    return this.request<DataType, BodyType>(
      url,
      'POST',
      data,
      abortController,
      cof
    )
  }

  static async put<DataType, BodyType = any>(
    url: string,
    data: any,
    cof: AxiosRequestConfig = {},
    abortController: AbortController | undefined = undefined
  ) {
    return this.request<DataType, BodyType>(
      url,
      'PUT',
      data,
      abortController,
      cof
    )
  }

  static async delete<DataType, BodyType = any>(
    url: string,
    data: any,
    cof: AxiosRequestConfig = {},
    abortController: AbortController | undefined = undefined
  ) {
    return this.request<DataType, BodyType>(
      url,
      'DELETE',
      data,
      abortController,
      cof
    )
  }
}

async function k() {
  const a = await api1.Request().onMongoError().onMongoError()
}

export { api1 }

class api {
  static async get(url: string, cof: AxiosRequestConfig = {}) {
    return axios.get(this.apiUrl(url), { ...config, ...cof })
  }

  static async post(url: string, data: any, cof: AxiosRequestConfig = {}) {
    return axios.post(this.apiUrl(url), data, { ...config, ...cof })
  }

  static async put(url: string, data: any, cof: AxiosRequestConfig = {}) {
    return axios.put(this.apiUrl(url), data, { ...config, ...cof })
  }

  static async delete(
    url: string,
    data: any = {},
    headers: AxiosRequestHeaders = {}
  ) {
    return axios.delete(this.apiUrl(url), {
      ...config,
      data,
      headers: { 'content-type': 'application/json', ...headers },
    })
  }
  static apiUrl(url: string) {
    return `/api/v${process.env.REACT_APP_API_VERSION}${url}`
  }
}

export default api