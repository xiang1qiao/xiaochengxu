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
        isDetecting: false,
        showPreview: false,
        previewImage: ""
    },

    onLoad() {
        this.setData({
            headers: {
                'Authorization': wx.getStorageSync('token')
            }
        });
    },

    // 选择图片
    chooseImage() {
        if (typeof wx.chooseMedia === 'function') {
            wx.chooseMedia({
              count: 1,
              mediaType: ['image'], // 明确只选择图片
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
          } 
          else if (typeof wx.chooseImage === 'function') {
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
          } 
          else {
            wx.showModal({
              title: '提示',
              content: '当前微信版本过低，无法使用图片选择功能，请升级微信。',
              showCancel: false
            });
          }



    },

    // 上传图片
    uploadImage(tempFilePath) {
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
                        "form.mid_raw": res.data
                    });
                    wx.showToast({
                        title: res.msg,
                        icon: 'success'
                    });
                }else if(res.code == 401){
                    wx.showToast({
                        title: res.msg,
                        icon: 'none'
                    });
                    wx.redirectTo({
                        url: '/pages/login/login'
                    });
                    return

                } else {
                    wx.showToast({
                        title: res.msg,
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

            }
        });


    },





    // 图片检测
    detection() {
        if (!this.data.form.mid_raw) {
            wx.showToast({
                title: '请先上传图片',
                icon: 'none'
            });
            return;
        }

        this.setData({
            isDetecting: true
        });

        http.apiImgDetectionPost(this.data.form).then((res) => {
            this.setData({
                isDetecting: false
            });
            if (res.code === 200) {
                wx.showToast({
                    title: res.msg,
                    icon: 'success'
                });
                this.setData({
                    'form.mid_handle': res.data.mid,
                    'form.nameDic': res.data.name || [],
                    'form.suggestion': res.data.suggestion || ""
                });
            } else {
                wx.showToast({
                    title: res.msg || '检测失败',
                    icon: 'none'
                });
            }
        }).catch(err => {
            this.setData({
                isDetecting: false
            });
            wx.showToast({
                title: '请求失败',
                icon: 'none'
            });
        });
    },

    // 保存图片到相册
    saveImageToPhotosAlbum() {
        if (!this.data.form.mid_handle) return;

        wx.showLoading({
            title: '保存中...'
        });
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

    // 图片预览
    imgShowOpen(e) {
        let imgLink = e.currentTarget.dataset.img;
        if (!imgLink) return;

        imgLink = http.imgLinkGet +imgLink


        wx.previewImage({
          urls: [imgLink],
          current: imgLink
        });


    },

    // 隐藏预览
    hidePreview() {
        this.setData({
            showPreview: false
        });
    }
});