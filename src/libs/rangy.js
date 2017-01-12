/* eslint-disable */
// rangy.js (v1.3alpha.804 Base)

// Checksum for checking whether range can be serialized
var crc32 = (function() {
    function utf8encode(str) {
        var utf8CharCodes = [];

        for (var i = 0, len = str.length, c; i < len; ++i) {
            c = str.charCodeAt(i);
            if (c < 128) {
                utf8CharCodes.push(c);
            } else if (c < 2048) {
                utf8CharCodes.push((c >> 6) | 192, (c & 63) | 128);
            } else {
                utf8CharCodes.push((c >> 12) | 224, ((c >> 6) & 63) | 128, (c & 63) | 128);
            }
        }
        return utf8CharCodes;
    }

    var cachedCrcTable = null;

    function buildCRCTable() {
        var table = [];
        for (var i = 0, j, crc; i < 256; ++i) {
            crc = i;
            j = 8;
            while (j--) {
                if ((crc & 1) == 1) {
                    crc = (crc >>> 1) ^ 0xEDB88320;
                } else {
                    crc >>>= 1;
                }
            }
            table[i] = crc >>> 0;
        }
        return table;
    }

    function getCrcTable() {
        if (!cachedCrcTable) {
            cachedCrcTable = buildCRCTable();
        }
        return cachedCrcTable;
    }

    return function(str) {
        var utf8CharCodes = utf8encode(str), crc = -1, crcTable = getCrcTable();
        for (var i = 0, len = utf8CharCodes.length, y; i < len; ++i) {
            y = (crc ^ utf8CharCodes[i]) & 0xFF;
            crc = (crc >>> 8) ^ crcTable[y];
        }
        return (crc ^ -1) >>> 0;
    };
})();

var rangy = {
    nodeToInfoString: function(node, infoParts) {
        var escapeTextForHtml = function(str) {
            return str.replace(/</g, "&lt;").replace(/>/g, "&gt;");
        };

        infoParts = infoParts || [];
        var nodeType = node.nodeType, children = node.childNodes, childCount = children.length;
        var nodeInfo = [nodeType, node.nodeName, childCount].join(":");
        var start = "", end = "";
        switch (nodeType) {
            case 3: // Text node
                start = escapeTextForHtml(node.nodeValue);
                break;
            case 8: // Comment
                start = "<!--" + escapeTextForHtml(node.nodeValue) + "-->";
                break;
            default:
                start = "<" + nodeInfo + ">";
                end = "</>";
                break;
        }
        if (start) {
            infoParts.push(start);
        }
        for (var i = 0; i < childCount; ++i) {
            rangy.nodeToInfoString(children[i], infoParts);
        }
        if (end) {
            infoParts.push(end);
        }
        return infoParts;
    },

    // Creates a string representation of the specified element's contents that is similar to innerHTML but omits all
    // attributes and comments and includes child node counts. This is done instead of using innerHTML to work around
    // IE <= 8's policy of including element properties in attributes, which ruins things by changing an element's
    // innerHTML whenever the user changes an input within the element.
    getElementChecksum: function(el) {
        var info = rangy.nodeToInfoString(el).join("");
        return crc32(info).toString(16);
    },

    getDocument: function(node) {
        if (node.nodeType == 9) {
            return node;
        } else if (typeof node.ownerDocument != 'undefined') {
            return node.ownerDocument;
        } else if (typeof node.document != 'undefined') {
            return node.document;
        } else if (node.parentNode) {
            return rangy.getDocument(node.parentNode);
        } else {
            throw new Error("Error in Rangy: getDocument: no document found for node");
        }
    },

    getNodeIndex: function(node) {
        var i = 0;
        while( (node = node.previousSibling) ) {
            ++i;
        }
        return i;
    },

    getNodeLength: function(node) {
        switch (node.nodeType) {
            case 7:
            case 10:
                return 0;
            case 3:
            case 8:
                return node.length;
            default:
                return node.childNodes.length;
        }
    },

    serializePosition: function(node, offset, rootNode) {
        var pathParts = [], n = node;
        rootNode = rootNode || rangy.getDocument(node).documentElement;
        while (n && n != rootNode) {
            pathParts.push(rangy.getNodeIndex(n, true));
            n = n.parentNode;
        }
        return pathParts.join("/") + ":" + offset;
    },

    serializeRange: function(range, omitChecksum, rootNode) {
        var isOrIsAncestorOf = function(ancestor, descendant, selfIsAncestor) {
            var n = selfIsAncestor ? descendant : descendant.parentNode;
            while (n) {
                if (n === ancestor) {
                    return true;
                } else {
                    n = n.parentNode;
                }
            }
            return false;
        };

        rootNode = rootNode || rangy.getDocument(range).startContainer;
        if (!isOrIsAncestorOf(rootNode, range.commonAncestorContainer, true)) {
            throw new Error("Error in Rangy: serializeRange(): range is not wholly contained within specified root node.");
        }
        var serialized = rangy.serializePosition(range.startContainer, range.startOffset, rootNode) + "," +
                         rangy.serializePosition(range.endContainer, range.endOffset, rootNode);
        if (!omitChecksum) {
            serialized += "{" + rangy.getElementChecksum(rootNode) + "}";
        }
        return serialized;
    },

    deserializePosition: function(serialized, rootNode, doc) {
        if (!rootNode) {
            rootNode = (doc || document).documentElement;
        }
        var parts = serialized.split(":");
        var node = rootNode;
        var nodeIndices = parts[0] ? parts[0].split("/") : [], i = nodeIndices.length, nodeIndex;

        while (i--) {
            nodeIndex = parseInt(nodeIndices[i], 10);
            if (nodeIndex < node.childNodes.length) {
                node = node.childNodes[nodeIndex];
            } else {
                throw new Error("Error in Rangy: deserializePosition() failed: node has no child with index " + nodeIndex + ", " + i + ".");
            }
        }

        return {node: node, offset: parseInt(parts[1], 10)};
    },
    
    deserializeRegex: /^([^,]+),([^,\{]+)(\{([^}]+)\})?$/,

    deserializeRange: function(serialized, rootNode, doc) {
        if (rootNode) {
            doc = doc || rangy.getDocument(rootNode);
        } else {
            doc = doc || document;
            rootNode = doc.documentElement;
        }
        var result = rangy.deserializeRegex.exec(serialized);
        var checksum = result[4], rootNodeChecksum;
        if (checksum) {
            rootNodeChecksum = rangy.getElementChecksum(rootNode);
            if (checksum !== rootNodeChecksum) {
                throw new Error("deserializeRange: checksums of serialized range root node (" + checksum +
                    ") and target root node (" + rootNodeChecksum + ") do not match");
            }
        }
        var start = rangy.deserializePosition(result[1], rootNode, doc), end = rangy.deserializePosition(result[2], rootNode, doc);
        var range = document.createRange();
        range.setStart(start.node, start.offset);
        range.setEnd(end.node, end.offset);
        return range;
    },

    canDeserializeRange: function(serialized, rootNode, doc) {
        if (!rootNode) {
            rootNode = (doc || document).documentElement;
        }
        var result = rangy.deserializeRegex.exec(serialized);
        var checksum = result[3];
        return !checksum || checksum === rangy.getElementChecksum(rootNode);
    },

};
