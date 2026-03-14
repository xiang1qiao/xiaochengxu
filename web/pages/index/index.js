// pages/home/home.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    ImgDataList:[ //轮播图列表
      {
        "imgLink":"/assets/img/logo.png",  //图片连接
        "link":""                    //转跳连接
      }
    ],
    MenuList:[
      {
        "title":"图片检测",
        "imgLink":"/assets/img/img_detection.png",
        "link":"/pages/img_detection/img_detection",
        "level":0
      },
      {
        "title":"图片管理",
        "imgLink":"/assets/img/img_list.png",
        "link":"/pages/img_list/img_list",
        "level":0
      },
      {
        "title":"视频检测",
        "imgLink":"/assets/img/video_detection.png",
        "link":"/pages/video_detection/video_detection",
        "level":0
      },

      {
        "title":"视频管理",
        "imgLink":"/assets/img/video_list.png",
        "link":"/pages/video_list/video_list",
        "level":0
      },
      {
        "title":"用户管理",
        "imgLink":"/assets/img/user_list.png",
        "link":"/pages/user_list/user_list",
        "level":10
      },


      {
        "title":"退出系统",
        "imgLink":"/assets/img/tuichu.png",
        "link":"/pages/logout/logout",
        "level":0
      },


    ],
 
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {

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

  }
})