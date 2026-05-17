Page({
  data: {
    items: [],
    loading: false,
    noMore: false,
    pageSize: 20,
    cursorTime: null,
    activeTab: 'time',
    topInset: 0,
    segTopPx: 50,
    segLeftPx: 12
  },

  onLoad() {
    if (!getApp().isLoggedIn()) {
      wx.redirectTo({ url: '/pages/index/index' });
      return;
    }

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
    this.reload();
  },

  onShow() {
    if (!getApp().isLoggedIn()) {
      wx.redirectTo({ url: '/pages/index/index' });
    }
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

  onSegChange(e) {
    const tab = e.detail.tab;
    if (tab === 'map') wx.navigateBack({ delta: 1 });
    else this.setData({ activeTab: 'time' });
  },

  async reload() {
    this.setData({ items: [], noMore: false, cursorTime: null });
    await this.loadMore();
  },

  async loadMore() {
    if (this.data.loading || this.data.noMore) return;
    this.setData({ loading: true });

    try {
      const db = wx.cloud.database();
      const _ = db.command;

      let q = db.collection('record');
      if (this.data.cursorTime !== null) {
        q = q.where({ happenedAt: _.lt(this.data.cursorTime) });
      }

      const res = await q
        .orderBy('happenedAt', 'desc')
        .limit(this.data.pageSize)
        .get();

      const rows = res.data || [];
      if (rows.length === 0) {
        this.setData({ noMore: true });
        return;
      }

      // 照片临时链接
      const fileList = rows
        .map(r => r.photoFileId)
        .filter(fid => typeof fid === 'string' && fid.length > 0);

      const tempUrlMap = {};
      if (fileList.length > 0) {
        const tmp = await wx.cloud.getTempFileURL({ fileList });
        (tmp.fileList || []).forEach(it => {
          if (it.fileID && it.tempFileURL) tempUrlMap[it.fileID] = it.tempFileURL;
        });
      }

      const items = rows.map(r => this._decorateRow(r, tempUrlMap));

      const last = rows[rows.length - 1];
      const nextCursor = last && typeof last.happenedAt === 'number' ? last.happenedAt : null;

      this.setData({
        items: this.data.items.concat(items),
        cursorTime: nextCursor,
        noMore: rows.length < this.data.pageSize
      });
    } catch (e) {
      console.error(e);
      wx.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  },

  _decorateRow(r, tempUrlMap) {
    const happenedAt =
      typeof r.happenedAt === 'number'
        ? r.happenedAt
        : (typeof r.createdAt === 'number' ? r.createdAt : Date.now());

    const timeText = this._formatTime(happenedAt);

    // 颜色：保留情绪色，但不显示 tag
    const baseColor = this._moodColor(r.moodX, r.moodY);
    const cardBg = this._hexToRgba(baseColor, 0.16);
    const cardBorder = this._hexToRgba(baseColor, 0.35);

    const recordOpenid = r._openid || '';
    const authorName = (recordOpenid === 'oNC1n16o2-FfWR0zf6W1KRbplq14') ? '小杨宝' : '小林宝';
    const avatarText = (recordOpenid === 'oNC1n16o2-FfWR0zf6W1KRbplq14') ? '杨' : '林';
    const avatarBg = this._hexToRgba(baseColor, 0.28);
    const avatarUrl = (recordOpenid === 'oNC1n16o2-FfWR0zf6W1KRbplq14')
      ? '/images/avatar_yang.png'
      : '/images/avatar_lin.png';

    const photoUrl = r.photoFileId ? (tempUrlMap[r.photoFileId] || '') : '';

    return {
      _id: r._id,
      happenedAt,
      timeText,

      // 列表只显示 location + photo
      location: r.location || '',

      photoUrl,

      // 点击弹窗要用到
      text: r.text || '',
      moodSummary: r.moodSummary || '',

      // 视觉字段
      cardBg,
      cardBorder,
      authorName,
      avatarText,
      avatarUrl,
      avatarBg
    };
  },

  // 四象限色
  _moodColor(x, y) {
    if (typeof x !== 'number' || typeof y !== 'number') return '#999999';
    if (x >= 0 && y >= 0) return '#FCC959'; // 右上
    if (x >= 0 && y < 0)  return '#88B64D'; // 右下
    if (x < 0 && y >= 0)  return '#EE6A74'; // 左上
    return '#4BB4EA';                       // 左下
  },

  _hexToRgba(hex, a) {
    const h = (hex || '').replace('#', '');
    if (h.length !== 6) return `rgba(0,0,0,${a})`;
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    return `rgba(${r},${g},${b},${a})`;
  },

  _formatTime(ts) {
    const d = new Date(ts);
    const pad = (n) => (n < 10 ? '0' + n : '' + n);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  },

  openItem(e) {
    const id = e.currentTarget.dataset.id;
    const item = this.data.items.find(it => it._id === id);
    if (!item) return;

    // 点击后才展示 text（满足你的要求）
    wx.showModal({
      title: item.timeText,
      content: `${item.text || '（宝宝什么都没说）'}`,
      showCancel: false
    });
  }
});
