// pages/rotation_chart/rotation_chart.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    imgDataList: {
      type: Array,
      value: [],
    },
  },

  /**
   * 组件的初始数据
   */
  data: {

  },

  /**
   * 组件的方法列表
   */
  methods: {
    pageGoTo(event) {
      const link = event.currentTarget.dataset.link;
      if (link == "") {
        return
      }
      wx.navigateTo({
        url: link
      });

    }
  }
})