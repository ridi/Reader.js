# Reader.js

> 리디북스 EPUB 뷰어용(앱/웹) JS 라이브러리

[![Build Status](https://travis-ci.com/ridi/Reader.js.svg?branch=master)](https://travis-ci.com/ridi/Reader.js)
[![npm version](https://badge.fury.io/js/%40ridi%2Freader.js.svg)](https://badge.fury.io/js/%40ridi%2Freader.js)

## 설치

```
$ npm install @ridi/reader.js
```

## 구조

```
└─┬ root
  ├── LICENSE
  ├── package.json
  ├── README.md
  ├─┬ android
  | └─ index.js
  ├─┬ ios
  | └─ index.js
  └─┬ web
    └─ index.js
```

## 호환성

- iOS 8-12
- Android 4-8 (API Level 14-26)
- Chrome 60~74
- Safari 9~11
- IE 11

### 용어 정의

- **`offset`**: 화면 내 위치를 나타내는 제로 베이스 오프셋 값, 페이지 보기의 경우 `pageOffset`, 스크롤 보기의 경우 `scrollY` 값을 의미
- **`pageUnit`**: 한 페이지를 세는 단위, 페이지 보기의 경우 `columnWidth + columnGap`, 스크롤 보기의 경우 `screenHeight` 값을 의미
- **`content`**: 스파인을 의미
- **`rect`**: 화면 내 영역을 나타내는 [DOMRect](https://developer.mozilla.org/en-US/docs/Web/API/DOMRect)를 변형한 [Rect](./src/common.Rect.js)를 의미
- **`rectList`**: `Rect`를 요소로 다루는 배열 [RectList](./src/common/RectList.js)를 의미
- **`range`**: [Range](https://developer.mozilla.org/ko/docs/Web/API/Range) 객체
- **`nodeLocation`**: (스파인 내) 위치를 나타내는 자체 포맷 (예: `31#0`)
- **`serializedRange`**: (스파인 내) 범위를 나타내는 포맷, [Rangy 라이브러리에서 제공하는 serialization format](https://github.com/timdown/rangy/wiki/Serializer-Module#serialization-format) 사용 (예: `0/171:0,0/171:30`)
- **`anchor`**: HTML anchor 링크의 `id` 애트리뷰트 값

## 사용법

### Reader 생성

- `Reader`는 뷰어 기능을 보조할뿐 실제 랜더링이나 페이징, 실질적인 기능 구현은 플랫폼에 맞춰 각각 구현해야 한다.

```js
import { Reader, Context, Util, Rect, RectList } from '@ridi/reader.js/[android|ios|web]';

const context = Context.build((context) => {
  context.width = 300;
  context.height = 450;
  context.gap = 0;
  ...
});
const reader = new Reader(context);
```

### [Context](./src/common/Context.js) 업데이트

- `Context`는 `Reader`가 정상 동작하기 위해 필요한 최소한의 상태 값이다.
- 각 값에 변화가 있을 때 반드시 업데이트해야 한다.

```js
// 직접 변경은 할 수 없음
reader.context.width = 320;
// 새로운 Context 객체로 대체만 가능
reader.context = Context.build(...);
```

### Content 설정

- `Reader` 생성 이후 언제든 설정이 가능하다.

```js
// 싱글 스파인 기반일 때
reader.setContent(document.body, document.documentElement);
// 멀티 스파인 기반일 때
reader.setContents([spineRefs], spineWrapperRef);
```

### Content 가져오기

- 해당하는 `Content`가 없으면 `null`을 반환한다.

```js
const content = reader.getContent(spineIndex or spineRef);
```

### 이미지 보정

- 랜더링 이후 이미지의 크기나 비율이 원본과 다를 경우 일그러지거나 다른 페이지로 이어지게 되는 등의 문제를 보정해준다.
- 페이징 결과에 영향을 주기 때문에 페이징 전에 선행되어야 한다.
- 호출 시점의 `context.width`, `context.height`를 기준으로 보정하기 때문에 화면 크기가 변하거나 콘텐츠를 다시 로드할 때 재호출이 필요하다.

```js
reader.getContent(spineIndex).reviseImages(() => {
  // 이미지 보정 작업이 완료됨
});
```

### 클릭/터치 지점의 엘리먼트 얻기

- `document.elementFromPoint`와 동일한 기능이다.
- `Context.isSameDomAsUi`가 `true`인 경우 `hitTest`를 무시하고, 특정 콘텐츠 내에서만 찾는다.

```js
const element = reader.getContent(spineIndex).elementFromPoint(x, y{, tag});
```

### 클릭/터치 지점의 이미지 얻기

- 클릭/터치 지점에 이미지(`img`)가 없거나 `src` 애트리뷰트가 없는 경우 `null`을 반환한다.
- `이미지 확대 보기 기능`을 구현할 때 사용한다.

```js
const image = reader.getContent(spineIndex).imageFromPoint(x, y);
// image: { id: 'img-1', element: ..., src: '../Images/0001.jpg', rect: ... }
```

### 클릭/터치 지점의 SVG 얻기

- 클릭/터치 지점에 `svg`가 없으면 `null`을 반환한다.
- `이미지 확대 보기 기능`을 구현할 때 사용한다.

```js
const svg = reader.getContent(spineIndex).svgFromPoint(x, y);
// svg: { id: 'svg-1', element: ..., html: '<svg width="298px" height="120px" ...>...</svg>', rect: ... }
```

### 클릭/터치 지점의 링크 정보 얻기

- 클릭/터치 지점에 `a`가 없으면 `null`을 반환한다.
- `내부 링크 및 팝업 주석 기능`을 구현할 때 사용한다.

```js
const link = reader.getContent(spineIndex).linkFromPoint(x, y);
// link: { node: ..., href: '../Text/Section0001.html#fn02', type: 'noteref' }
```

### 특정 `anchor`의 위치(`offset`) 구하기

- 위치를 찾을 수 없으면 `null`을 반환한다.
- `목차 이동 기능`을 구현할 때 사용한다.

```js
const offset = reader.getContent(spineIndex).getOffsetFromAnchor(anchor);
```

### 특정 `serializedRange`의 위치(`offset`) 구하기

- 위치를 찾을 수 없으면 `null`을 반환한다.
- `독서노트 저장 및 이동, 텍스트 선택, 검색 결과 이동`을 구현할 때 사용한다.

```js
const offset = reader.getContent(spineIndex).getOffsetFromSerializedRange(serializedRange);
```

### 특정 `serializedRange`의 `RectList` 구하기

- `rectList`를 못 구하면 빈 리스트를 반환한다.
- `특정 영역을 하이라이팅하는 기능`을 구현할 때 사용한다.

```js
const rectList = reader.getContent(spineIndex).getRectListFromSerializedRange(serializedRange);
```

### 특정 `nodeLocation`의 위치(`offset`) 구하기

- 위치를 찾을 수 없으면 `null`을 반환한다.
- `type` 생략 시 `top`으로 간주한다.
- `마지막 페이지 동기화 정확도 향상`을 위해 사용한다.

```js
const offset = reader.getContent(spineIndex).getOffsetFromNodeLocation(nodeLocation or string, type);
```

### 현재 페이지의 `nodeLocation` 구하기

- `type`에 따라 현재 페이지의 최상단(`top`) 또는 최하단(`bottom`)의 `nodeLocation`을 구할 수 있다. 생략 시 `top`을 구한다.
- `nodeLocation`을 구할 수 없으면 `-1#-1`을 반환한다. (Android 제외)
- `마지막 페이지 동기화 정확도 향상`을 위해 사용한다.

```js
const nodeLocation = reader.getContent(spineIndex).getCurrentNodeLocation(type);
```

### `nodeLocation` 디버깅하기

- 마지막으로 구한 `nodeLocation`을 화면에 표시한다.

```js
reader.debugNodeLocation = true;
reader.getContent(spineIndex).showNodeLocationIfDebug();
```

### 엘리먼트 숨기기

```js
reader.getContent(spineIndex).setHidden(hidden, element or id);
```

### 본문 검색하기

- `reader.searchText`에서 `window.find`를 이용해 키워드를 검색한다.
	- 한번 호출할 때 매칭되는 검색 결과 하나를 반환한다.
	- 더 이상 매칭되는 검색 결과가 없는 경우 `null`을 반환한다.
- `reader.searchText`의 반환값이 `null`이 아닐 때 다음 메소드를 사용할 수 있다.
	- `reader.getSurroundingTextForSearchResult`: 검색 결과의 전/후 일부 문자열을 구한다. (키워드 포함)
	- `reader.getRectListFromSearchResult`: 검색 결과를 하이라이트하기 위한 `Rect`를 구한다.
	- `reader.getPageFromSearchResult`: 검색 결과가 위치한 제로 베이스 페이지를 구한다.
- `검색 기능`을 구현할 때 사용한다.

```js
// Android, iOS
let serializedRange = null;
while ((serializedRange = reader.searchText(keyword)) !== null) {
  const text = reader.getSurroundingTextForSearchResult(10, 100);
  const rectList = reader.getRectListFromSearchResult();
  const page = reader.getPageFromSearchResult();
}
```
```js
// Web
let result = null;
while ((result = reader.searchText(keyword)) !== null) {
  const {
    serializedRange,
    rectList,
    text,
    page,
  } = result;
}
```

### 텍스트 선택 시작하기

- `Sel`은 랜더링에 관여하지 않고 선택하기 상태와 결과만 관리한다.
- `텍스트 선택하기 기능`을 개발할 때 사용한다.

```js
const isSuccess = reader.getContent(spineIndex).sel.start(x, y);
```

### 아래쪽으로 선택 확장하기

- `sel.start`가 반드시 한번 이상 선행되어야 한다.

```js
const isSuccess = reader.getContent(spineIndex).sel.expandIntoLower(x, y);
```

### 위쪽으로 선택 확장하기

- `sel.start`가 반드시 한번 이상 선행되어야 한다.

```js
const isSuccess = reader.getContent(spineIndex).sel.expandIntoUpper(x, y);
```

### 다음 페이지로 선택 확장하기

- `sel.start`가 반드시 한번 이상 선행되어야 한다.
- 페이지 보기가 아닌 경우 항상 실패한다.

```js
const isSuccess = reader.getContent(spineIndex).sel.expandIntoNextPage();
```

### 다음 페이지로 선택 확장하기가 가능한지 확인하기

- `sel.start`가 반드시 한번 이상 선행되어야 한다.

```js
const isContinuable = reader.getContent(spineIndex).sel.isExpandContinuableIntoNextPage;
```

### 텍스트 선택 결과 가져오기

- `sel.start`가 반드시 한번 이상 선행되어야 한다.

```js
const { sel } = reader.getContent(spineIndex);
sel.getRange();
sel.getSerializedRange();
sel.getRectList();
sel.getText();
```

### `Rect`의 페이지 구하기

```js
const page = reader.getContent(spineIndex).getPageFromRect(rect);
```

## 개발환경

### 설치

```
$ git clone git@github.com:ridi/Reader.js.git
$ make setup
```

### 빌드

```
$ npm run [build|watch]
```

또는

```
# --debug 옵션 사용 시 uglify를 생략
$ grunt [{defulat}|lint|clean|show-config] {--debug=true}
```
> [grunt-cli](https://github.com/gruntjs/grunt-cli) 필요
