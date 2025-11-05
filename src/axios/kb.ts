import axios from 'axios';

// 知识库服务 axios 实例（通过主后端代理）
const kbApi = axios.create({
  baseURL: 'http://localhost:8089/bms',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' }
});

kbApi.interceptors.response.use(
  (resp) => resp,
  (error) => {
    if (error?.response?.status === 503) {
      const msg = (error.response.data && typeof error.response.data === 'string')
        ? error.response.data
        : '知识库服务未启动或不可用，请先启动 8000 端口的知识库服务';
      if (typeof window !== 'undefined') {
        // 简单提醒：可根据 UI 框架替换为全局消息组件
        alert(msg);
      }
    }
    return Promise.reject(error);
  }
);

export default kbApi;

