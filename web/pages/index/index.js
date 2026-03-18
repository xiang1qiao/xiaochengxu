// pages/index/index.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    // 统计数据
    stats: {
      detectionCount: 0,
      accuracy: '98.5%',
      todayCount: 0
    },
    // 轮播图列表
    ImgDataList: [
      {
        "imgLink": "/assets/img/logo.png",
        "link": ""
      }
    ],
    // 菜单列表
    MenuList: [
      {
        "title": "图片检测",
        "imgLink": "/assets/img/img_detection.png",
        "link": "/pages/img_detection/img_detection",
        "level": 0
      },
      {
        "title": "图片管理",
        "imgLink": "/assets/img/img_list.png",
        "link": "/pages/img_list/img_list",
        "level": 0
      },
      {
        "title": "视频检测",
        "imgLink": "/assets/img/video_detection.png",
        "link": "/pages/video_detection/video_detection",
        "level": 0
      },
      {
        "title": "视频管理",
        "imgLink": "/assets/img/video_list.png",
        "link": "/pages/video_list/video_list",
        "level": 0
      },
      {
        "title": "用户管理",
        "imgLink": "/assets/img/user_list.png",
        "link": "/pages/user_list/user_list",
        "level": 10
      },
      {
        "title": "退出系统",
        "imgLink": "/assets/img/tuichu.png",
        "link": "/pages/logout/logout",
        "level": 0
      },
    ],
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.loadStats();
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
    this.loadStats();
    this.getTabBar && this.getTabBar().setData({
      selected: 0
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
    this.loadStats();
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
      title: '智检云 - 中药材智能检测平台',
      path: '/pages/index/index',
      imageUrl: '/assets/img/share.png'
    };
  },

  /**
   * 加载统计数据
   */
  loadStats() {
    // 从本地存储获取统计数据
    const stats = wx.getStorageSync('detectionStats') || {};
    const detectionCount = stats.totalCount || 0;
    const todayCount = this.getTodayCount(stats.history || []);
    
    this.setData({
      'stats.detectionCount': this.formatNumber(detectionCount),
      'stats.todayCount': this.formatNumber(todayCount)
    });
  },

  /**
   * 获取今日检测数量
   */
  getTodayCount(history) {
    const today = new Date().toDateString();
    return history.filter(item => {
      const itemDate = new Date(item.timestamp).toDateString();
      return itemDate === today;
    }).length;
  },

  /**
   * 格式化数字
   */
  formatNumber(num) {
    if (num >= 10000) {
      return (num / 10000).toFixed(1) + 'w';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  },

  /**
   * 导航到指定页面
   */
  navigateTo(e) {
    const url = e.currentTarget.dataset.url;
    if (!url) return;
    
    wx.navigateTo({
      url: url,
      fail: (err) => {
        console.error('页面跳转失败:', err);
        wx.showToast({
          title: '页面跳转失败',
          icon: 'none'
        });
      }
    });
  },

  /**
   * 更新检测统计
   */
  updateDetectionStats() {
    let stats = wx.getStorageSync('detectionStats') || {
      totalCount: 0,
      history: []
    };
    
    stats.totalCount += 1;
    stats.history.push({
      timestamp: new Date().getTime(),
      type: 'detection'
    });
    
    // 只保留最近30天的记录
    const thirtyDaysAgo = new Date().getTime() - 30 * 24 * 60 * 60 * 1000;
    stats.history = stats.history.filter(item => item.timestamp > thirtyDaysAgo);
    
    wx.setStorageSync('detectionStats', stats);
    this.loadStats();
  }
});
