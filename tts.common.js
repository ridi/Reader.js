// tts.common.js

//
// * TTS 노트.
//
//    * 문단 나누기 규칙.
//
//    1. 텍스트가 없는 노드는 무시한다.
//    2. 읽을 수 없는 문자만 가지고 있는 노드는 무시한다.
//        - space(\s), newline(\n), tab(\t), retrun carriage(\r) 등 공백문자는 읽을 수 없다.
//    3. 노드의 형제(Silbing) 중에 br 노드가 있을 때는 Chunk로 만든다.
//        - 마침표 또는 문장의 끝을 의미하는 문자 없이 newline 또는 br 태그가 쓰일 경우는 제목, 주제 등 의미를 부여하는 의도적인 줄 바꿈이기에 하나의 문장으로 봐야한다.
//             예) <h2>'성공하고 싶다'를<br>'행복해지고 싶다'로<br>바꾸자</h2>
//    4. 이미지 노드는 alt 속성에 한 자 이상의 문자가 있을 때만 Chunk로 만든다.
//        - 단, 접미에 이미지 파일 확장자가 있다면 무시한다. (이미지 파일명을 넣은 출판사가 종종 있다)
//        - alt가 있는데 0자일 때가 있다.
//             예) <img id="cover" src="front_cover.jpg" alt="">
//    5. 후리가나를 표시하는데 사용되는 ruby, rt, rp 노드는 무시한다.
//        - 후리가나는 주음부호, 한어병음, 한국 한자음이라고도 불린다.
//        - 단, 후리가나의 대상을 나타내는 rb는 무시하면 안 된다.
//             예) <ruby><rb>雪婆</rb><rt>ゆきば</rt></ruby>
//    6. 링크를 가진 sub, sup 노드는 무시한다. 링크가 없으면 Chunk로 만든다.
//        - sub, sup 안에 링크가 있을 수도 링크가 sub, sup를 포함하고 있을 수도 있다.
//             예) <sup><a id="comment_1">(1)</a></sup>
//    7. 한 문장 이상의 문장을 포함한 노드는 Chunk로 만든다.
//        - 단, 다수의 문장일 때는 문장 하나당 Chunk 하나로 만든다.
//        - 마지막 글자가 .|。|?|!|"|”|'|’|」|』 중 하나일 때 문장이라고 본다.
//    8. 다수의 문장을 나눌 때 사용되는 기준은 .|。|?|! 이렇게 네 개이다.
//        - 단, 기준이 발견된 문자의 다음 문자가 .|。|,|"|”|'|’|」|\]|\)|\r|\n 중 하나일 때는 문장으로 생각하지 않는다. (이는 대화체나 마침표가 반복적으로 사용된 문장을 잘라먹을 우려가 있기 때문이다)
//             예) <p>그가 '알았다고.' 말했잖아요?</p>
//    9. 한 문장이 되지 못하는 노드는 다음 노드와 합친다.
//        - 문장에서 특정 단어에 태그를 입혔을 때 그 단어 하나만 문장으로 구성될 우려가 있기 때문이다.
//             예) <p>제가 <b>하쿠나 마타타</b>라고 말하면 가는 겁니다.</p>
//        - 다음 노드에 대해서도 1~6번을 따른다.
//        - 다음 노드도 문장이 되지 못 한다면 다음 노드와 합친다.
//        - 마지막 노드를 만날 때까지 문장이 되지 못 한다면 Chunk로 만든다.
//
//
//    * 디오텍이 권장하는 텍스트 규칙.
//
//    1. 띄어쓰기, 철자, 구두점 등은 반드시 맞춤법에 맞아야 한다.
//    2. 마침표(.) 는 가능한 문장 마지막에만 사용한다.
//        - 마침표가 들어간 단어는 마침표를 없애거나 다른 기호로 바꿔 사용한다.
//             예) 출.도착 → 출도착
//    3. 띄어쓰기를 적절하게 사용한다.
//        - 기본적으로 한 어절 내에서는 쉬지 않고 그대로 연결해서 발음한다. 따라서, 어절이 길어질수록 명확성이 떨어진다.
//             예) “항공권분실”과 “항공권 분실”을 비교해 보자. 후자가 전자보다 “항공권”과 ”분실”을 좀더 명확하게 발음한다.
//        - 복합명사는 가급적 띄어쓰기를 하면 좋다.
//             예) 국내선스케줄 → 국내선 스케줄
//    4. 날짜 (년,월,일)
//        - 숫자와 한글(년,월,일)은 공백없이 붙여서 쓰고, 각 단위 사이는 띄어 쓴다.
//             예) 2002년 2월 22일 (이천이년 이월 이십이일)
//        - 슬래쉬(/)를 사용한 날짜 표기는 년, 월, 일 순으로 숫자와 슬래쉬(/) 사이에 공백 없이 입력한다.
//             예) 2002/2/22 (이천이년 이월 이십이일)
//    5. 시각 (시,분,초)
//        - 숫자와 한글(시,분,초)은 공백 없이 붙여서 쓰고, 각 단위 사이는 띄어 쓴다.
//             예) 12시30분30초 (열두시삼십분삼십초)
//        - 콜론(:)를 사용한 날짜 표기는 시, 분, 초 순으로 숫자와 콜론(:) 사이에 공백 없이 입력한다.
//             예) 12:30:30 (열두시 삼십분 삼십초)
//    6. 전화번호
//        - 대시(-)를 사용한 전화번호 표기는 숫자와 대시(-) 사이에 공백 없이 입력한다.
//             예) 02-2297-1450 (공이 이이구칠에 일사오공)
//    7. URL, E-mail 주소
//        - 시작은 반드시 영문 알파벳으로 시작하여야 한다.
//        - 사전에 등록되어 있는 단어는 사전의 발음대로 읽는다
//             예) http://www.hcilab.co.kr (에이취티티피 떠블류 떠블류 떠블류쩜 에이치씨아이랩쩜 씨오쩜 케이알)
//    8. 숫자와 단위
//        - 숫자와 단위는 붙여 쓴다.
//             예) 50,500원 (오만 오백 원), 13자리 (열세 자리)
//    9. 기타
//        - 기호는 특별한 경우를 제외하고 무시된다. 따라서 복합 명사처럼 만들기 위해서는 공백(‘ ‘)으로 대치하는 것이 좋다.
//             예) 서울/제주 → “서울 제주”
//
//
//    * 이것들은 어짜쓰까...
//
//    - 숫자에 제곱의 의미로 윗첨자가 붙었을 때. (숫자만 읽어버린다. 하하)
//    - span과 스타일을 이용해 윗첨자 또는 아랫첨자를 흉내냈을 때. (아오... 왜그러니.. 어소링 툴에 있을텐데 분명 =_=)
//    - 같은 의미의 한글과 영문 또는 외국어가 붙어있을 때.
//         예) <p>공작에 대한 경칭은 그레이스<span class="eng">grâce</span> ...</p> (span 없는 애도 있다.. 맙소사)
//         예) 로드는 색슨어로 <span class="eng">laford</span>이고, 고전 라틴어로 <span class="eng">dominus</span>이며, ...
//    - 게임 판타지 소설에서 자주 나오는 캐릭터 또는 장비 스테이터스. (이걸 다 읽어줘야 하나...)
//    - 문장으로 생각했는데 뒤에 붙어야할 애가 있다.
//         예) <h2>내 '안'<span>에서</span><br>천직<spa...
//

