import axios from 'axios';

// Thiết lập cấu hình mặc định khi tạo một instance
const instance = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL
});

// Chỉnh sửa sau khi instance đã được tạo
// Thêm một request interceptor
instance.interceptors.request.use(
  function (config) {
    // Làm gì đó trước khi yêu cầu được gửi
    if (typeof window !== 'undefined' && window.localStorage) {
      const accessToken = localStorage.getItem("access_token");
      if (accessToken) {
        config.headers.Authorization = 'Bearer ' + accessToken;
      }
    }
    return config;
  },
  function (error) {
    // Làm gì đó với lỗi yêu cầu
    return Promise.reject(error);
  }
);

// Thêm một response interceptor
instance.interceptors.response.use(
  function (response) {
    // Bất kỳ mã trạng thái nào nằm trong dải 2xx đều kích hoạt chức năng này
    // Làm gì đó với dữ liệu phản hồi
    return response.data;
  },
  function (error) {
    // Bất kỳ mã trạng thái nào nằm ngoài dải 2xx đều kích hoạt chức năng này
    // Làm gì đó với lỗi phản hồi
    return Promise.reject(error);
  }
);

export default instance;