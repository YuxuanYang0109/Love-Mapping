// pages/map/map.js
Page({
  data: {
    // Map view
    latitude: 31.2304,
    longitude: 121.4737,
    scale: 6,
    markers: [],

    // UI safe area
    topInset: 0,
    segTopPx: 50,
    segLeftPx: 12,

    // Segment control state
    activeTab: 'map', // 'map' | 'time'

    // Marker click popup
    markerRecords: [],
    popupVisible: false,
    popup: {
      authorName: '',
      timeText: '',
      location: '',
      text: '',
      photoUrl: ''
    }
  },

  onLoad() {
    if (!getApp().isLoggedIn()) {
      wx.redirectTo({ url: '/pages/index/index' });
      return;
    }

    // Safe area
    const sys = wx.getSystemInfoSync();
    const safeTop = sys.safeArea && sys.safeArea.top ? sys.safeArea.top : 0;
    const statusBar = sys.statusBarHeight || 0;
    const topInset = Math.max(safeTop, statusBar);
    const segPos = this._calcSegPosition(sys, topInset);
    this.setData({
      topInset,
      segTopPx: segPos.topPx,
      segLeftPx: segPos.leftPx
    });

    // Center map to current location (silent fail)
    wx.getLocation({
      type: 'gcj02',
      success: (res) => {
        this.setData({
          latitude: res.latitude,
          longitude: res.longitude
        });
      }
    });
  },

  _calcSegPosition(sys, topInset) {
    let topPx = topInset + 10;
    let leftPx = 12;
    const segHeightPx = 36; // 72rpx on 750rpx design width

    try {
      if (typeof wx.getMenuButtonBoundingClientRect === 'function') {
        const menu = wx.getMenuButtonBoundingClientRect();
        if (menu && typeof menu.top === 'number' && typeof menu.height === 'number') {
          const centerAlignedTop = menu.top + (menu.height - segHeightPx) / 2;
          topPx = Math.max(topPx, Math.round(centerAlignedTop));
        }
        if (
          menu &&
          typeof menu.right === 'number' &&
          typeof sys.windowWidth === 'number'
        ) {
          const sideGap = Math.max(0, Math.round(sys.windowWidth - menu.right));
          leftPx = Math.max(12, sideGap);
        }
      }
    } catch (e) {
      console.warn('calc seg position failed:', e);
    }

    return { topPx, leftPx };
  },

  onShow() {
    if (!getApp().isLoggedIn()) {
      wx.redirectTo({ url: '/pages/index/index' });
      return;
    }

    this.setData({ activeTab: 'map', popupVisible: false });
    this.loadMarkers();
  },

  // Seg toggle (component)
  onSegChange(e) {
    const tab = e.detail.tab;
    if (tab === 'time') {
      this.setData({ activeTab: 'time' });
      wx.navigateTo({ url: '/pkg_timeline/timeline/timeline' });
    } else {
      this.setData({ activeTab: 'map' });
    }
  },

  // Bottom record button
  goRecord() {
    wx.navigateTo({ url: '/pkg_record/record/record' });
  },

  // Icon by mood quadrant
  moodToHeartIcon(x, y) {
    if (typeof x !== 'number' || typeof y !== 'number') return '/images/heart_blue.png';
    if (x >= 0 && y >= 0) return '/images/heart_yellow.png';
    if (x >= 0 && y < 0)  return '/images/heart_green.png';
    if (x < 0 && y >= 0)  return '/images/heart_red.png';
    return '/images/heart_blue.png';
  },

  _formatTime(ts) {
    const d = new Date(ts);
    const pad = (n) => (n < 10 ? '0' + n : '' + n);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  },

  _authorNameByOpenid(openid) {
    return (openid === 'oNC1n16o2-FfWR0zf6W1KRbplq14') ? '小杨宝' : '小林宝';
  },

  async loadMarkers() {
    const db = wx.cloud.database();

    try {
      const res = await db.collection('record')
        .orderBy('happenedAt', 'desc')
        .limit(200)
        .get();

      // Keep only records with coords
      const rows = (res.data || []).filter(r => typeof r.lat === 'number' && typeof r.lng === 'number');

      // Markers and records align by index; markerId = idx+1
      const markers = rows.map((r, idx) => ({
        id: idx + 1,
        latitude: r.lat,
        longitude: r.lng,
        iconPath: this.moodToHeartIcon(r.moodX, r.moodY),
        width: 28,
        height: 28
      }));

      this.setData({ markers, markerRecords: rows });
    } catch (e) {
      console.error('loadMarkers failed:', e);
      wx.showToast({ title: '加载点位失败', icon: 'none' });
    }
  },

  async onMarkerTap(e) {
    const markerId = e.detail.markerId; // 1..N
    const idx = markerId - 1;
    const rec = this.data.markerRecords[idx];
    if (!rec) return;

    const happenedAt = typeof rec.happenedAt === 'number' ? rec.happenedAt : (rec.createdAt || Date.now());
    const timeText = this._formatTime(happenedAt);
    const authorName = this._authorNameByOpenid(rec._openid || '');

    // photo: fileID -> temp URL
    let photoUrl = '';
    if (rec.photoFileId) {
      try {
        const tmp = await wx.cloud.getTempFileURL({ fileList: [rec.photoFileId] });
        const one = tmp.fileList && tmp.fileList[0];
        photoUrl = (one && one.tempFileURL) ? one.tempFileURL : '';
      } catch (err) {
        console.error('getTempFileURL failed:', err);
      }
    }

    this.setData({
      popupVisible: true,
      popup: {
        authorName,
        timeText,
        location: rec.location || '',
        text: rec.text || '（无文案）',
        photoUrl
      }
    });
  },

  closePopup() {
    this.setData({ popupVisible: false });
  },

  onMaskTap() {
    this.closePopup();
  },

  stopTap() {}
});
