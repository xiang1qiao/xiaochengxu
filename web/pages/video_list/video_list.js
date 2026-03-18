import http from '../../utils/api';
import { formatTime } from '../../utils/util';

Page({
    data: {
        level: wx.getStorageSync('level') || '',
        dataList: [],
        total: 0,
        selectAll: false,
        selectedIds: [],
        showFilter: true,
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

    toggleFilter() {
        this.setData({
            showFilter: !this.data.showFilter
        });
    },

    refreshData() {
        wx.showLoading({ title: '刷新中...' });
        this.dataLoad();
        setTimeout(() => {
            wx.hideLoading();
            wx.showToast({
                title: '刷新成功',
                icon: 'success',
                duration: 1500
            });
        }, 500);
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
        wx.showToast({
            title: '搜索完成',
            icon: 'success',
            duration: 1500
        });
    },

    onReset() {
        this.setData({
            'form.username': '',
            'form.file_name': '',
            'form.created_at_start': '',
            'form.created_at_end': '',
            'form.page': 1
        });
        this.dataLoad();
        wx.showToast({
            title: '已重置',
            icon: 'success',
            duration: 1500
        });
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
            title: '确认重新检测',
            content: `确定要重新提交视频"${item.file_name}"的检测任务吗？`,
            confirmText: '确认提交',
            cancelText: '取消',
            confirmColor: '#0D9488',
            success: (res) => {
                if (res.confirm) {
                    this.detectionVideo(item);
                }
            }
        });
    },

    detectionVideo(row) {
        wx.showLoading({ title: '提交中...', mask: true });
        const dic = { mid_raw: row.mid_raw };

        http.apiVideoDetectionPost(dic).then((res) => {
            wx.hideLoading();
            if (res.code === 200) {
                wx.showToast({
                    title: '检测任务已提交',
                    icon: 'success',
                    duration: 2000
                });
                setTimeout(() => {
                    this.dataLoad();
                }, 500);
            } else {
                wx.showToast({
                    title: res.msg || '提交失败',
                    icon: 'none',
                    duration: 2000
                });
            }
        }).catch(err => {
            wx.hideLoading();
            wx.showToast({
                title: '网络请求失败',
                icon: 'none',
                duration: 2000
            });
        });
    },

    onDelete(e) {
        const item = e.currentTarget.dataset.item;
        wx.showModal({
            title: '确认删除',
            content: `删除后无法恢复，确定删除视频"${item.file_name}"吗？`,
            confirmText: '确认删除',
            cancelText: '取消',
            confirmColor: '#DC2626',
            success: (res) => {
                if (res.confirm) {
                    this.del_fun(item);
                }
            }
        });
    },

    del_fun(row) {
        wx.showLoading({ title: '删除中...', mask: true });
        const dic = { id: row.id };

        http.apiVideoListDel(dic).then((res) => {
            wx.hideLoading();
            if (res.code === 200) {
                wx.showToast({
                    title: '删除成功',
                    icon: 'success',
                    duration: 1500
                });
                setTimeout(() => {
                    this.dataLoad();
                }, 300);
            } else {
                wx.showToast({
                    title: res.msg || '删除失败',
                    icon: 'none',
                    duration: 2000
                });
            }
        }).catch(err => {
            wx.hideLoading();
            wx.showToast({
                title: '网络请求失败',
                icon: 'none',
                duration: 2000
            });
        });
    },

    dataLoad() {
        wx.showLoading({ title: '加载中...', mask: true });
        const params = { ...this.data.form };

        http.apiVideoListGet(params).then((res) => {
            wx.hideLoading();
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
                    title: res.msg || '加载失败',
                    icon: 'none',
                    duration: 2000
                });
            }
        }).catch(err => {
            wx.hideLoading();
            wx.showToast({
                title: '网络请求失败',
                icon: 'none',
                duration: 2000
            });
        });
    },

    playVideo(e) {
        const src = e.currentTarget.dataset.src;
        if (!src) {
            wx.showToast({
                title: '暂无视频可播放',
                icon: 'none',
                duration: 1500
            });
            return;
        }
        wx.navigateTo({
            url: `/pages/video_player/video_player?src=${encodeURIComponent(src)}`
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
        } else {
            wx.showToast({
                title: '已经是第一页了',
                icon: 'none',
                duration: 1500
            });
        }
    },

    nextPage() {
        let maxPage = Math.ceil(this.data.total / this.data.form.pagesize);
        if (this.data.form.page >= maxPage) {
            wx.showToast({
                title: '已经是最后一页了',
                icon: 'none',
                duration: 1500
            });
            return;
        }
        this.setData({
            'form.page': this.data.form.page + 1
        });
        this.dataLoad();
    },

    onPullDownRefresh() {
        this.setData({
            'form.page': 1
        });
        this.dataLoad();
        wx.stopPullDownRefresh();
        wx.showToast({
            title: '刷新成功',
            icon: 'success',
            duration: 1500
        });
    },

    onReachBottom() {
        let maxPage = Math.ceil(this.data.total / this.data.form.pagesize);
        if (this.data.form.page < maxPage) {
            this.setData({
                'form.page': this.data.form.page + 1
            });
            this.loadMoreData();
        }
    },

    loadMoreData() {
        const params = { ...this.data.form };
        http.apiVideoListGet(params).then((res) => {
            if (res.code === 200) {
                const newDataList = res.data.data.map(item => ({
                    ...item,
                    checked: this.data.selectedIds.includes(item.id)
                }));

                this.setData({
                    dataList: [...this.data.dataList, ...newDataList]
                });
            }
        });
    }
});
