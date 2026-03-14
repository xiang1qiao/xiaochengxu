// pages/components/index_menu/index_menu.js
Component({
    /**
     * 组件的属性列表
     */
    properties: {
        MenuList: {
            type: Array,
            value: [],
        },
    },

    /**
     * 组件的初始数据
     */
    data: {
        level: 0,
    },

    /**
     * 组件的方法列表
     */
    methods: {

        loadUserLevel() {
            // 从缓存读取用户等级
            const level = wx.getStorageSync('level'); // 读取缓存
            if (level == undefined || level == null) {
                console.log('未读取到等级信息');
            } else {
                this.setData({
                    level: parseInt(level)
                });
                // console.log('用户等级加载成功:', level);
            }
        },


        pageGoTo(event) {
            const link = event.currentTarget.dataset.link;
            console.log("进入了")
            if (link == "") {
                return
            }

            wx.navigateTo({
                url: link
            });

        },

    },

    lifetimes: {

    },

    pageLifetimes: {
        show() {
            this.loadUserLevel();
        },
    }


})