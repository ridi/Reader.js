import _Content from '../common/_Content';

export default class Content extends _Content {
  /**
   * @param {Number} screenWidth
   * @param {Number} screenHeight
   */
  reviseImagesInSpine(screenWidth, screenHeight) {
    const elList = [];
    const els = this.images;
    const tryReviseImages = () => {
      if (els.length === elList.length) {
        const results = [];
        elList.forEach((el) => {
          const result = this.reviseImage(el, screenWidth, screenHeight);
          if (result.width.length || result.height.length || result.position.length) {
            results.push({
              el,
              width: result.width,
              height: result.height,
              position: result.position,
            });
          }
        });

        //
        // * 보정된 스타일 반영.
        //
        results.forEach((result) => {
          const { el, width, height, position } = result;
          if (width.length) {
            el.style.width = width;
          }
          if (height.length) {
            el.style.height = height;
          }
          if (position.length) {
            el.style.position = position;
          }
        });
        this.isImagesRevised = true;
      }
    };

    this.isImagesRevised = false;

    for (let i = 0; i < els.length; i += 1) {
      const el = els[i];
      if (el.complete) {
        elList.push(el);
      } else {
        el.setAttribute('src', `${el.getAttribute('src')}?stamp=${Math.random()}`);
        el.addEventListener('load', () => { // 이미지 로드 완료
          elList.push(el);
          tryReviseImages();
        });
        el.addEventListener('error', () => { // 이미지 로드 실패
          elList.push(null);
          tryReviseImages();
        });
      }
    }

    tryReviseImages();
  }

  /**
   * @param {string} id
   * @returns {string}
   */
  getRectFromElementId(id) {
    const rect = super.getRectFromElementId(id);
    if (rect) {
      const { left, top, width, height } = this._reader.rectToAbsolute(rect);
      return `${left},${top},${width},${height}`;
    }
    return '0,0,0,0';
  }
}
