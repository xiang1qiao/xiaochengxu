// custom-tab-bar/index.js
Component({
  data: {
    selected: 0,
    list: [
      {
        pagePath: "/pages/index/index",
        text: "首页"
      },
      {
        pagePath: "/pages/img_detection/img_detection",
        text: "检测"
      },
      {
        pagePath: "/pages/home/home",
        text: "我的"
      }
    ]
  },
  attached() {
    // 组件加载时，根据当前页面设置选中状态
    const pages = getCurrentPages();
    const currentPage = pages[pages.length - 1];
    const route = currentPage ? currentPage.route : '';
    
    const index = this.data.list.findIndex(item => {
      return item.pagePath === `/${route}` || item.pagePath === route;
    });
    
    if (index !== -1) {
      this.setData({
        selected: index
      });
    }
  },
  methods: {
    switchTab(e) {
      const { index, path } = e.currentTarget.dataset;
      
      // 如果点击的是当前页面，不执行跳转
      if (this.data.selected === index) {
        return;
      }
      
      // 更新选中状态
      this.setData({
        selected: index
      });
      
      // 跳转到对应页面
      wx.switchTab({
        url: path,
        fail: (err) => {
          console.error('切换tab失败:', err);
          wx.showToast({
            title: '页面跳转失败',
            icon: 'none'
          });
        }
      });
    }
  }
});
