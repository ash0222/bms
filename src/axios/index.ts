import axios, { AxiosHeaders } from "axios";

const axiosInstance = axios.create({
    baseURL: 'http://localhost:8089/bms',
    timeout: 20000
})

axiosInstance.interceptors.request.use((config) => {
    try {
        const raw = sessionStorage.getItem('user')
        if (raw) {
            const u = JSON.parse(raw)
            const isAdmin = !!(u.adminName || u.adminLoginName)
            const isSuper = !!(u.superId || u.superName)
            if (isSuper || isAdmin) {
                const role = isSuper ? 'super' : 'admin'
                if (!config.headers) {
                    config.headers = new AxiosHeaders()
                }
                if (typeof (config.headers as AxiosHeaders).set === 'function') {
                    (config.headers as AxiosHeaders).set('X-Role', role)
                } else {
                    // Fallback for non-AxiosHeaders shapes
                    ;(config.headers as any)['X-Role'] = role
                }
            }
        }
    } catch {}
    return config
})

//导出axios实例
export default axiosInstance;