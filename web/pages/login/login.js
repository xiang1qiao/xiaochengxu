// pages/login/login.js


import http from '../../utils/api';

Page({

    /**
     * 页面的初始数据
     */
    data: {
        form: {
            "username": "",
            "password": "",
        },
        isLoading: false,
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad(options) {

    },

    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady() {


    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow() {

    },

    /**
     * 生命周期函数--监听页面隐藏
     */
    onHide() {

    },

    /**
     * 生命周期函数--监听页面卸载
     */
    onUnload() {

    },

    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh() {

    },

    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom() {

    },

    /**
     * 用户点击右上角分享
     */
    onShareAppMessage() {

    },

    handleInputChange(e){
        const field = e.currentTarget.dataset.field; // 获取data-field值
        const value = e.detail.value; // 获取输入值
        
        this.setData({
          [`form.${field}`]: value 
        });
    },


    login() {
        // 显示加载状态
        this.setData({
            isLoading: true
        });
        
        http.apiLogin(this.data.form).then(res => {
            // 隐藏加载状态
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
                    title: res.msg,
                    icon: 'none',
                    duration: 3000
                });
            }
        }).catch(err => {
            // 隐藏加载状态
            this.setData({
                isLoading: false
            });
            wx.showToast({
                title: '登录失败，请重试',
                icon: 'none',
                duration: 3000
            });
        })
    }


})