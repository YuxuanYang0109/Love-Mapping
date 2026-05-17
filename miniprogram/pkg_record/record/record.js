Page({
  data: {
    // Photo (0/1)
    photoPath: "",

    // Text
    text: "",

    // Mood (continuous)
    areaW: 0,          // px
    areaH: 0,          // px
    dotSizePx: 22,     // 估计值：拖拽点半径（用于边界与归一化）
    dotX: 0,           // px
    dotY: 0,           // px
    moodX: null,       // [-1,1]
    moodY: null,       // [-1,1]
    moodXText: "--",
    moodYText: "--",
    moodSummary: "请拖动黑点选择心情",

    // Location (optional)
    hasLocation: false,
    lat: null,
    lng: null,
    latText: "--",
    lngText: "--",
    location: "",

    // Submit
    submitting: false,

    topInset: 0
  },

  onLoad() {
    if (!getApp().isLoggedIn()) {
      wx.redirectTo({ url: '/pages/index/index' });
      return;
    }

    const sys = wx.getSystemInfoSync();
    const safeTop = sys.safeArea && sys.safeArea.top ? sys.safeArea.top : 0;
    const statusBar = sys.statusBarHeight || 0;
    this.setData({ topInset: Math.max(safeTop, statusBar) });
  },

  onShow() {
    if (!getApp().isLoggedIn()) {
      wx.redirectTo({ url: '/pages/index/index' });
    }
  },

  onReady() {
    // 测量 moodArea 实际像素尺寸，初始化拖拽点在中心
    wx.createSelectorQuery()
      .in(this)
      .select("#moodArea")
      .boundingClientRect((rect) => {
        if (!rect) return;

        const areaW = rect.width;
        const areaH = rect.height;

        // 放在中心
        const cx = Math.max(0, (areaW / 2) - this.data.dotSizePx);
        const cy = Math.max(0, (areaH / 2) - this.data.dotSizePx);

        this.setData({
          areaW,
          areaH,
          dotX: cx,
          dotY: cy
        });

        // 默认中心点 = (0,0)
        this._updateMoodFromDot(cx, cy);
      })
      .exec();
  },

  // -------- Photo --------
  choosePhoto() {
    wx.chooseMedia({
      count: 1,
      mediaType: ["image"],
      sourceType: ["album", "camera"],
      success: (res) => {
        const file = res.tempFiles && res.tempFiles[0];
        if (!file) return;
        this.setData({ photoPath: file.tempFilePath });
      },
      fail: () => {}
    });
  },

  previewPhoto() {
    if (!this.data.photoPath) return;
    wx.previewImage({
      urls: [this.data.photoPath]
    });
  },

  removePhoto() {
    this.setData({ photoPath: "" });
  },

  // -------- Text --------
  onTextInput(e) {
    this.setData({ text: e.detail.value || "" });
  },

  onLocationInput(e) {
    this.setData({ location: e.detail.value || "" });
  },

  // -------- Mood --------
  onDotChange(e) {
    // movable-view 的 x/y 是 px
    const x = e.detail.x;
    const y = e.detail.y;
    this._updateMoodFromDot(x, y);
  },

  _updateMoodFromDot(x, y) {
    const { areaW, areaH } = this.data;
    if (!areaW || !areaH) return;

    // 将点的左上角坐标映射到中心坐标（0~1）
    const dotR = this.data.dotSizePx;
    const usableW = Math.max(1, areaW - dotR * 2);
    const usableH = Math.max(1, areaH - dotR * 2);

    const cx = (x + dotR) / (usableW + dotR * 2); // 0~1
    const cy = (y + dotR) / (usableH + dotR * 2); // 0~1

    // 归一化到 [-1,1]，并把 Y 轴翻转：上=高唤醒(1)，下=低唤醒(-1)
    const moodX = this._clamp(cx * 2 - 1, -1, 1);
    const moodY = this._clamp((1 - cy) * 2 - 1, -1, 1);

    const moodXText = moodX.toFixed(2);
    const moodYText = moodY.toFixed(2);

    const moodSummary = this._makeMoodSummary(moodX, moodY);

    this.setData({
      moodX,
      moodY,
      moodXText,
      moodYText,
      moodSummary
    });
  },

  _makeMoodSummary(x, y) {
    // x: 愉悦度 [-1,1]，y: 唤醒度 [-1,1]（你这里用 y>=0 表示“不累”，y<0 表示“累”）
    const intensity = Math.sqrt(x * x + y * y); // 0~1.41
    const level = intensity > 0.95 ? 3 : intensity > 0.6 ? 2 : 1; // 1弱 2中 3强
  
    const happy = x >= 0;
    const rested = y >= 0;
  
    // 4 象限 + 3 强度：用更像人说话的短句
    const table = {
      happy_rest: [
        "有点开心！不太累～",
        "挺开心的！一点不累！",
        "我好开心！！一点都不累！！"
      ],
      happy_tired: [
        "有点开心，但我有点累…",
        "开心是开心，就是有点累。",
        "我超开心！但真的好累啊…"
      ],
      sad_rest: [
        "不太开心…但还不算累。",
        "有点不开心，不过还撑得住。",
        "我真的不太开心…但我还不累。"
      ],
      sad_tired: [
        "不太开心…我也有点累。",
        "我好累啊…而且不太开心。",
        "我真的好累…也很不开心。"
      ]
    };
  
    const key =
      (happy ? "happy" : "sad") + "_" + (rested ? "rest" : "tired");
  
    return table[key][level - 1];
  },

  _clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  },

  // -------- Location (optional) --------
  getLocation() {
    wx.getLocation({
      type: "gcj02",
      success: (res) => {
        const lat = res.latitude;
        const lng = res.longitude;
        this.setData({
          hasLocation: true,
          lat,
          lng,
          latText: lat.toFixed(6),
          lngText: lng.toFixed(6)
        });
      },
      fail: () => {
        wx.showToast({
          title: "定位失败，可直接提交",
          icon: "none"
        });
      }
    });
  },

  clearLocation() {
    this.setData({
      hasLocation: false,
      lat: null,
      lng: null,
      latText: "--",
      lngText: "--"
    });
  },

  // -------- Submit --------
  async submit() {
    if (this.data.submitting) return;

    // 心情必选（moodX/moodY 在 onReady 会初始化到中心，因此通常不会是 null）
    if (this.data.moodX === null || this.data.moodY === null) {
      wx.showToast({ title: "请先选择心情", icon: "none" });
      return;
    }

    this.setData({ submitting: true });

    try {
      // 1) 可选：上传照片
      let photoFileId = "";
      if (this.data.photoPath) {
        if (!wx.cloud) {
          throw new Error("未检测到 wx.cloud，请先开通云开发或移除上传逻辑");
        }

        const cloudPath = `records/${Date.now()}_${Math.floor(Math.random() * 10000)}.jpg`;
        const up = await wx.cloud.uploadFile({
          cloudPath,
          filePath: this.data.photoPath
        });
        photoFileId = up.fileID || "";
      }

      // 2) 写入数据库
      if (!wx.cloud) {
        throw new Error("未检测到 wx.cloud，请先开通云开发");
      }

      const db = wx.cloud.database();
      const now = Date.now();

      const doc = {
        text: this.data.text || "",
        moodX: this.data.moodX,
        moodY: this.data.moodY,
        moodSummary: this.data.moodSummary,
        lat: this.data.hasLocation ? this.data.lat : null,
        lng: this.data.hasLocation ? this.data.lng : null,
        location: this.data.location || "",
        photoFileId: photoFileId || "",
        createdAt: now,
        happenedAt: now  // MVP 先等同于创建时间，后面再做可编辑
      };

      await db.collection("record").add({ data: doc });

      wx.showToast({ title: "已呼叫", icon: "success" });

      // 返回地图页（地图页 onShow 再刷新 markers）
      setTimeout(() => {
        wx.navigateBack({ delta: 1 });
      }, 600);

    } catch (err) {
      console.error(err);
      wx.showToast({
        title: "提交失败（看控制台日志）",
        icon: "none"
      });
    } finally {
      this.setData({ submitting: false });
    }
  }
});