var TTSTextModifier = {
    modify: function(text) {
        text = TTSTextModifier.removeNewline(text);
        text = TTSTextModifier.removeHanja(text);
        text = TTSTextModifier.removeLatin(text);
        text = TTSTextModifier.replaceTilde(text);
        text = TTSTextModifier.replaceNumeric(text);

        return text;
    },

    // 소괄호 안에 뉴라인 문자가 있으면 읽지 않게 설정을해도 읽어버린다.
    removeNewline: function(text) {
        return text.replace(/[\n|\r]/, " ");
    },

    // 한자 단독으로 쓰이기보다 한글음과 같이 쓰일 때가 많아 중복 발음을 없애기 위해 한자를 지운다.
    // TDD - 한자 단독으로 쓰일 때는 어떻게 할껀가.
    removeHanja: function(text) {
        for (var i = 0; i < text.length; i++) {
            var code = text.charCodeAt(i);
            if (TTSTextModifier.isChineseCode(code)) {
                text = text.replace(text.substr(i, 1), " ");
            }
        }
        return text;
    },

    // 한글과 영문이 붙어 있을 때 이후에 오는 문자가 공백, 마침표를 의미한다거나 한글과 영문이 붙어 있다면, 영문을 제거한다.
    removeLatin: function(text) {
        var removeList = [];
        var textLength = text.length;
        var startOffset = -1, endOffset = -1, i, j, k;
        var ch, nextCh;
        var prevCode, code, nextCode;

        var add = function(start, end) {
            if (end - start > 1) {
                // 한글자 이상일 때만 지운다.
                removeList.push({startOffset: start, endOffset: end});
            }
            startOffset = -1;
        };

        for (i = 0; i < textLength; i++) {
            code = text.charCodeAt(i);
            if (0 < i && TTSTextModifier.isLatinCode(code)) {
                var isAbbr = false;
                prevCode = text.charCodeAt(i - 1);
                if (i + 1 < textLength) {
                    // 한글 옆에 붙은애는 알고보니 축약어였다!? -> 야는 지워선 안된다.
                    nextCode = text.charCodeAt(i + 1);
                    isAbbr = TTSTextModifier.isLatinCode(code, "u") & TTSTextModifier.isLatinCode(nextCode, "u");
                }
                if (!isAbbr && TTSTextModifier.isHangulCode(prevCode)) {
                    startOffset = i;
                }
                if (startOffset > 0) {
                    for (j = i + 1; j < textLength; j++) {
                        code = text.charCodeAt(j);
                        ch = text.charAt(j);
                        if (TTSTextModifier.isSpaceCode(code) || TTSTextModifier.isSentenceSuffix(ch)) {
                            if (j + 1 < textLength) {
                                var spaceCount = 1;
                                for (k = j + 1; k < textLength; k++) {
                                    nextCode = text.charCodeAt(k);
                                    if (TTSTextModifier.isSpaceCode(nextCode)) {
                                        spaceCount++;
                                        continue;
                                    }
                                    else if (TTSTextModifier.isLatinCode(nextCode)) {
                                        j = k;
                                        break;
                                    }
                                    else {
                                        add(startOffset, k - spaceCount);
                                        j = k - spaceCount;
                                        break;
                                    }
                                }// end for
                            } else {
                                add(startOffset, j);
                            }
                        }
                        else if (!TTSTextModifier.isLatinCode(code)) {
                            if (j + 1 < textLength) {
                                nextCode = text.charCodeAt(j + 1);
                                if (TTSTextModifier.isLatinCode(nextCode)) {
                                    j++;
                                    continue;
                                }
                            }
                            add(startOffset, j);
                        }
                        if (startOffset == -1) {
                            break;
                        }
                    }// end for
                    if (startOffset != -1) {
                        add(startOffset, textLength);
                    }
                }
            }
        }// end for

        var result = "";
        for (i = 0, startOffset = 0, endOffset = 0; i < removeList.length; i++) {
            endOffset = removeList[i].startOffset;
            result += text.substring(startOffset, endOffset);
            startOffset = removeList[i].endOffset;
        }
        result += text.substring(startOffset, textLength);
        return result;
    },

    // TDD - 틸드 문자 앞뒤로 공백이 있을때는 변수가 너무 많은데.
    // TDD - 그냥 없애버리는 것도 방법이지 않을까.
    replaceTilde: function(text) {
        var extendTable = ["아", "에", "아", "에", "어", "에", "어", "에", "오", "아", "에", "에", "오", "우", "어", "에", "이", "우", "으", "으", "이"];
        var textLength = text.length;
        var offset = -1;
        for (var i = 0; i < textLength; i++) {
            var code = text.charCodeAt(i);
            if (TTSTextModifier.isTildeCode(code)) {
                if (i > 0) {
                    for (var j = i - 1; j >= 0; j--) {
                        var prevCode = text.charCodeAt(j);
                        /* if (TTSTextModifier.isSpaceCode(prevCode)) {
                            continue;
                        }
                        else */ if (TTSTextModifier.isHangulCode(prevCode)) {
                            var medialCodeIndex = TTSTextModifier.getMedialCodeIndexInHangulCode(prevCode);
                            text = text.replace(text.substr(i, 1), extendTable[medialCodeIndex]);
                            offset = i;
                            break;
                        }
                        else {
                            break;
                        }
                    }// end for
                }
            }
        }// end for

        // 쉼표를 줘서 다음 문장 또는 단어와 바로 이어지지 않도록 한다.
        if (offset != -1) {
            var k;
            var insertRest = true;
            for (k = offset + 1; k < textLength; k++) {
                if (TTSTextModifier.isHangulCode(text.charCodeAt(k))) {
                    insertRest = false;
                    break;
                }
                else if (text[k] != "?" && text[k] != "!") {
                    break;
                }
            }
            if (insertRest) {
                if (textLength <= k) {
                    text += ",";
                }
                else {
                    text = text.substr(0, k) + "," + text.substr(k);
                }
            }
        }

        // '~'가 아닌 '∼'는 사용자 사전(CP949)에서 커버할 수 없어서 수동으로 바꿔준다.
        text = text.replace("∼", "에서");

        return text;
    },

    replaceNumeric: function(text) {
        // 영문 + 숫자 + 영문
        // 영문 + 숫자 + 끝
        // 시작 + 숫자 + 한글(장)

        var NONE = -1;
        var LATION = 0;
        var HANGUL = 1;

        var textLength = text.length;
        var match, pattern = /[\d]{1,}/gm;
        var i, code;
        while ((match = pattern.exec(text)) !== null) {
            var startOffset = match.index;
            var endOffset = pattern.lastIndex;
            var type = (startOffset === 0 ? HANGUL : NONE);
            var spaceCount = 0;
            for (i = startOffset - 1; i >= 0; i--) {
                code = text.charCodeAt(i);
                if (TTSTextModifier.isSpaceCode(code)) {
                    spaceCount++;
                    continue;
                }
                else if (i < startOffset - 1 && TTSTextModifier.isLatinCode(code)) {
                    type = LATION;
                    break;
                }
                else {
                    type = NONE;
                    break;
                }
            }
            if (spaceCount == startOffset) {
                type = HANGUL;
            }
            for (i = endOffset; i < textLength; i++) {
                code = text.charCodeAt(i);
                if (TTSTextModifier.isSpaceCode(code)) {
                    continue;
                }
                else if (endOffset < i && (type == LATION || TTSTextModifier.isLatinCode(code))) {
                    type = LATION;
                    break;
                }
                else if (type == HANGUL && text.charAt(i) == "장") {
                    break;
                }
                else {
                    type = NONE;
                    break;
                }
            }
            if (type != NONE) {
                var numeric = parseInt(text.substring(startOffset, endOffset));
                var notationString = TTSTextModifier.numericToNotationString(numeric, type);
                text = text.substr(0, startOffset) + notationString + text.substr(endOffset);
            }
        }

        return text;
    },

    numericToNotationString: function(num, isHangul) {
        var ones, tens, teens;
        if (isHangul) {
            ones = ['', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구'];
            tens = ['', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구'];
            teens = ['십', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구'];
        }
        else {
            ones = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
            tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
            teens = ['ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
        }

        var convertTens = function(num) {
            if (num < 10) {
                return ones[num];
            }
            else if (!isHangul && num >= 10 && num < 20) {
                return teens[num - 10];
            }
            else {
                if (isHangul && num < 10 * 2) {
                    return "십" + ones[num % 10];
                }
                return tens[Math.floor(num / 10)] + (isHangul ? "십" : " ") + ones[num % 10];
            }
        };

        var convertHundreds = function(num) {
            if (num > 99) {
                if (isHangul && num < 100 * 2) {
                    return "백" + convertTens(num % 100);
                }
                return ones[Math.floor(num / 100)] + (isHangul ? "백" : " hundred ") + convertTens(num % 100);
            }
            else {
                return convertTens(num);
            }
        };

        var convertThousands = function(num) {
            if (num >= 1000) {
                if (isHangul && num < 1000 * 2) {
                    return "천" + convertHundreds(num % 1000);
                }
                return convertThousands(Math.floor(num / 1000)) + (isHangul ? "천" : " thousand ") + convertHundreds(num % 1000);
            }
            else {
                return convertHundreds(num);
            }
        };

        var convertMillions = function(num) {
            var base = isHangul ? 10000 : 1000000;
            if (num >= base) {
                if (isHangul && num < base * 2) {
                    return "만" + convertThousands(num % base);
                }
                return convertMillions(Math.floor(num / base)) + (isHangul ? "만" : " million ") + convertThousands(num % base);
            }
            else {
                return convertThousands(num);
            }
        };

        if (num === 0) {
            return isHangul ? "영" : "zero";
        }
        else {
            return convertMillions(num).trim();
        }
    },

    numericToOrdinalString: function(num, isHangul) {

    },

    isContain: function(code, table) {
        for (var i = 0; i < table.length; i += 2) {
            if (table[i] <= code && code <= table[i + 1]) {
                return true;
            }
        }
        return false;
    },

    isDigitCode: function(code) {
        var digitTable = [0x0030, 0x0039];
        return TTSTextModifier.isContain(code, digitTable);
    },

    isSpaceCode: function(code) {
        return code == 0x0020;
    },

    isTildeCode: function(code) {
        return code == 0x007E || code == 0x223C;// ~, ∼
    },

    isHangulCode: function(code) {
        var hangulTable = [0xAC00, 0xD7AF];
        return TTSTextModifier.isContain(code, hangulTable);
    },

    isLatinCode: function(code, flag) {
        var uppercaseTable = [0x0041, 0x005A, 0x00C0, 0x00D6, 0x00D8, 0x00DE];
        var lowercaseTable = [0x0061, 0x007A, 0x00DF, 0x00F6, 0x00F8, 0x00FF];

        if (code >= 0x0100 && code <= 0x017F) {
            // Latin Extended-A
            if (flag == "u") {
                if ((code >= 0x0100 && code <= 0x0137 && code % 2 === 0) || (code >= 0x014A && code <= 0x0177 && code % 2 === 0) ||
                    (code >= 0x0139 && code <= 0x0148 && code % 2 == 1) || (code >= 0x0179 && code <= 0x017E && code % 2 == 1)) {
                    return true;
                }
                else if (code == 0x0178) {
                    return true;
                }
            }
            else if (flag == "l") {
                if ((code >= 0x0100 && code <= 0x0137 && code % 2 == 1) || (code >= 0x014A && code <= 0x0177 && code % 2 == 1) ||
                    (code >= 0x0139 && code <= 0x0148 && code % 2 === 0) || (code >= 0x0179 && code <= 0x017E && code % 2 === 0)) {
                    return true;
                }
                else if (code == 0x0138 || code == 0x0149 || code == 0x017F) {
                    return true;
                }
            }
            return true;
        }
        else if (code >= 0x0180 && code <= 0x024F) {
            // Latin Extended-B... 대소문자가 섞여있고 편집문자까지 들어가 있다...
            return true;
        }
        else {
            // Latin Basic
            if (flag == "u") {
                return TTSTextModifier.isContain(code, uppercaseTable);
            }
            else if (flag == "l") {
                return TTSTextModifier.isContain(code, lowercaseTable);
            }
            else {
                var latinTable = [];
                latinTable = latinTable.concat(uppercaseTable);
                latinTable = latinTable.concat(lowercaseTable);
                return TTSTextModifier.isContain(code, latinTable);
            }
        }
    },

    isChineseCode: function(code) {
        var CJKHanjaTable = [0x4E00, 0x9FBF, 0xF900, 0xFAFF, 0x3400, 0x4DBF, 0x20000, 0x2A6DF, 0x2A700, 0x2B73F, 0x2B740, 0x2B81F, 0x2F800, 0x2FA1F];
        return TTSTextModifier.isContain(code, CJKHanjaTable);
    },

    isSentenceSuffix: function(ch) {
        return ch.match(TTSRegex.sentence()) !== null;
    },

    getInitialCodeInHangulCode: function(code) {
        //      ㄱ  ㄲ ㄴ  ㄷ  ㄸ ㄹ  ㅁ ㅂ  ㅃ  ㅅ ㅆ  ㅇ ㅈ  ㅉ ㅊ  ㅋ ㅌ  ㅍ ㅎ
        // 0x31 31 32 34 37 38 39 41 42 43 45 46 47 48 49 4A 4B 4C 4D 4E
        var initialCodes = [0x31, 0x32, 0x34, 0x37, 0x38, 0x39, 0x41, 0x42, 0x43, 0x46, 0x47, 0x48, 0x49, 0x4A, 0x4B, 0x4C, 0x4D, 0x4E];
        return 0x3100 + initialCodes[((((code - 0xAC00) - (code - 0xAC00) % 28)) / 28) / 21];
    },

    getMedialCodeIndexInHangulCode: function(code) {
        return ((((code - 0xAC00) - (code - 0xAC00) % 28)) / 28) % 21;
    },

    getMedialCodeInHangulCode: function(code) {
        //      ㅏ  ㅐ  ㅑ ㅒ  ㅓ ㅔ  ㅕ ㅖ  ㅗ  ㅘ ㅙ  ㅚ ㅛ ㅜ  ㅝ  ㅞ ㅟ  ㅠ ㅡ  ㅢ  ㅣ
        // 0x31 4F 50 51 52 53 54 55 56 57 58 59 5A 5B 5C 5D 5E 5F 60 61 62 63
        var medialCodes = [0x4F, 0x50, 0x51, 0x52, 0x53, 0x54, 0x55, 0x56, 0x57, 0x58, 0x59, 0x5A, 0x5B, 0x5C, 0x5D, 0x5E, 0x5F, 0x60, 0x61, 0x62, 0x63];
        var index = TTSTextModifier.getMedialCodeIndexInHangulCode(code);
        return 0x3100 + medialCodes[index];
    },

    getFinalCodeInHangulCode: function(code) {
        //             ㄱ  ㄲ ㄳ  ㄴ ㄵ  ㄶ  ㄷ ㄹ  ㄺ ㄻ  ㄼ  ㄽ ㄾ  ㄿ ㅀ  ㅁ ㅂ  ㅄ  ㅅ ㅆ  ㅇ ㅈ  ㅊ ㅋ  ㅌ  ㅍ ㅎ
        // 0x0000 0x31 31 32 33 34 35 36 37 39 3A 3B 3C 3D 3E 3F 40 41 42 44 45 46 47 48 4A 4B 4C 4D 4E
        var finalCodes = [0x00, 0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37, 0x39, 0x3A, 0x3B, 0x3C, 0x3D, 0x3E, 0x3F, 0x40, 0x41, 0x42, 0x44, 0x45, 0x46, 0x47, 0x48, 0x4A, 0x4B, 0x4C, 0x4D, 0x4E];
        var index = (code - 0xAC00) % 28;
        return (index === 0 ? 0x0000 : 0x3100) + finalCodes[index];
    },
};

var TTSRegex = {
    makeRgex: function(prefix, pattern, suffix, flags) {
        prefix = typeof prefix === 'string' ? prefix : "";
        suffix = typeof suffix === 'string' ? suffix : "";
        flags = typeof option === 'string' ? flags : "gm";
        return new RegExp(prefix + pattern + suffix, flags);
    },

    whitespace: function(prefix, suffix, flags) {
        return TTSRegex.makeRgex(prefix, "[^\\s\\r\\n\\t]", suffix, flags);
    },

    sentence: function(prefix, suffix, flags) {
        return TTSRegex.makeRgex(prefix, "[.|。|?|!|\"|”|'|’|」|』]", suffix, flags);
    }
};

var TTSRange = function(startOffset, endOffset) {
    this.startOffset = startOffset;
    this.endOffset = endOffset;
};

var TTSChunk = function(pieces) {
    this.id = tts.chunks.length;
    this.pieces = pieces;
    this.range = new TTSRange(0, this.getText().length);
};

TTSChunk.prototype = {
    range: null,

    getText: function() {
        var fullText = "";
        for (var i = 0; i < this.pieces.length; i++) {
            var text = this.pieces[i].text;
            if (text !== null) {
                fullText += text;
            }
        }
        if (this.range !== null) {
            return fullText.substring(this.range.startOffset, this.range.endOffset);
        }
        else {
            return fullText;
        }
    },

    getPiece: function(offset) {
        var length = 0;
        for (var i = 0; i < this.pieces.length; i++) {
            length += this.pieces[i].length;
            if (offset <= length) {
                return this.pieces[i];
            }
        }
        return null;
    },

    getClientRects: function() {
        var rects = [];
        var startOffset, endOffset, offset = 0, length = 0;
        var beginPiece = this.getPiece(this.range.startOffset);
        for (var i = 0; i < this.pieces.length; i++, offset += length) {
            var piece = this.pieces[i];
            var text = piece.text;
            var node = piece.node;

            var range = document.createRange();
            range.selectNodeContents(node);
            if (piece.isImage()) {
                length = 0;

                var rect = epub.getBoundingClientRect(range);
                if (rect !== null) {
                    rects.push(rect);
                }
            }
            else {
                length = piece.length;

                var chunkRange = this.range;
                var pieceRange = new TTSRange(offset, offset + piece.length);

                if (chunkRange.startOffset <= pieceRange.startOffset) {
                    if (pieceRange.endOffset <= chunkRange.endOffset) {
                        // Case 1
                        //   Chunk |        |
                        //   Piece |   |
                        //   Piece   |   |
                        //   Piece     |    |
                        startOffset = pieceRange.startOffset;
                        endOffset = pieceRange.endOffset;
                    }
                    else {
                        if (chunkRange.endOffset <= pieceRange.startOffset) {
                            // Case 2
                            //   Chunk |   |
                            //   Piece        |    |
                            continue;
                        }
                        else {
                            // Case 3
                            //   Chunk |     |
                            //   Piece    |       |
                            startOffset = pieceRange.startOffset;
                            endOffset = this.range.endOffset;
                        }
                    }
                }
                else if (chunkRange.endOffset <= pieceRange.endOffset) {
                    // Case 4
                    //   Chunk    |   |
                    //   Piece |          |
                    //   Piece   |    |
                    startOffset = this.range.startOffset;
                    endOffset = this.range.endOffset;
                }
                else {
                    if (pieceRange.endOffset <= chunkRange.startOffset) {
                        // Case 5
                        //   Chunk         |   |
                        //   Piece |    |
                        continue;
                    }
                    else {
                        // Case 6
                        //   Chunk     |       |
                        //   Piece |      |
                        startOffset = this.range.startOffset;
                        endOffset = pieceRange.endOffset;
                    }
                }

                startOffset = Math.max(startOffset - offset + piece.leftPadding, 0);
                endOffset = Math.max(endOffset - offset + piece.leftPadding, 0);
                if (endOffset === 0) {
                    endOffset = length;
                }
                while (true) {
                    try {
                        range.setStart(node, startOffset);
                        range.setEnd(node, endOffset);
                        range.expand('character');
                    }
                    catch(e) {
                        console.log("TTSChunk:getClientRects() Error!! " + e.toString());
                        console.log("=> {chunkId: " + this.id + ", startOffset: " + startOffset + ", endOffset: " + endOffset + ", offset: " + offset + ", nodeIndex: " + piece.nodeIndex + ", wordIndex: " + piece.wordIndex + "}");
                        break;
                    }

                    var string = range.toString();
                    if (beginPiece.nodeIndex == piece.nodeIndex &&
                        (string.match(TTSRegex.whitespace("^")) === null || string.match(TTSRegex.sentence("^")) !== null)) {
                        if (length <= startOffset + 1) {
                            break;
                        }
                        startOffset++;
                    }
                    else if (string.match(TTSRegex.whitespace(null, "$")) === null) {
                        if (endOffset - 1 < 0) {
                            break;
                        }
                        endOffset--;
                    }
                    else {
                        break;
                    }
                }// end while

                var textNodeRects = range.getClientRects();
                if (textNodeRects !== null) {
                    for (var j = 0; j < textNodeRects.length; j++) {
                        rects.push(textNodeRects[j]);
                    }
                }
            }
        }// end for
        return rects;
    },

    copy: function(range) {
        var newChunk = new TTSChunk(this.pieces);
        newChunk.range = range;
        return newChunk;
    },
};

var TTSPiece = function(nodeIndex, wordIndex) {
    this.init(nodeIndex, wordIndex);
};

TTSPiece.prototype = {
    nodeIndex: null,
    wordIndex: null,
    node: null,

    text: null,
    length: 0,

    // 다음 형제노드가 br 태그인지.
    // textAndImageNodes를 작업할 때 br 태그로 newLine이 가능하다는 것을 잊고 있었음;
    // TopNodeLocation이 정식 버전에 들어간 상태라 br 태그를 textAndImageNodes에 포함시킬 수도 없고.. 이런식으로... 허허;
    isNextSiblingToBr: false,

    leftPadding: 0,

    readImage: false,   // 이미지를 읽고싶다면 true

    init: function(nodeIndex, wordIndex) {
        if (nodeIndex == -1 || epub.textAndImageNodes === null || epub.textAndImageNodes.length - 1 < nodeIndex || (this.node = epub.textAndImageNodes[nodeIndex]) === null) {
            return;
        }

        this.nodeIndex = nodeIndex;
        this.wordIndex = typeof wordIndex === 'number' ? wordIndex : null;

        if (this.node.nextSibling !== null && this.node.nextSibling.nodeName.toLowerCase() == "br") {
            this.isNextSiblingToBr = true;
        }

        if (typeof this.node.nodeValue == 'string') {
            this.text = this.node.nodeValue;
            if (this.wordIndex !== null && this.wordIndex > 0) {
                var words = this.text.split(new RegExp(" "));
                if (this.wordIndex < words.length) {
                    this.text = "";
                    for (var i = 0; i < words.length; i++) {
                        if (this.wordIndex <= i) {
                            this.text += (words[i] + ((i < words.length - 1) ? " " : ""));
                        }
                        else {
                            this.leftPadding += (words[i].length + 1);
                        }
                    }
                }
                else {
                    this.text = null;
                }
            }
        }
        else if (this.readImage && this.isImage() && typeof this.node.alt == 'string' && this.node.alt.length > 0) {
            this.text = this.node.alt;
            if (this.node.src.indexOf(this.text) || this.text.trim() == "이미지") {
                this.text = null;
            }
        }
        this.length = this.text !== null ? this.text.length : 0;
    },

    isValid: function() {
        var valid = true;
        var element = (this.node.nodeType == Node.TEXT_NODE ? this.node.parentElement : this.node);
        var nodeName = element.nodeName.toLowerCase();
        if (element.style.display == "none" || element.offsetWidth === 0) {
            valid = false;
        }
        else if (nodeName == "ruby" || nodeName == "rt" || nodeName == "rp") {
            valid = false;
        }
        else if (nodeName == "sub" || nodeName == "sup") {
            valid = false;
        }
        else if (nodeName == "a") {
            var pElement = element.parentElement;
            while (pElement !== null) {
                nodeName = pElement.nodeName.toLowerCase();
                if (nodeName == "sub" || nodeName == "sup") {
                    valid = false;
                    break;
                }
                pElement = pElement.parentElement;
            }
            if (element.getElementsByTagName("sub").length > 0 || element.getElementsByTagName("sup") > 0) {
                valid = false;
            }
        }
        else if (this.text === null) {
            valid = false;
        }
        return valid;
    },

    isImage: function() {
        return this.node.nodeName.toLowerCase() == "img";
    },

    isWhitespace: function() {
        return this.text.match(TTSRegex.whitespace()) === null ? true : false;
    },

    isSentence: function() {
        return this.text.trim().match(TTSRegex.sentence(null, "$")) !== null ? true : false;
    },
};

var tts = {
    chunks: [],
    chunkLengthLimit: 0,

    shouldNextPage: function(chunkId, baseOffset) {
        var getOffset = function(chunk, isEndOfChunk) {
            var piece = chunk.getPiece(isEndOfChunk ? chunk.range.endOffset : chunk.range.startOffset);
            if (piece === null) {
                return 0;
            }

            var node = piece.node;
            var range = document.createRange();
            range.selectNodeContents(node);
            if (!piece.isImage() && isEndOfChunk) {
                try {
                    if (piece.length < chunk.range.endOffset) {
                        range.setStart(node, range.endOffset - 1);
                        range.setEnd(node, range.endOffset);
                    }
                    else {
                        range.setStart(node, chunk.range.endOffset - 1);
                        range.setEnd(node, chunk.range.endOffset);
                    }
                }
                catch (e) {
                    console.log("tts:shouldNextPage:getRect() Error!! " + e.toString());
                    console.log("=> {nodeIndex: " + piece.nodeIndex + ", wordIndex: " + piece.wordIndex + "}");
                    return 0;
                }
            }

            return epub.getBoundingClientRect(range).left;
        };

        var chunk = tts.chunks[chunkId];
        if (chunk === undefined) {
            return false;
        }

        if (getOffset(chunk, true) <= baseOffset) {
            var nextChunk = tts.chunks[chunkId + 1];
            if (nextChunk !== undefined && getOffset(nextChunk, false) < baseOffset) {
                return false;
            }
        }

        return true;
    },

    didFinishSpeech: function(chunkId) {

    },

    didFinishMakeChunks: function(index) {

    },

    makeChunksByRange: function(serializedRange) {
        var range = rangy.deserializeRange(serializedRange, document.body);

        if (range !== null) {
            var nodeIndex = -1, wordIndex = 0;
            if (epub.textAndImageNodes === null) {
                return;
            }

            // TDD - 이게 최선인가..
            for (var i = 0; i < epub.textAndImageNodes.length; i++) {
                if (epub.textAndImageNodes[i] === range.startContainer) {
                    nodeIndex = i;
                    var offset = 0;
                    var words = range.startContainer.textContent.split(new RegExp(" "));
                    for ( ; wordIndex < words.length; wordIndex++) {
                        if (range.startOffset <= offset) {
                            break;
                        }
                        else {
                            offset += (words[wordIndex].length + 1);
                        }
                    }
                    break;
                }
            }

            tts.makeChunksByNodeLocation(nodeIndex, wordIndex);
        }
    },

    makeChunksByNodeLocation: function(nodeIndex, wordIndex) {
        if (nodeIndex == -1 || wordIndex == -1 || epub.textAndImageNodes === null) {
            return;
        }

        var index = Math.max(tts.chunks.length - 1, 0);
        tts.chunkLengthLimit = Math.min(nodeIndex + 100, epub.textAndImageNodes.length);

        for ( ; nodeIndex < tts.chunkLengthLimit; nodeIndex++, wordIndex = 0) {
            var piece = new TTSPiece(nodeIndex, wordIndex);
            if (piece.node === null) {
                break;
            }

            var pieces = [piece];
            if (!piece.isValid() || piece.isWhitespace()) {
                continue;
            } else {
                if (nodeIndex == tts.chunkLengthLimit - 1 || piece.isImage() || (piece.length > 1 && piece.isSentence()) || piece.isNextSiblingToBr) {
                    tts.addChunk(pieces);
                } else {
                    var nextPiece = null;
                    while ((nextPiece = new TTSPiece(++nodeIndex)).nodeIndex !== null) {
                        if (!nextPiece.isValid()) {
                            // not working
                        } else if (nextPiece.isImage() || nextPiece.isWhitespace()) {
                            tts.addChunk(pieces);
                            nodeIndex--;
                            break;
                        } else {
                            pieces.push(nextPiece);
                            if (nextPiece.length > 1 && nextPiece.isSentence()) {
                                tts.addChunk(pieces);
                                break;
                            }
                        }
                        if (nodeIndex == epub.textAndImageNodes.length - 1) {
                            tts.addChunk(pieces);
                        }
                    }// end while
                }
                if (tts.chunkLengthLimit < nodeIndex) {
                    tts.chunkLengthLimit = nodeIndex;
                }
            }
        }// end for

        tts.didFinishMakeChunks(index);
    },

    addChunk: function(pieces) {
        var split = function(text) {
            text = text.replace(/([.|。|?|!])/gm, "$1[RidiDelimiter]");
            return text.split("[RidiDelimiter]");
        };

        var getOpenBracket = function(text) {
            var ch = null;
            var result = text.match(/[\(|\{|\[]/gm);
            if (result !== null) {
                ch = result[0];
            }
            return ch;
        };

        var getCloseBracket = function(text) {
            var ch = null;
            var result = text.match(/[\)|\}|\]]/gm);
            if (result !== null) {
                ch = result[result.length - 1];
            }
            return ch;
        };

        var isOnePair = function(openBracket, closeBracket) {
            if ((openBracket == "(" && closeBracket == ")") ||
                (openBracket == "{" && closeBracket == "}") ||
                (openBracket == "[" && closeBracket == "]")) {
                return true;
            }
            else {
                return false;
            }
        };

        var isDigitOrAlpha = function(ch) {
            if (ch === null || ch === undefined) {
                return false;
            }
            else {
                return ch.match(/[0-9a-zA-Z]/) !== null;
            }
        };

        var isPointOrName = function(text, nextText) {
            // TDD - 마침표 앞뒤에 숫자 또는 영문이 있을 때는 나누지 않는다.
            return text.match(/[.]$/gm) !== null && isDigitOrAlpha(text[Math.max(text.length - 2, 0)]) && nextText !== undefined && isDigitOrAlpha(nextText[0]);
        };

        var isNotEndOfSentence = function(nextText) {
            return nextText !== undefined && nextText.match(TTSRegex.sentence("^")) !== null;
        };

        var call = function(num) {// Test Code
            console.log((tts.chunks.length - 1) + ", #" + num + " " + tts.chunks[tts.chunks.length - 1].getText());
        };

        var chunk = new TTSChunk(pieces);
        var tokens = split(chunk.getText());
        if (tokens.length > 1) {
            var offset = 0, startOffset = 0;
            var subText = "";
            for (var i = 0; i < tokens.length; i++) {
                var token = tokens[i];
                var openBracket, closeBracket, otherOpenBracket;
                subText += token;
                offset += token.length;
                if ((openBracket = getOpenBracket(token)) !== null) {
                    var isLast = false;
                    for (var j = i; j < tokens.length; j++) {
                        var nextToken = tokens[j];
                        if (i < j) {
                            subText += nextToken;
                            offset += nextToken.length;
                        }
                        // TDD - 괄호가 섞였을 때는 어쩔건가. 예) [{~~~]}
                        if ((closeBracket = getCloseBracket(nextToken)) !== null && isOnePair(openBracket, closeBracket)) {
                            if (i == j && nextToken.lastIndexOf(closeBracket) < nextToken.indexOf(openBracket)) {
                                continue;
                            }
                            else if (i < j && (otherOpenBracket = getOpenBracket(nextToken)) !== null) {
                                openBracket = otherOpenBracket;
                                continue;
                            }
                            else {
                                isLast = true;
                            }
                        }
                        if (isPointOrName(subText, tokens[i + 1]) || isNotEndOfSentence(tokens[i + 1])) {
                            isLast = true;
                            continue;
                        }
                        if (isLast) {
                            tts.chunks.push(chunk.copy(new TTSRange(startOffset, startOffset + subText.length)));
                            subText = "";
                            startOffset = offset;
                            i = j;
                            call(1);
                            break;
                        }
                    }// end for
                }
                else {
                    if (isPointOrName(subText, tokens[i + 1]) || isNotEndOfSentence(tokens[i + 1])) {
                        continue;
                    }
                    tts.chunks.push(chunk.copy(new TTSRange(startOffset, startOffset + subText.length)));
                    subText = "";
                    startOffset = offset;
                    call(2);
                }
            }// end for
            if (subText.length) {
                tts.chunks.push(chunk.copy(new TTSRange(startOffset, startOffset + subText.length)));
                call(3);
            }
        } else {
            tts.chunks.push(chunk);
            call(4);
        }
    },

    flush: function() {

    },

    highlightBody: null,
    HIGHLIGHT_COUNT: 25,

    clearHighlight: function() {
        if (tts.highlightBody !== null) {
            for (var i = 0; i < tts.HIGHLIGHT_COUNT; i++) {
                var highlightNode = tts.highlightBody.children[i];
                highlightNode.style.setProperty("display", "none", "important");
            }
        }
    },

    setUpHighlightBody: function() {
        if (tts.highlightBody === null) {
            tts.highlightBody = document.createElement("div");
            tts.highlightBody.setAttribute("class", "RidiTTSHighlightBody");
            var fragment = document.createDocumentFragment();
            for (var j = 0; j < tts.HIGHLIGHT_COUNT; j++) {
                var highlightNode = document.createElement("span");
                highlightNode.setAttribute("class", "RidiTTSHighlight");
                fragment.appendChild(highlightNode);
            }
            tts.highlightBody.appendChild(fragment);
            document.body.appendChild(tts.highlightBody);
        }
    },

    updateHighlight: function(chunkId, startOffset, basedLeft) {
        tts.setUpHighlightBody();

        var chunk = tts.chunks[chunkId];
        var rects = chunk.getClientRects();
        var scrollLeft = document.body.scrollLeft;

        for (var i = 0; i < tts.HIGHLIGHT_COUNT; i++) {
            var rect = rects[i];
            var highlightNode = tts.highlightBody.children[i];
            if (rect === undefined) {
                if (highlightNode.style.display != "none") {
                    highlightNode.style.setProperty("display", "none", "important");
                }
            }
            else {
                var left = basedLeft ? (rect.left + (startOffset ? 0 : scrollLeft))
                                     : (scrollLeft + (rect.left < 0 ? (scrollLeft + rect.left) : rect.left));
                var top = basedLeft ? rect.top : (rect.top - startOffset);
                var width = rect.width ? rect.width : 3;
                var height = rect.height;
                var cssText =
                    "position: absolute !important;" +
                    "background-color: #1e91e4 !important;" +
                    "left: " + left + "px !important;" +
                    "top: " + top + "px !important;" +
                    "width: " + width + "px !important;" +
                    "height: " + height + "px !important;" +
                    "display: block !important;" +
                    "opacity: 0.2 !important;" +
                    "z-index: 2147483647 !important;";

                highlightNode.style.cssText = cssText;
            }
        }// end for
    },
};
