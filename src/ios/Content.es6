import _Content from '../common/_Content';

export default class Content extends _Content {
  /**
   * @param {Number} pageWidthUnit
   * @param {Number} pageHeightUnit
   */
  reviseImagesInSpine(pageWidthUnit, pageHeightUnit) {
    const elList = [];
    const els = this.images;
    const tryReviseImages = () => {
      if (els.length === elList.length) {
        const results = [];
        elList.forEach((el) => {
          const result = this.reviseImage(el, pageWidthUnit, pageHeightUnit);
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
          const el = result.el;
          if (result.width.length) {
            el.style.width = result.width;
          }
          if (result.height.length) {
            el.style.height = result.height;
          }
          if (result.position.length) {
            el.style.position = result.position;
          }
        });
        this.isImagesRevised = true;
      }
    };

    this.isImagesRevised = false;

    for (let i = 0; i < els.length; i++) {
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
}
