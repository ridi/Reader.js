import TTSRange from './TTSRange';
import TTSUtterance from './TTSUtterance';
import TTSUtil from './TTSUtil';
import _Util from '../_Util';
import MutableClientRect from '../MutableClientRect';

export default class TTSChunk {
  get id() { return this._id; }
  set id(newId) { this._id = newId; }
  get range() { return this._range; }
  set range(newRange) {
    if (newRange instanceof TTSRange) {
      this._range = newRange;
    } else {
      this._range = new TTSRange(0, this._getFullText().length);
    }
  }

  constructor(pieces, range = null) {
    this._id = tts.chunks.length;
    this._pieces = pieces;
    this.range = range;
  }

  _getFullText() {
    let fullText = '';
    this._pieces.forEach((piece) => {
      fullText += piece.text;
    });
    return fullText;
  }

  getText() {
    return this._getFullText().substring(this.range.startOffset, this.range.endOffset);
  }

  getUtterance() {
    return new TTSUtterance(this.getText())
      .removeNewLine()
      .removeSpecialCharacters(['≪', '≫'])
      .removeHanja()
      .removeLatin()
      .removeAllRepeatedCharacter(['<', '>', '_'])
      .replaceTilde()
      .replaceNumeric()
      .replaceBracket()
      .replaceEqual()
      .replaceDate()
      .insertPauseTag();
  }

  getPiece(offset) {
    let length = 0;
    return TTSUtil.find(this._pieces, (piece) => {
      length += piece.length;
      return offset <= length;
    });
  }

  getOffset(piece) {
    let offset = piece.paddingLeft;
    return this._pieces.find((item) => {
      if (item === piece) {
        return true;
      }
      offset += item.length;
      return false;
    });
  }

  getNodeIndex() {
    return this.getPiece(this.range.startOffset).nodeIndex;
  }

  getWordIndex() {
    const nodeIndex = this.getNodeIndex();
    let piece = null;
    let offset = 0;

    for (let i = 0; i < this._pieces.length; i++) {
      piece = this._pieces[i];
      if (piece.nodeIndex === nodeIndex) {
        break;
      } else {
        offset += piece.length;
      }
    }

    const diff = this.range.startOffset - offset + piece.paddingLeft;
    if (diff <= 0) {
      return 0;
    }

    offset = 0;
    const words = piece.text.split(TTSUtil.getSplitWordRegex);
    for (let j = 0; j < words.length; j++) {
      offset += (words[j].length + 1);
      if (offset >= diff) {
        return j;
      }
    }
    return words.length - 1;
  }

  getClientRects(removeBlank) {
    const chunkRange = this.range;
    const pieces = this._pieces;
    const startPiece = this.getPiece(chunkRange.startOffset);
    let rects = [];
    let startOffset = 0;
    let endOffset = 0;
    let offset = 0;
    let length = 0;

    for (let i = 0; i < pieces.length; i++, offset += length) {
      const piece = pieces[i];
      const node = piece.node;
      let string = null;

      const range = document.createRange();
      range.selectNodeContents(node);
      if (piece.isInvalid()) {
        length = 0;
        rects.push(range.getAdjustedBoundingClientRect());
      } else {
        length = piece.length;

        const pieceRange = new TTSRange(offset, offset + piece.length);
        if (chunkRange.startOffset <= pieceRange.startOffset) {
          if (pieceRange.endOffset <= chunkRange.endOffset) {
            // Case 1
            //   Chunk |        |
            //   Piece |   |
            //   Piece   |   |
            //   Piece     |    |
            startOffset = pieceRange.startOffset;
            endOffset = pieceRange.endOffset;
          } else {
            if (chunkRange.endOffset <= pieceRange.startOffset) {
              // Case 2
              //   Chunk |   |
              //   Piece        |    |
              continue;
            } else {
              // Case 3
              //   Chunk |     |
              //   Piece    |       |
              startOffset = pieceRange.startOffset;
              endOffset = chunkRange.endOffset;
            }
          }
        } else if (chunkRange.endOffset <= pieceRange.endOffset) {
          // Case 4
          //   Chunk    |   |
          //   Piece |          |
          //   Piece   |    |
          startOffset = chunkRange.startOffset;
          endOffset = chunkRange.endOffset;
        } else {
          if (pieceRange.endOffset <= chunkRange.startOffset) {
            // Case 5
            //   Chunk         |   |
            //   Piece |    |
            continue;
          } else {
            // Case 6
            //   Chunk     |       |
            //   Piece |      |
            startOffset = chunkRange.startOffset;
            endOffset = pieceRange.endOffset;
          }
        }

        startOffset = Math.max(startOffset - offset + piece.paddingLeft, 0);
        endOffset = Math.max(endOffset - offset + piece.paddingLeft, 0);
        if (endOffset === 0) {
          endOffset = length;
        }
        while (true) {
          try {
            range.setStart(node, startOffset);
            range.setEnd(node, endOffset);
            range.expand('character');
          } catch (e) {
            console.log(
              `TSChunk:getClientRects() Error!! ${e.toString()}\n`
            + ` => {chunkId: ${this.id}`
            + `, startOffset: ${startOffset}`
            + `, endOffset: ${endOffset}`
            + `, offset: ${offset}`
            + `, nodeIndex: ${piece.nodeIndex}`
            + `, wordIndex: ${piece.wordIndex}}`);
          }

          // 앞뒤 여백을 없애서 하이라이트를 이쁘게 만들어보자.
          string = range.toString();
          if (startPiece.nodeIndex === piece.nodeIndex &&
            (string.match(TTSUtil.getWhitespaceAndNewLineRegex('^', null, 'g')) !== null ||
            string.match(TTSUtil.getSentenceRegex('^', null, 'g')) !== null)) {
            if (length < startOffset + 1) {
              break;
            }
            startOffset++;
          } else if (string.match(TTSUtil.getWhitespaceAndNewLineRegex(null, '$', 'g')) !== null) {
            if (endOffset - 1 < 0) {
              break;
            }
            endOffset--;
          } else {
            break;
          }
        } // end while

        if (removeBlank === true && string.length === 0) {
          continue;
        }

        rects = _Util.concatArray(rects, range.getAdjustedClientRects());
      }
    }// end for
    return rects;
  }

  getBoundingClientRect() {
    const rects = this.getClientRects(false);
    const bounds = new MutableClientRect(rects[0]);
    for (let i = 0; i < rects.length; i++) {
      const rect = rects[i];
      bounds.top = Math.min(bounds.top, rect.top || 0);
      bounds.bottom = Math.max(bounds.bottom, rect.bottom || 0);
      bounds.left = Math.min(bounds.left, rect.left || 0);
      bounds.right = Math.max(bounds.right, rect.right || 0);
    }
    bounds.width = Math.max(bounds.right - bounds.left, 0);
    bounds.height = Math.max(bounds.bottom - bounds.top, 0);
    return bounds;
  }

  copy(range) {
    return new TTSChunk(this._pieces, range);
  }
}
