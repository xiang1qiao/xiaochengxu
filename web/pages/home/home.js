// pages/home/home.js
import http from '../../utils/api';

Page({

    /**
     * 页面的初始数据
     */
    data: {
        userInfo: {
            id: '',
            username: '',
            name: '',
            phone: '',
            level: '',
            createdAt: '',
            img: ''
        },
        userStats: {
            detectionCount: 0,
            imgCount: 0,
            videoCount: 0
        },
        levelDic: {
            1: "用户",
            10: "超级管理员"
        },
        // 弹窗相关
        showModal: false,
        modalTitle: '',
        modalField: '',
        modalValue: '',
        // 临时存储
        tempForm: {
            name: '',
            phone: '',
            password: ''
        }
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad(options) {
        // 加载统计数据
        this.loadUserStats();
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
        // 判断是否登录
        const token = wx.getStorageSync('token');
        if (!token) {
            // 未登录 转跳到登录页面
            wx.navigateTo({
                url: '/pages/login/login',
            });
        } else {
            this.dataLoad();
            this.loadUserStats();
        }
        this.getTabBar && this.getTabBar().setData({
            selected: 2
        });
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
        this.dataLoad();
        this.loadUserStats();
        wx.stopPullDownRefresh();
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
        return {
            title: '智检云 - 专业中药材检测系统',
            path: '/pages/index/index'
        };
    },

    /**
     * 加载用户统计数据
     */
    loadUserStats() {
        const stats = wx.getStorageSync('detectionStats') || {};
        const imgList = wx.getStorageSync('imgList') || [];
        const videoList = wx.getStorageSync('videoList') || [];
        
        const totalCount = (stats.totalCount || 0);
        const imgCount = imgList.length || 0;
        const videoCount = videoList.length || 0;

        this.setData({
            'userStats.detectionCount': totalCount,
            'userStats.imgCount': imgCount,
            'userStats.videoCount': videoCount
        });
    },

    /**
     * 加载用户信息
     */
    dataLoad() {
        http.apiUserInfoGet().then(res => {
            if (res.code === 200) {
                const userData = res.data;
                this.setData({
                    'userInfo.id': userData.id || '',
                    'userInfo.username': userData.username || '',
                    'userInfo.name': userData.name || '',
                    'userInfo.phone': userData.tel || '',
                    'userInfo.level': userData.level || 1,
                    'userInfo.createdAt': this.formatDate(userData.createdAt) || '-',
                    'userInfo.img': userData.img || '',
                    'tempForm.name': userData.name || '',
                    'tempForm.phone': userData.tel || ''
                });
            } else {
                wx.showToast({
                    title: res.msg || '加载失败',
                    icon: 'none',
                    duration: 3000
                });
            }
        }).catch(err => {
            console.error('获取用户信息失败:', err);
            wx.showToast({
                title: '网络错误，请重试',
                icon: 'none'
            });
        });
    },

    /**
     * 格式化日期
     */
    formatDate(dateStr) {
        if (!dateStr) return '-';
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return dateStr;
        
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    },

    /**
     * 导航到指定页面
     */
    navigateTo(e) {
        const url = e.currentTarget.dataset.url;
        if (url) {
            wx.navigateTo({
                url: url
            });
        }
    },

    /**
     * 显示编辑弹窗
     */
    showEditModal(e) {
        const field = e.currentTarget.dataset.field;
        const fieldMap = {
            'name': { title: '修改昵称', value: this.data.userInfo.name },
            'phone': { title: '修改手机号', value: this.data.userInfo.phone }
        };
        
        const config = fieldMap[field];
        if (config) {
            this.setData({
                showModal: true,
                modalTitle: config.title,
                modalField: field,
                modalValue: config.value || ''
            });
        }
    },

    /**
     * 显示密码修改弹窗
     */
    showPasswordModal() {
        this.setData({
            showModal: true,
            modalTitle: '修改密码',
            modalField: 'password',
            modalValue: ''
        });
    },

    /**
     * 隐藏弹窗
     */
    hideModal() {
        this.setData({
            showModal: false,
            modalTitle: '',
            modalField: '',
            modalValue: ''
        });
    },

    /**
     * 弹窗输入处理
     */
    onModalInput(e) {
        this.setData({
            modalValue: e.detail.value
        });
    },

    /**
     * 确认编辑
     */
    confirmEdit() {
        const { modalField, modalValue } = this.data;
        
        if (!modalValue.trim()) {
            wx.showToast({
                title: '请输入内容',
                icon: 'none'
            });
            return;
        }

        // 手机号验证
        if (modalField === 'phone' && !/^1[3-9]\d{9}$/.test(modalValue)) {
            wx.showToast({
                title: '请输入正确的手机号',
                icon: 'none'
            });
            return;
        }

        // 密码验证
        if (modalField === 'password' && modalValue.length < 6) {
            wx.showToast({
                title: '密码长度需6位以上',
                icon: 'none'
            });
            return;
        }

        // 构建提交数据
        const formData = {
            name: this.data.userInfo.name,
            phone: this.data.userInfo.phone,
            password: ''
        };

        if (modalField === 'password') {
            formData.password = modalValue;
        } else {
            formData[modalField] = modalValue;
        }

        // 提交更新
        wx.showLoading({ title: '保存中...' });
        
        http.apiUserInfoPut(formData).then(res => {
            wx.hideLoading();
            if (res.code === 200) {
                wx.showToast({
                    title: '保存成功',
                    icon: 'success'
                });
                this.hideModal();
                this.dataLoad();
            } else {
                wx.showToast({
                    title: res.msg || '保存失败',
                    icon: 'none'
                });
            }
        }).catch(err => {
            wx.hideLoading();
            console.error('保存失败:', err);
            wx.showToast({
                title: '网络错误，请重试',
                icon: 'none'
            });
        });
    },

    /**
     * 处理退出登录
     */
    handleLogout() {
        wx.showModal({
            title: '确认退出',
            content: '确定要退出登录吗？',
            confirmColor: '#0D9488',
            success: (res) => {
                if (res.confirm) {
                    // 清除登录信息
                    wx.removeStorageSync('token');
                    wx.removeStorageSync('userInfo');
                    
                    wx.showToast({
                        title: '已退出登录',
                        icon: 'success'
                    });
                    
                    // 跳转到登录页
                    setTimeout(() => {
                        wx.redirectTo({
                            url: '/pages/login/login'
                        });
                    }, 1000);
                }
            }
        });
    }
});
