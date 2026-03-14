// pages/register/register.js
import http from '../../utils/api';
Page({

    /**
     * 页面的初始数据
     */
    data: {
        form: {
            username: "",
            password: "",
            pwd: ""
        }
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
    handleInputChange(e) {
        const field = e.currentTarget.dataset.field;
        const value = e.detail.value;

        this.setData({
            [`form.${field}`]: value
        });
    },
    register() {
        if (this.data.form.password !== this.data.form.pwd) {
            wx.showToast({
                title: '两次密码输入不一致',
                icon: 'none',
                duration: 2000
            });
            return;
        }


        http.apiRegister(this.data.form).then(res => {
          

            if (res.code == 200) {
                wx.showToast({
                    title: "注册成功",
                    icon: 'success',
                    duration: 1500
                });

                // 0.5秒后跳转到登录页
                setTimeout(() => {
                    wx.redirectTo({
                        url: '/pages/login/login'
                    });
                }, 500);
            } else {
                wx.showToast({
                    title: res.msg,
                    icon: 'none',
                    duration: 2000
                });
            }
        }).catch(err => {
            wx.showToast({
                title: '网络错误',
                icon: 'none',
                duration: 2000
            });
        });
    }

})