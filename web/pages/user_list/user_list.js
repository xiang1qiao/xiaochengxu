import http from '../../utils/api';
import {
    formatTime
} from '../../utils/util';

Page({
    data: {
        isLoading: false,
        dataList: [],
        total: 0,
        selectedIds: [],

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

    onUsernameInput(e) {
        this.setData({
            'form.username': e.detail.value
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

    onSearch() {
        this.setData({
            'form.page': 1
        });
        this.dataLoad();
    },


    dataLoad() {
        this.setData({
            isLoading: true
        });


        http.apiAdminUserListGet(this.data.form).then((res) => {
            this.setData({
                isLoading: false
            });
            if (res.code === 200) {

                const selectedMap = this.data.selectedIds.reduce((acc, id) => {
                    acc[id] = true;
                    return acc;
                }, {});

                const dataList = res.data.data.map(item => ({
                    ...item,
                    checked: !!selectedMap[item.id]
                }));

                this.setData({
                    dataList: dataList,
                    total: res.data.total
                });
            } else {
                wx.showToast({
                    title: res.msg,
                    icon: 'none'
                });
            }
        }).catch(err => {
            this.setData({
                isLoading: false
            });
            wx.showToast({
                title: '加载失败',
                icon: 'none'
            });
        });
    },

    get totalPages() {
        return Math.ceil(this.data.total / this.data.form.pagesize);
    },



    prevPage() {
        if (this.data.form.page > 1) {
            this.setData({
                'form.page': this.data.form.page - 1
            });
            this.dataLoad();
        }
    },

    nextPage() {
        let maxPage = Math.ceil(this.data.total / this.data.form.pagesize)
        if (this.data.form.page >= maxPage) {
            wx.showToast({
                title: "已经是最后一页了",
                icon: 'none'
            });
            return
        }
        this.setData({
            'form.page': this.data.form.page + 1
        });
        this.dataLoad();
    },



    handleSelectionChange(e) {
        const selectedIdsOnPage = e.detail.value.map(id => parseInt(id));
        let newSelectedIds = [...this.data.selectedIds];


        const currentPageIds = this.data.dataList.map(item => item.id);


        newSelectedIds = newSelectedIds.filter(id => !currentPageIds.includes(id));


        newSelectedIds = [...newSelectedIds, ...selectedIdsOnPage];

        this.setData({
            selectedIds: newSelectedIds,

            dataList: this.data.dataList.map(item => ({
                ...item,
                checked: newSelectedIds.includes(item.id)
            }))
        });
    },

    add() {
        wx.navigateTo({
            url: '/pages/user_list_add/user_list_add'
        });

    },

    put(e) {
        const uid = e.currentTarget.dataset.uid;
        wx.navigateTo({
            url: `/pages/user_list_put/user_list_put?uid=${uid}`
        });
    },

    del_fun(e) {
        const id = e.currentTarget.dataset.id;

        wx.showModal({
            title: '提示',
            content: '确定删除该账号吗?',
            success: (res) => {
                if (res.confirm) {
                    this.deleteUser(id.toString());
                }
            }
        });
    },

    batchDel() {
        if (this.data.selectedIds.length === 0) return;

        wx.showModal({
            title: '提示',
            content: `确定删除选中的 ${this.data.selectedIds.length} 条数据吗?`,
            success: (res) => {
                if (res.confirm) {
                    const ids = this.data.selectedIds.join(',');
                    this.deleteUser(ids);
                }
            }
        });
    },

    deleteUser(ids) {

        http.apiAdminUserListDel({
            id: ids
        }).then((res) => {
            if (res.code === 200) {
                wx.showToast({
                    title: res.msg,
                    icon: 'success'
                });

                this.setData({
                    selectedIds: []
                });
                this.dataLoad();
            } else {
                wx.showToast({
                    title: res.msg,
                    icon: 'none'
                });
            }
        }).catch(err => {
            wx.showToast({
                title: '删除失败',
                icon: 'none'
            });
        });
    }
});