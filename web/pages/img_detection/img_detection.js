import http from '../../utils/api';

Page({
    data: {
        imgLinkGet: http.imgLinkGet,
        form: {
            mid_raw: "",
            mid_handle: "",
            nameDic: [],
            suggestion: ""
        },
        detectionStats: {
            todayCount: 0,
            totalCount: 0
        },
        isDetecting: false,
        isUploading: false
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
        this.getTabBar && this.getTabBar().setData({
            selected: 1
        });
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
            type: 'image'
        });
        wx.setStorageSync('detectionStats', stats);
        this.loadDetectionStats();
    },

    chooseImage() {
        if (typeof wx.chooseMedia === 'function') {
            wx.chooseMedia({
                count: 1,
                mediaType: ['image'],
                sourceType: ['album', 'camera'],
                sizeType: ['original', 'compressed'],
                success: (res) => {
                    const tempFilePath = res.tempFiles[0].tempFilePath;
                    this.uploadImage(tempFilePath);
                },
                fail: (err) => {
                    console.error("wx.chooseMedia 调用失败", err);
                    wx.showToast({ title: '选择图片失败', icon: 'none' });
                }
            });
        } else if (typeof wx.chooseImage === 'function') {
            wx.chooseImage({
                count: 1,
                sizeType: ['original', 'compressed'],
                sourceType: ['album', 'camera'],
                success: (res) => {
                    const tempFilePath = res.tempFilePaths[0];
                    this.uploadImage(tempFilePath);
                },
                fail: (err) => {
                    console.error("wx.chooseImage 调用失败", err);
                    wx.showToast({ title: '选择图片失败', icon: 'none' });
                }
            });
        } else {
            wx.showModal({
                title: '提示',
                content: '当前微信版本过低，无法使用图片选择功能，请升级微信。',
                showCancel: false
            });
        }
    },

    uploadImage(tempFilePath) {
        this.setData({ isUploading: true });

        wx.uploadFile({
            url: http.imgLinkPost,
            filePath: tempFilePath,
            name: 'file',
            header: {
                'Authorization': wx.getStorageSync('token')
            },
            success: (resp) => {
                const res = JSON.parse(resp.data);
                if (res.code === 200) {
                    this.setData({
                        "form.mid_raw": res.data,
                        "form.mid_handle": "",
                        "form.nameDic": [],
                        "form.suggestion": ""
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
            fail: () => {
                wx.showToast({
                    title: '网络错误',
                    icon: 'none'
                });
            },
            complete: () => {
                this.setData({ isUploading: false });
            }
        });
    },

    detection() {
        if (!this.data.form.mid_raw) {
            wx.showToast({
                title: '请先上传图片',
                icon: 'none'
            });
            return;
        }

        this.setData({ isDetecting: true });

        http.apiImgDetectionPost(this.data.form).then((res) => {
            this.setData({ isDetecting: false });
            if (res.code === 200) {
                wx.showToast({
                    title: '检测完成',
                    icon: 'success'
                });
                this.setData({
                    'form.mid_handle': res.data.mid,
                    'form.nameDic': res.data.name || [],
                    'form.suggestion': res.data.suggestion || ""
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
            wx.showToast({
                title: '请求失败',
                icon: 'none'
            });
        });
    },

    saveImageToPhotosAlbum() {
        if (!this.data.form.mid_handle) return;

        wx.showLoading({ title: '保存中...' });
        const url = http.imgLinkGet + this.data.form.mid_handle;

        wx.downloadFile({
            url: url,
            success: (res) => {
                wx.saveImageToPhotosAlbum({
                    filePath: res.tempFilePath,
                    success: () => {
                        wx.hideLoading();
                        wx.showToast({
                            title: '保存成功',
                            icon: 'success'
                        });
                    },
                    fail: () => {
                        wx.hideLoading();
                        wx.showToast({
                            title: '保存失败',
                            icon: 'none'
                        });
                    }
                });
            },
            fail: () => {
                wx.hideLoading();
                wx.showToast({
                    title: '下载图片失败',
                    icon: 'none'
                });
            }
        });
    },

    imgShowOpen(e) {
        let imgLink = e.currentTarget.dataset.img;
        if (!imgLink) return;

        imgLink = http.imgLinkGet + imgLink;

        wx.previewImage({
            urls: [imgLink],
            current: imgLink
        });
    }
});
