# Reader.js
[![Build Status](https://travis-ci.org/ridi/Reader.js.svg?branch=master)](https://travis-ci.org/ridi/Reader.js)

Javascript library for RIDI EPUB Viewer written in ECMAScript 6

## Install
```
$ npm install @ridi/reader.js
```

## Structure
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

## Compatibility
- iOS 8-11
- Android 4-8 (API Level 14-26)
- Chrome 30~64
- Safari 9~11
- IE 11

## Usage

```js
import { Reader, Context, Util } from '@ridi/reader.js/[android|ios|web]';
```

### Terms

- **`offset`**: 화면 내 위치를 나타내는 zero-based 오프셋 값, 페이지 보기의 경우 `pageOffset`, 스크롤 보기의 경우 `scrollY` 값을 의미
- **`rect`**: 화면 내 범위를 나타내는 [DOMRect](https://developer.mozilla.org/en-US/docs/Web/API/DOMRect)를 변형한 `MutableClientRect`(`x`, `y`, `width`, `height`, `top`, `left`, `right`, `bottom` 값을 가지고 있음)
- **`range`**: [Range](https://developer.mozilla.org/ko/docs/Web/API/Range) 객체
- **`node location`**: (스파인 내) 위치를 나타내는 자체 포맷 (예: `31#0`)
- **`serialized range`**: (스파인 내) 범위를 나타내는 포맷, [Range 라이브러리에서 제공하는 serialization format](https://github.com/timdown/rangy/wiki/Serializer-Module#serialization-format) 사용 (예: `0/171:0,0/171:30`)
- **`anchor`**: HTML anchor 링크의 `id` 애트리뷰트 값

### APIs

#### 선택 영역 관리

- 렌더링에는 관여하지 않고 선택 영역에 대한 관리만 담당

- **`sel.startSelectionMode(x, y)`**
    - `mousedown`, `touch` 이벤트 등 발생 시 위 함수를 호출해 선택 모드로 진입
- **`sel.expandUpperSelection(x, y)`** 또는 **`sel.expandLowerSelection(x, y)`**
	- 선택 방향에 따라 호출
	- 여기에서 `upper`, `lower`는 선택 영역 양 끝에 나타나는 핸들을 의미
- **`sel.getSelectedRange()`**
	- 선택 영역을 *`range`* 로 반환

#### 독서노트 저장/이동

- **`sel.getSelectedSerializedRange()`**
	- 선택 영역을 *`serialized range`* 포맷으로 반환
- **`getOffsetFromSerializedRange(serializedRange)`**
	- *`serialized range`* 를 *`offset`* 으로 변환

#### 목차 이동

- **`getOffsetFromAnchor(anchor)`**
	- *`anchor`* 의 위치를  *`offset`* 으로 변환

#### 검색

- **`searchText(keyword)`**
	- 검색 결과를 *`serialized range`* 포맷으로 반환
- **`textAroundSearchResult(pre, post)`**
	- 검색 결과의 전/후 일부 문장을 포함해 반환
- **`getPageOfSearchResult()`**
	- 검색 결과의 `pageOffset` 값을 반환
- **`getRectsOfSearchResult()`**
	- 검색 결과의 *`rect`* 객체를 배열로 반환

#### 링크

- **`content.getLinkFromElement(el)`**
	- 특정 엘리먼트가 `<a>` 태그(이거나 그 부모가 `<a>` 태그)일 경우 그 정보(`node`, `href`, `type`)를 반환
	- `type`으로 `epub:type` 애트리뷰트의 값 반환 (예: 팝업 주석 링크일 경우 `type: 'noteref'`)

#### 이미지

- **`content.reviseImage(imgEl, screenWidth, screenHeight)`**
    - 이미지 크기를 조정해 이미지가 페이지를 벗어나는 일이 없도록 함
    - 사용 후 페이지 계산 필요
- **`content.getSvgElementFromPoint(x, y)`**
	- `mouseup`, `touch` 이벤트 등 발생 시 해당 포인트에 `<svg>` 태그 존재 여부 확인
	- `<svg>` 태그가 존재하는 경우 태그의 전체 내용을 문자열로 반환
- **`content.getImagePathFromPoint(x, y)`**
	- `mouseup`, `touch` 이벤트 등 발생 시 해당 포인트에 `<img>` 태그 존재 여부 확인
	- `<img>` 태그가 존재하는 경우 `src` 애트리뷰트 값 반환

#### TTS

- `/common/tts/` 디렉토리 참조
- *`node location`* 기반으로 구현됨


## Development

### Install
You can install it with the following command:
```
$ git clone git@github.com:ridi/Reader.js.git
$ make setup
```

### Build
You can build it with the following command in Reader.js folder:
```
$ npm run [build|watch]
```
> [grunt-cli](https://github.com/gruntjs/grunt-cli) is required to build Reader.js
