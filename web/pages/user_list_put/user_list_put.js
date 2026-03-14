// pages/user_form/user_form.js

import http from '../../utils/api';

Page({
    data: {
        form: {
            username: "",
            password: "",
            name: "",
            phone: "",
            level: 1,
            uid: null,
            id: null,
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
        isNew: false,
    },

    onLoad(options) {
        if (options.uid) {
            this.setData({
                'form.uid': options.uid,
                isNew: false
            });
            this.dataLoad(options.uid);
            wx.setNavigationBarTitle({
                title: '修改用户信息'
            });
        }
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


    dataLoad(uid) {
        wx.showLoading({
            title: '加载中'
        });


        http.apiAdminUserListOneGet({
            uid: uid
        }).then((res) => {
            wx.hideLoading();
            if (res.code === 200) {
                const data = res.data;
                const levelIndex = this.data.levelArray.findIndex(item => item.value === data.level);

                this.setData({
                    'form.username': data.username,
                    'form.name': data.name,
                    'form.phone': data.phone,
                    'form.level': data.level,
                    'form.id': data.id,
                    levelIndex: levelIndex !== -1 ? levelIndex : 0,
                });
            } else {
                wx.showToast({
                    title: res.msg || '加载失败',
                    icon: 'none'
                });
                setTimeout(() => {
                    wx.navigateBack();
                }, 1500);
            }
        }).catch(err => {
            wx.hideLoading();
            wx.showToast({
                title: '请求失败',
                icon: 'none'
            });

        });
    },

    submitForm(e) {
     
        const {
            username,
            name
        } = e.detail.value;

    
        let submitData = {
            uid: this.data.form.uid,
            id: this.data.form.id,
            username: username || this.data.form.username,
            password: this.data.form.password,
            name: name || this.data.form.name,
            phone: this.data.form.phone,
            level: this.data.form.level,
        };

 
        if (!submitData.name) {
            wx.showToast({
                title: '昵称不能为空',
                icon: 'none'
            });
            return;
        }

        wx.showLoading({
            title: '提交中'
        });

  
        http.apiAdminUserListPut(submitData).then((res) => {
            wx.hideLoading();
            if (res.code === 200) {
                wx.showToast({
                    title: res.msg || '修改成功',
                    icon: 'success'
                });
                // 返回上一页
                setTimeout(() => {
                    wx.navigateBack();
                }, 1000);
            } else {
                wx.showToast({
                    title: res.msg || '修改失败',
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