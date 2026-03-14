const API_BASE_URL = "https://127.0.0.1:8000/api";
// const API_BASE_URL = "/api";



// 请求拦截器
const requestInterceptor = (config) => {
    // 获取token
    const token = wx.getStorageSync('token');
    if (token) {
        config.header = config.header || {};
        config.header.Authorization = token;
    }

    // 显示加载中
    // if (config.showLoading !== false) {
    //     wx.showLoading({
    //         title: '加载中...',
    //         mask: true
    //     });
    // }

    return config;
};

// 响应拦截器
const responseInterceptor = (response) => {
    // 隐藏加载中
    // wx.hideLoading();

 

    // 处理未授权情况
    if (response.data.code === 401) {
        wx.redirectTo({
            url: '/pages/login/login'
        });
        return Promise.reject(response.data);
    }

    return response.data;
};


// 错误处理
const errorHandler = (error) => {
    wx.hideLoading();

    wx.showToast({
        title: '请求失败',
        icon: 'none',
        duration: 3000
    });

    return Promise.reject(error);
};

// 封装请求方法
const request = (method, url, data = {}, config = {}) => {
    // 处理请求拦截
    const mergedConfig = requestInterceptor({
        url: API_BASE_URL + url,
        method,
        data,
        ...config,
        header: {
            'Content-Type': 'application/json',
            ...(config.header || {})
        }
    });

    return new Promise((resolve, reject) => {
        wx.request({
            ...mergedConfig,
            success: (res) => {
                try {
                    const handledResponse = responseInterceptor(res);
                    resolve(handledResponse);
                } catch (e) {
                    reject(e);
                }
            },
            fail: (err) => {
                errorHandler(err);
                reject(err);
            }
        });
    });
};

// 封装GET请求
const get = (url, params = {}, config = {}) => {
    return request('GET', url, params, config);
};

// 封装POST请求
const post = (url, data = {}, config = {}) => {
    return request('POST', url, data, config);
};

// 封装PUT请求
const put = (url, data = {}, config = {}) => {
    return request('PUT', url, data, config);
};

// 封装DELETE请求
const del = (url, params = {}, config = {}) => {

    const queryString = Object.keys(params)
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&');
    const finalUrl = queryString 
    ? `${url}${url.includes('?') ? '&' : '?'}${queryString}`
    : url;

    return request('DELETE', finalUrl, {}, config);


    // return request('DELETE', url, params, config);
};

// 登录
export const apiLogin = (data) => post('/user/login', data);

// 注册
export const apiRegister = (data) => post('/user/register', data);

// 查询个人信息
export const apiUserInfoGet = (params) => get('/user/info', params);

// 修改个人信息
export const apiUserInfoPut = (data) => put('/user/info', data);

// 用户管理
export const apiAdminUserListGet = (params) => get('/admin/user', params);
export const apiAdminUserListOneGet = (params) => get('/admin/user/one', params);
export const apiAdminUserListPost = (data) => post('/admin/user', data);
export const apiAdminUserListPut = (data) => put('/admin/user', data);
export const apiAdminUserListDel = (params) => del('/admin/user', params);

// 图片检测
export const apiImgDetectionPost = (data) => post('/img/detection', data);

// 图片列表
export const apiImgListGet = (params) => get('/img_list', params);

// 图片删除
export const apiImgListDel = (params) => {




    return del('/img_list', params);
}

// 视频检测
export const apiVideoDetectionPost = (data) => post('/video/detection', data);

// 视频列表
export const apiVideoListGet = (params) => get('/video_list', params);

// 视频删除
export const apiVideoListDel = (params) => del('/video_list', params);


// 图片和视频的基础URL
export const imgLinkPost = API_BASE_URL + "/img";
export const imgLinkGet = API_BASE_URL + "/img?mid=";
export const videoLinkPost = API_BASE_URL + "/video";
export const videoLinkGet = API_BASE_URL + "/video?mid=";



export default {
    get,
    post,
    put,
    delete: del,
    apiLogin,
    apiRegister,
    apiUserInfoGet,
    apiUserInfoPut,
    apiAdminUserListGet,
    apiAdminUserListOneGet,
    apiAdminUserListPost,
    apiAdminUserListPut,
    apiAdminUserListDel,
    apiImgDetectionPost,
    apiImgListGet,
    apiImgListDel,
    apiVideoDetectionPost,
    apiVideoListGet,
    apiVideoListDel,
    imgLinkPost,
    imgLinkGet,
    videoLinkPost,
    videoLinkGet
};