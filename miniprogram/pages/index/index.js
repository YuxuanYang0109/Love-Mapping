Page({
  data: {
    passphrase: "",
    submitting: false,
    errorText: "",
  },

  onLoad() {
    this.redirectIfLoggedIn();
  },

  onShow() {
    this.redirectIfLoggedIn();
  },

  redirectIfLoggedIn() {
    const app = getApp();
    if (!app.isLoggedIn()) return;

    wx.redirectTo({
      url: "/pages/map/map",
    });
  },

  onPassphraseInput(e) {
    this.setData({
      passphrase: (e.detail.value || "").trim(),
      errorText: "",
    });
  },

  submitLogin() {
    if (this.data.submitting) return;

    const app = getApp();
    const expected = app.getLoginPassphrase();
    const passphrase = this.data.passphrase.trim();

    if (!passphrase) {
      this.setData({ errorText: "Please enter the passphrase." });
      return;
    }

    if (passphrase !== expected) {
      this.setData({ errorText: "Incorrect passphrase." });
      return;
    }

    this.setData({ submitting: true, errorText: "" });
    app.markLoggedIn();

    wx.showToast({
      title: "Success",
      icon: "success",
    });

    setTimeout(() => {
      wx.redirectTo({
        url: "/pages/map/map",
      });
    }, 250);
  },
});
