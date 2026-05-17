// app.js
App({
  globalData: {
    authStorageKey: "love_map_logged_in_v1",
    loginPassphrase: "沙县小吃",
  },

  onLaunch() {
    if (!wx.cloud) {
      console.error("Please use base library 2.2.3 or above to enable cloud.");
      return;
    }

    wx.cloud.init({
      env: "cloud1-6ga2yj9x2b0ad3c2",
      traceUser: true,
    });
  },

  isLoggedIn() {
    try {
      return !!wx.getStorageSync(this.globalData.authStorageKey);
    } catch (e) {
      console.warn("read login state failed:", e);
      return false;
    }
  },

  markLoggedIn() {
    wx.setStorageSync(this.globalData.authStorageKey, true);
  },

  getLoginPassphrase() {
    return this.globalData.loginPassphrase;
  },
});
