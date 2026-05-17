// app.js
App({
  globalData: {
    authStorageKey: "love_map_logged_in_v1",
    loginPassphrase: "CHANGE_ME",
  },

  onLaunch() {
    if (!wx.cloud) {
      console.error("Please use base library 2.2.3 or above to enable cloud.");
      return;
    }

    wx.cloud.init({
      env: "YOUR_CLOUD_ENV_ID",
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
