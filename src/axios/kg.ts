import axios from 'axios';

// 知识图谱服务 axios 实例
const kgApi = axios.create({
  baseURL: 'http://localhost:5000',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' }
});

export default kgApi;




