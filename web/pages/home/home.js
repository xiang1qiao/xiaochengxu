// pages/home/home.js
import http from '../../utils/api';



Page({

    /**
     * 页面的初始数据
     */
    data: {
        userInfo: {
            username: '',
            name: '',
            phone: '',
            level: '',
            createdAt: '',
            img: ''
        },
        form: {
            password: '',
            name: '',
            phone: ''
        },
        levelDic: {
            1: "用户",
            10: "超级管理员"
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
        //判断是否登录
        const token = wx.getStorageSync('token'); // 读取缓存
        if (token == undefined || token == null || token == "") {
            //未登录 转跳到登录页面
            wx.navigateTo({
                url: '/pages/login/login',
            })
        }else{
            this.dataLoad()
        }

     

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

    dataLoad() {
        http.apiUserInfoGet().then(res => {
            if (res.code == 200) {
                this.setData({
                    'userInfo.username': res.data.username,
                    'userInfo.name': res.data.name,
                    'userInfo.phone': res.data.tel,  // 使用tel字段
                    'userInfo.level': res.data.level,
                    'form.name': res.data.name,
                    'form.phone': res.data.tel  // 使用tel字段
                })

            } else {
                wx.showToast({
                    title: res.msg,
                    icon: 'none',
                    duration: 3000
                });
            }
        })
    },
    submitForm() {
        http.apiUserInfoPut(this.data.form).then(res => {
            if (res.code === 200) {
                wx.showToast({
                    title: res.msg,
                    icon: 'success'
                });
                this.dataLoad();
            } else {
                wx.showToast({
                    title: res.msg,
                    icon: 'none'
                });
            }

        })
    }
})