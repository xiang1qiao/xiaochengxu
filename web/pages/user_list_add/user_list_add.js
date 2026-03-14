// pages/user_add/user_add.js
import http from '../../utils/api';

Page({
    data: {
        form: {
            username: "",
            password: "",
            name: "",
            phone: "",
            level: 1,
        },

        levelArray: [{
                value: 1,
                label: '普通用户'
            },
            {
                value: 10,
                label: '超级管理员'
            }
        ],
        levelIndex: 0,
    },

    onLoad() {
        wx.setNavigationBarTitle({
            title: '添加新账号'
        });
    },

 
    onUsernameInput(e) {
        this.setData({
            'form.username': e.detail.value
        });
    },
    onPasswordInput(e) {
        this.setData({
            'form.password': e.detail.value
        });
    },
    onNameInput(e) {
        this.setData({
            'form.name': e.detail.value
        });
    },
    onPhoneInput(e) {
        this.setData({
            'form.phone': e.detail.value
        });
    },

    onLevelChange(e) {
        const index = e.detail.value;
        const selectedLevel = this.data.levelArray[index].value;
        this.setData({
            levelIndex: index,
            'form.level': selectedLevel
        });
    },


    submitForm(e) {
        const data = this.data.form;

        if (!data.username) {
            wx.showToast({
                title: '账号不能为空',
                icon: 'none'
            });
            return;
        }
        if (!data.password) {
            wx.showToast({
                title: '密码不能为空',
                icon: 'none'
            });
            return;
        }
        if (!data.name) {
            wx.showToast({
                title: '昵称不能为空',
                icon: 'none'
            });
            return;
        }

        wx.showLoading({
            title: '提交中'
        });


        http.apiAdminUserListPost(data).then((res) => {
            wx.hideLoading();
            if (res.code === 200) {
                wx.showToast({
                    title: res.msg || '添加成功',
                    icon: 'success'
                });
        
                setTimeout(() => {
                    wx.navigateBack();
                }, 1000);
            } else {
                wx.showToast({
                    title: res.msg || '添加失败',
                    icon: 'none'
                });
            }
        }).catch(err => {
            wx.hideLoading();
            wx.showToast({
                title: '请求失败',
                icon: 'none'
            });
        });
    },
});