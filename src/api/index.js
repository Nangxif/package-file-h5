import axios from 'axios';
const instance = axios.create({
  baseURL: 'http://xxx:3000/api', // 能用 https 的情况下，请使用 https
  withCredentials: true
  // timeout: 10 * 1000
});
const api = {
  postRelativePath(data) {
    return instance.post('/relativePath', data);
  },
  postPackage(data) {
    return instance.post('/package', data);
  },
  postCode() {
    return instance.post('/postCode');
  },
  postNewpackage(data) {
    return instance.post('/newpackage', data);
  }
};

instance.interceptors.response.use(
  res => {
    // console.log(res);
    return Promise.resolve(res.data);
  },
  error => {
    return Promise.reject(error);
  }
);

export default api;
