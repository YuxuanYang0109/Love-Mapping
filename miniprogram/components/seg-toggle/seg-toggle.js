Component({
  properties: {
    // 当前选中：'map' | 'time'
    active: { type: String, value: 'map' },

    // 放置位置（px，方便 safeArea/topInset）
    topPx: { type: Number, value: 50 },
    leftPx: { type: Number, value: 12 },

    // 滑动触发阈值
    swipeThreshold: { type: Number, value: 30 }
  },

  data: {
    _startX: 0
  },

  methods: {
    onTap(e) {
      const tab = e.currentTarget.dataset.tab;
      this.triggerEvent('change', { tab });
    },

    onTouchStart(e) {
      this.setData({ _startX: e.touches[0].clientX });
    },

    onTouchEnd(e) {
      const startX = this.data._startX || 0;
      const endX = e.changedTouches[0].clientX;
      const dx = endX - startX;

      if (Math.abs(dx) < this.data.swipeThreshold) return;

      if (dx < 0) {
        this.triggerEvent('change', { tab: 'time' });
      } else {
        this.triggerEvent('change', { tab: 'map' });
      }
    }
  }
});