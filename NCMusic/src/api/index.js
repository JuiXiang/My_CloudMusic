import axios from "axios";

//配置后端地址
const baseURL = "http://localhost:3000";

//创建实例对象
const instance = axios.create({
  baseURL: baseURL,
  timeout: 10000,
  withCredentials: true,
});

//请求拦截器：可以统一添加 token
instance.interceptors.request.use(
  //添加token
  (config) => {
    // const token = localStorage.getItem('token')
    // if(token){
    //     config.headers.Authorization = `Bearer ${token}`
    // }
    return config;
  },
  //添加错误处理
  (error) => {
    return Promise.reject(error);
  },
);

//响应拦截器：可以统一处理响应数据
instance.interceptors.response.use(
  //添加成功处理
  (response) => {
    return response.data;
  },
  //添加错误处理
  (error) => {
    return Promise.reject(error);
  },
);

//简单get/post请求
export function get(url, { params = {}, config = {} } = {}) {
  return instance.get(url, { params, ...config });
}

export function post(url, data = {}, config = {}) {
  return instance.post(url, data, config);
}

const api = {
  get,
  post,
};
export default api;
