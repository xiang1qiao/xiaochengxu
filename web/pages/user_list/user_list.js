// pages/user_list/user_list.js
import http from '../../utils/api';
import { formatTime } from '../../utils/util.js';

Page({
    data: {
        isLoading: false,
        dataList: [],
        total: 0,
        selectedIds: [],
        showFilter: false,

        form: {
            page: 1,
            pagesize: 10,
            username: '',
            name: '',
            phone: '',
        },

        levelDic: {
            1: "普通用户",
            10: "超级管理员",
        },

        formatTime: formatTime,
    },

    onLoad() {
        this.dataLoad();
    },

    onShow() {
        this.dataLoad();
    },

    onPullDownRefresh() {
        this.setData({
            'form.page': 1
        }, () => {
            this.dataLoad(() => {
                wx.stopPullDownRefresh();
            });
        });
    },

    // 数据加载
    dataLoad(callback) {
        this.setData({
            isLoading: true
        });

        http.apiAdminUserListGet(this.data.form).then((res) => {
            this.setData({
                isLoading: false
            });
            if (res.code === 200) {
                this.setData({
                    dataList: res.data.data,
                    total: res.data.total
                });
                if (callback) callback();
            } else {
                wx.showToast({
                    title: res.msg || '加载失败',
                    icon: 'none'
                });
            }
        }).catch(err => {
            this.setData({
                isLoading: false
            });
            wx.showToast({
                title: '网络错误，请重试',
                icon: 'none'
            });
            if (callback) callback();
        });
    },

    // 刷新数据
    refreshData() {
        this.setData({
            'form.page': 1
        }, () => {
            this.dataLoad();
        });
    },

    // 切换筛选面板
    toggleFilter() {
        this.setData({
            showFilter: !this.data.showFilter
        });
    },

    // 账号输入
    onUsernameInput(e) {
        this.setData({
            'form.username': e.detail.value
        });
    },

    // 姓名输入
    onNameInput(e) {
        this.setData({
            'form.name': e.detail.value
        });
    },

    // 手机号输入
    onPhoneInput(e) {
        this.setData({
            'form.phone': e.detail.value
        });
    },

    // 搜索
    onSearch() {
        this.setData({
            'form.page': 1
        }, () => {
            this.dataLoad();
        });
    },

    // 重置
    onReset() {
        this.setData({
            form: {
                page: 1,
                pagesize: 10,
                username: '',
                name: '',
                phone: '',
            },
            selectedIds: []
        }, () => {
            this.dataLoad();
            wx.showToast({
                title: '已重置',
                icon: 'success'
            });
        });
    },

    // 上一页
    prevPage() {
        if (this.data.form.page <= 1) return;
        this.setData({
            'form.page': this.data.form.page - 1
        }, () => {
            this.dataLoad();
        });
    },

    // 下一页
    nextPage() {
        const totalPages = Math.ceil(this.data.total / this.data.form.pagesize);
        if (this.data.form.page >= totalPages) return;
        this.setData({
            'form.page': this.data.form.page + 1
        }, () => {
            this.dataLoad();
        });
    },

    // 添加用户
    add() {
        wx.navigateTo({
            url: '/pages/user_list_add/user_list_add'
        });
    },

    // 编辑用户
    put(e) {
        const uid = e.currentTarget.dataset.uid;
        wx.navigateTo({
            url: `/pages/user_list_put/user_list_put?uid=${uid}`
        });
    },

    // 删除用户
    del_fun(e) {
        const id = e.currentTarget.dataset.id;
        wx.showModal({
            title: '确认删除',
            content: '删除后该用户将无法登录系统，是否继续？',
            confirmColor: '#DC2626',
            confirmText: '删除',
            cancelText: '取消',
            success: (res) => {
                if (res.confirm) {
                    this.deleteUser(id.toString());
                }
            }
        });
    },

    deleteUser(ids) {
        wx.showLoading({
            title: '删除中...',
            mask: true
        });

        http.apiAdminUserListDel({
            id: ids
        }).then((res) => {
            wx.hideLoading();
            if (res.code === 200) {
                wx.showToast({
                    title: '删除成功',
                    icon: 'success'
                });

                this.setData({
                    selectedIds: []
                });
                
                // 如果当前页没有数据了，返回上一页
                if (this.data.dataList.length === 1 && this.data.form.page > 1) {
                    this.setData({
                        'form.page': this.data.form.page - 1
                    });
                }
                
                this.dataLoad();
            } else {
                wx.showToast({
                    title: res.msg || '删除失败',
                    icon: 'none'
                });
            }
        }).catch(err => {
            wx.hideLoading();
            wx.showToast({
                title: '网络错误，请重试',
                icon: 'none'
            });
        });
    },

    // 多选变化
    onSelectionChange(e) {
        this.setData({
            selectedIds: e.detail.value
        });
    },

    // 批量删除
    batchDelete() {
        if (this.data.selectedIds.length === 0) {
            wx.showToast({
                title: '请先选择用户',
                icon: 'none'
            });
            return;
        }

        wx.showModal({
            title: '确认批量删除',
            content: `确定删除选中的 ${this.data.selectedIds.length} 个用户吗？`,
            confirmColor: '#DC2626',
            confirmText: '删除',
            cancelText: '取消',
            success: (res) => {
                if (res.confirm) {
                    this.deleteUser(this.data.selectedIds.join(','));
                }
            }
        });
    }
});
