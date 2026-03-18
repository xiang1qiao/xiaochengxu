// pages/login/login.js

import http from '../../utils/api';

Page({
    data: {
        form: {
            username: "",
            password: "",
        },
        isLoading: false,
        showPassword: false,
    },

    onLoad(options) {
    },

    onReady() {
    },

    onShow() {
    },

    onHide() {
    },

    onUnload() {
    },

    onPullDownRefresh() {
    },

    onReachBottom() {
    },

    onShareAppMessage() {
    },

    handleInputChange(e) {
        const field = e.currentTarget.dataset.field;
        const value = e.detail.value;
        
        this.setData({
            [`form.${field}`]: value 
        });
    },

    clearInput(e) {
        const field = e.currentTarget.dataset.field;
        this.setData({
            [`form.${field}`]: ''
        });
    },

    togglePassword() {
        this.setData({
            showPassword: !this.data.showPassword
        });
    },

    login() {
        if (!this.data.form.username) {
            wx.showToast({
                title: '请输入用户名',
                icon: 'none'
            });
            return;
        }

        if (!this.data.form.password) {
            wx.showToast({
                title: '请输入密码',
                icon: 'none'
            });
            return;
        }

        this.setData({
            isLoading: true
        });
        
        http.apiLogin(this.data.form).then(res => {
            this.setData({
                isLoading: false
            });
            
            if (res.code == 200) {
                wx.showToast({
                    title: '登录成功',
                    icon: 'success',
                    duration: 1500
                });
                
                wx.setStorageSync('token', res.data.token);
                wx.setStorageSync('name', res.data.name);
                wx.setStorageSync('level', res.data.level);
                wx.setStorageSync('username', res.data.username);
                wx.setStorageSync('uid', res.data.uid);

                setTimeout(() => {
                    wx.switchTab({
                        url: '/pages/index/index'
                    });
                }, 1000);

            } else {
                wx.showToast({
                    title: res.msg || '登录失败',
                    icon: 'none',
                    duration: 3000
                });
            }
        }).catch(err => {
            this.setData({
                isLoading: false
            });
            wx.showToast({
                title: '网络错误，请重试',
                icon: 'none',
                duration: 3000
            });
        });
    }
});
