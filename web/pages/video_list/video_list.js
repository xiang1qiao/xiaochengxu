import http from '../../utils/api';
import {
    formatTime
} from '../../utils/util';

Page({
    data: {
        level: wx.getStorageSync('level') || '',
        dataList: [],
        total: 0,
        selectAll: false,
        selectedIds: [],

        form: {
            page: 1,
            pagesize: 10,
            username: '',
            file_name: '',
            created_at_start: '',
            created_at_end: ''
        },

        pageSizeOptions: ['10', '30', '50', '100'],
        videoLinkGet: http.videoLinkGet
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

    onFileNameInput(e) {
        this.setData({
            'form.file_name': e.detail.value
        });
    },

    onStartDateChange(e) {
        this.setData({
            'form.created_at_start': e.detail.value
        });
    },

    onEndDateChange(e) {
        this.setData({
            'form.created_at_end': e.detail.value
        });
    },

    onSearch() {
        this.setData({
            'form.page': 1
        });
        this.dataLoad();
    },


    onSelectionChange(e) {
        const selectedIds = e.detail.value.filter(id => id !== 'all');
        const selectAll = selectedIds.length === this.data.dataList.length;

        this.setData({
            selectedIds,
            selectAll
        });
    },

    toggleSelectAll() {
        const selectAll = !this.data.selectAll;
        const selectedIds = selectAll ? this.data.dataList.map(item => item.id) : [];

        this.setData({
            selectAll,
            selectedIds
        });
    },

    onDetection(e) {
        const item = e.currentTarget.dataset.item;
        wx.showModal({
            title: '提示',
            content: '确定重新提交这条视频检测任务吗？',
            success: (res) => {
                if (res.confirm) {
                    this.detectionVideo(item);
                }
            }
        });
    },

    detectionVideo(row) {
        const dic = {

            mid_raw: row.mid_raw
        };


        http.apiVideoDetectionPost(dic).then((res) => {
            if (res.code === 200) {
                wx.showToast({
                    title: res.msg || '检测任务提交成功',
                    icon: 'success'
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
                title: '请求失败',
                icon: 'none'
            });
        });
    },


    onDelete(e) {
        const item = e.currentTarget.dataset.item;
        wx.showModal({
            title: '提示',
            content: '确定删除这条视频记录吗？',
            success: (res) => {
                if (res.confirm) {
                    this.del_fun(item);
                }
            }
        });
    },

    del_fun(row) {
        const dic = {
            id: row.id
        };


        http.apiVideoListDel(dic).then((res) => {
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
        }).catch(err => {
            wx.showToast({
                title: '删除失败',
                icon: 'none'
            });
        });
    },



    dataLoad() {
        const params = {
            ...this.data.form
        };

  
        http.apiVideoListGet(params).then((res) => {
            if (res.code === 200) {
                const dataList = res.data.data.map(item => ({
                    ...item,
                    checked: this.data.selectedIds.includes(item.id)
                }));

                this.setData({
                    dataList,
                    total: res.data.total
                });
            } else {
                wx.showToast({
                    title: res.msg,
                    icon: 'none'
                });
            }
        }).catch(err => {
            wx.showToast({
                title: '加载失败',
                icon: 'none'
            });
        });
    },


    onPageSizeChange(e) {
        const pagesize = parseInt(this.data.pageSizeOptions[e.detail.value]);
        this.setData({
            'form.pagesize': pagesize,
            'form.page': 1
        });
        this.dataLoad();
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



});