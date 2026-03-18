import http from '../../utils/api';

Page({
    data: {
        videoLinkGet: http.videoLinkGet,
        tempVideoUrl: "",
        form: {
            mid_raw: "",
            mid_handle: "",
            nameDic: []
        },
        detectionStats: {
            todayCount: 0,
            totalCount: 0
        },
        isUploading: false,
        isDetecting: false,
    },

    onLoad() {
        this.setData({
            headers: {
                'Authorization': wx.getStorageSync('token')
            }
        });
        this.loadDetectionStats();
    },

    onShow() {
        this.loadDetectionStats();
    },

    loadDetectionStats() {
        const stats = wx.getStorageSync('detectionStats') || {};
        const history = stats.history || [];
        const today = new Date().toDateString();
        const todayCount = history.filter(item => {
            const itemDate = new Date(item.timestamp).toDateString();
            return itemDate === today;
        }).length;

        this.setData({
            'detectionStats.todayCount': todayCount,
            'detectionStats.totalCount': stats.totalCount || 0
        });
    },

    updateDetectionStats() {
        let stats = wx.getStorageSync('detectionStats') || { totalCount: 0, history: [] };
        stats.totalCount = (stats.totalCount || 0) + 1;
        stats.history = stats.history || [];
        stats.history.push({
            timestamp: Date.now(),
            type: 'video'
        });
        wx.setStorageSync('detectionStats', stats);
        this.loadDetectionStats();
    },

    chooseVideo() {
        wx.chooseVideo({
            sourceType: ['album', 'camera'],
            compressed: true,
            maxDuration: 60,
            success: (res) => {
                const tempFilePath = res.tempFilePath;
                this.setData({
                    tempVideoUrl: tempFilePath,
                    "form.mid_raw": "",
                    "form.mid_handle": "",
                    "form.nameDic": []
                });
                this.uploadVideo(tempFilePath);
            },
            fail: (err) => {
                console.error("选择视频失败", err);
                wx.showToast({
                    title: '选择视频失败',
                    icon: 'none'
                });
            }
        });
    },

    uploadVideo(tempFilePath) {
        this.setData({ isUploading: true });
        wx.showLoading({ title: '视频上传中...' });

        wx.uploadFile({
            url: http.videoLinkPost,
            filePath: tempFilePath,
            name: 'file',
            header: this.data.headers,
            success: (resp) => {
                const res = JSON.parse(resp.data);
                if (res.code === 200) {
                    this.setData({
                        "form.mid_raw": res.data,
                    });
                    wx.showToast({
                        title: '上传成功',
                        icon: 'success'
                    });
                } else if (res.code == 401) {
                    wx.showToast({
                        title: res.msg || '登录已过期',
                        icon: 'none'
                    });
                    wx.redirectTo({
                        url: '/pages/login/login'
                    });
                } else {
                    wx.showToast({
                        title: res.msg || '上传失败',
                        icon: 'none'
                    });
                }
            },
            fail: (err) => {
                console.error("上传失败", err);
                wx.showToast({
                    title: '网络错误，上传失败',
                    icon: 'none'
                });
            },
            complete: () => {
                wx.hideLoading();
                this.setData({ isUploading: false });
            }
        });
    },

    detectionVideo() {
        if (!this.data.form.mid_raw) {
            wx.showToast({
                title: '请先上传视频',
                icon: 'none'
            });
            return;
        }

        this.setData({ isDetecting: true });

        http.apiVideoDetectionPost({
            mid_raw: this.data.form.mid_raw
        }).then((res) => {
            this.setData({ isDetecting: false });

            if (res.code === 200) {
                wx.showToast({
                    title: '检测完成',
                    icon: 'success'
                });

                this.setData({
                    'form.mid_handle': res.data.mid,
                    'form.nameDic': res.data.name || []
                });
                this.updateDetectionStats();
            } else {
                wx.showToast({
                    title: res.msg || '检测失败',
                    icon: 'none'
                });
            }
        }).catch(err => {
            this.setData({ isDetecting: false });
            console.error("检测请求失败", err);
            wx.showToast({
                title: '请求失败',
                icon: 'none'
            });
        });
    },

    saveVideoToPhotosAlbum() {
        const midHandle = this.data.form.mid_handle;
        if (!midHandle) return;

        wx.showLoading({ title: '保存中...' });
        const url = this.data.videoLinkGet + midHandle;

        wx.downloadFile({
            url: url,
            success: (res) => {
                wx.saveVideoToPhotosAlbum({
                    filePath: res.tempFilePath,
                    success: () => {
                        wx.hideLoading();
                        wx.showToast({
                            title: '保存成功',
                            icon: 'success'
                        });
                    },
                    fail: (saveErr) => {
                        wx.hideLoading();
                        console.error("保存到相册失败", saveErr);
                        wx.showToast({
                            title: '保存失败',
                            icon: 'none'
                        });
                    }
                });
            },
            fail: (downloadErr) => {
                wx.hideLoading();
                console.error("下载视频失败", downloadErr);
                wx.showToast({
                    title: '下载视频失败',
                    icon: 'none'
                });
            }
        });
    }
});
