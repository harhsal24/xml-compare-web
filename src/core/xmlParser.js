/**
 * ============================================================================
 * XML PARSER - Core Library
 * ============================================================================
 * 
 * This module provides XML parsing functionality that converts XML strings
 * into a normalized tree structure with XPath information for each node.
 * 
 * ARCHITECTURE NOTE:
 * This module is designed to be framework-agnostic and can be used in:
 * - React web applications
 * - Electron desktop applications
 * - Node.js CLI tools (with jsdom)
 * - Any JavaScript/TypeScript environment
 * 
 * DEPENDENCIES:
 * - Requires DOMParser (browser-native or jsdom for Node.js)
 * 
 * ============================================================================
 */

// ============================================================================
// TYPE DEFINITIONS (JSDoc for IDE support)
// ============================================================================

/**
 * @typedef {Object} XmlNode
 * @property {string} tagName - The element's tag name (e.g., "item", "root")
 * @property {string} xpath - Full XPath to this element (e.g., "/root/item[1]")
 * @property {Object.<string, string>} attributes - Key-value pairs of attributes
 * @property {string} textContent - Direct text content (not from children)
 * @property {XmlNode[]} children - Child element nodes
 * @property {string} key - Unique identifier for comparison purposes
 */

/**
 * @typedef {Object} ParseResult
 * @property {boolean} success - Whether parsing was successful
 * @property {XmlNode|null} tree - The parsed tree (null if failed)
 * @property {string|null} error - Error message (null if successful)
 */

// ============================================================================
// MAIN PARSING FUNCTION
// ============================================================================

/**
 * Parse an XML string into a normalized tree structure.
 * 
 * This is the main entry point for XML parsing. It handles:
 * 1. XML string validation
 * 2. DOM parsing with error detection
 * 3. Tree structure normalization with XPath generation
 * 
 * @param {string} xmlString - The raw XML string to parse
 * @returns {XmlNode} The root node of the parsed tree
 * @throws {Error} If the XML is invalid or empty
 * 
 * @example
 * const tree = parseXml('<root><item id="1">Hello</item></root>');
 * console.log(tree.xpath); // "/root"
 * console.log(tree.children[0].xpath); // "/root/item"
 */
export function parseXml(xmlString) {
    // Step 1: Validate input is not empty
    validateXmlInput(xmlString);

    // Step 2: Parse string to DOM document
    const xmlDoc = parseStringToDocument(xmlString);

    // Step 3: Check for parsing errors from the DOM parser
    checkForParseErrors(xmlDoc);

    // Step 4: Build and return the normalized tree
    return buildTreeFromElement(xmlDoc.documentElement, '');
}

/**
 * Safely parse XML and return a result object instead of throwing.
 * 
 * Use this when you want to handle errors gracefully without try/catch.
 * 
 * @param {string} xmlString - The raw XML string to parse
 * @returns {ParseResult} Object containing success status, tree, and error
 * 
 * @example
 * const result = safeParseXml(userInput);
 * if (result.success) {
 *   displayTree(result.tree);
 * } else {
 *   showError(result.error);
 * }
 */
export function safeParseXml(xmlString) {
    try {
        const tree = parseXml(xmlString);
        return { success: true, tree, error: null };
    } catch (error) {
        return { success: false, tree: null, error: error.message };
    }
}

// ============================================================================
// INPUT VALIDATION
// ============================================================================

/**
 * Validate that the XML input is a non-empty string.
 * 
 * @param {string} xmlString - The input to validate
 * @throws {Error} If input is empty, null, undefined, or not a string
 */
function validateXmlInput(xmlString) {
    if (typeof xmlString !== 'string') {
        throw new Error('XML input must be a string');
    }

    if (xmlString.trim().length === 0) {
        throw new Error('XML input cannot be empty');
    }
}

// ============================================================================
// DOM PARSING
// ============================================================================

/**
 * Parse an XML string into a DOM Document using DOMParser.
 * 
 * @param {string} xmlString - The XML string to parse
 * @returns {Document} The parsed DOM document
 */
function parseStringToDocument(xmlString) {
    const parser = new DOMParser();
    return parser.parseFromString(xmlString, 'text/xml');
}

/**
 * Check if the DOM document contains any parsing errors.
 * 
 * The DOMParser doesn't throw errors; instead, it returns a document
 * containing a <parsererror> element if parsing failed.
 * 
 * @param {Document} xmlDoc - The DOM document to check
 * @throws {Error} If a parsing error is found in the document
 */
function checkForParseErrors(xmlDoc) {
    const parseError = xmlDoc.querySelector('parsererror');
    if (parseError) {
        // Extract just the error message, not the full DOM content
        const errorText = extractErrorMessage(parseError);
        throw new Error(`Invalid XML: ${errorText}`);
    }
}

/**
 * Extract a clean error message from a parsererror element.
 * 
 * @param {Element} parseError - The parsererror DOM element
 * @returns {string} A cleaned-up error message
 */
function extractErrorMessage(parseError) {
    // Get text content and clean it up
    let message = parseError.textContent || 'Unknown parsing error';

    // Remove excessive whitespace
    message = message.replace(/\s+/g, ' ').trim();

    // Limit length for readability
    if (message.length > 200) {
        message = message.substring(0, 200) + '...';
    }

    return message;
}

// ============================================================================
// TREE BUILDING
// ============================================================================

/**
 * Build a normalized tree structure from a DOM element.
 * 
 * This function recursively traverses the DOM tree and creates
 * a simplified structure with XPath information.
 * 
 * @param {Element} element - The DOM element to process
 * @param {string} parentPath - The XPath of the parent element
 * @returns {XmlNode} The normalized tree node
 */
function buildTreeFromElement(element, parentPath) {
    // Get basic element info
    const tagName = element.tagName;

    // Calculate XPath for this element
    const xpath = calculateXPath(element, parentPath);

    // Extract attributes
    const attributes = extractAttributes(element);

    // Extract direct text content (not from children)
    const textContent = extractDirectTextContent(element);

    // Recursively build child nodes
    const children = buildChildNodes(element, xpath);

    // Generate comparison key
    const key = generateComparisonKey(tagName, attributes);

    return {
        tagName,
        xpath,
        attributes,
        textContent,
        children,
        key,
    };
}

/**
 * Calculate the XPath for an element based on its position among siblings.
 * 
 * XPath uses 1-based indexing and only adds an index when there are
 * multiple siblings with the same tag name.
 * 
 * @param {Element} element - The DOM element
 * @param {string} parentPath - The parent element's XPath
 * @returns {string} The full XPath for this element
 * 
 * @example
 * // For <root><item/><item/></root>, the second item's XPath is:
 * // "/root/item[2]"
 */
function calculateXPath(element, parentPath) {
    const tagName = element.tagName;

    // Find siblings with the same tag name
    const siblings = findSameSiblings(element);

    // Calculate 1-based index
    const index = siblings.indexOf(element) + 1;

    // Only add index suffix if there are multiple siblings with same tag
    const needsIndex = siblings.length > 1;
    const indexSuffix = needsIndex ? `[${index}]` : '';

    return `${parentPath}/${tagName}${indexSuffix}`;
}

/**
 * Find all sibling elements with the same tag name.
 * 
 * @param {Element} element - The element to find siblings for
 * @returns {Element[]} Array of sibling elements with the same tag
 */
function findSameSiblings(element) {
    const tagName = element.tagName;

    if (!element.parentElement) {
        // Root element has no siblings
        return [element];
    }

    // Filter parent's children to only those with matching tag name
    return Array.from(element.parentElement.children)
        .filter(sibling => sibling.tagName === tagName);
}

/**
 * Extract all attributes from an element as a key-value object.
 * 
 * @param {Element} element - The DOM element
 * @returns {Object.<string, string>} Object mapping attribute names to values
 */
function extractAttributes(element) {
    const attributes = {};

    for (const attr of element.attributes) {
        attributes[attr.name] = attr.value;
    }

    return attributes;
}

/**
 * Extract direct text content from an element (excluding child elements).
 * 
 * This only gets text nodes that are direct children of the element,
 * not text from nested elements.
 * 
 * @param {Element} element - The DOM element
 * @returns {string} The combined direct text content (trimmed)
 */
function extractDirectTextContent(element) {
    let textContent = '';

    for (const child of element.childNodes) {
        // Only process TEXT_NODE (nodeType 3)
        if (child.nodeType === 3) { // Node.TEXT_NODE
            const text = child.textContent.trim();
            if (text) {
                textContent += text;
            }
        }
    }

    return textContent;
}

/**
 * Build child nodes recursively for an element.
 * 
 * @param {Element} element - The parent DOM element
 * @param {string} parentXpath - The XPath of the parent element
 * @returns {XmlNode[]} Array of child tree nodes
 */
function buildChildNodes(element, parentXpath) {
    const children = [];

    for (const child of element.children) {
        children.push(buildTreeFromElement(child, parentXpath));
    }

    return children;
}

/**
 * Generate a unique comparison key for an element.
 * 
 * The key is used to identify "logically same" elements when comparing
 * two XML documents. It uses the tag name plus any identifying attributes
 * (id, name, or key).
 * 
 * @param {string} tagName - The element's tag name
 * @param {Object.<string, string>} attributes - The element's attributes
 * @returns {string} A unique comparison key
 * 
 * @example
 * // <item id="123"> generates key: "item[@id='123']"
 * // <item> without id generates key: "item"
 */
function generateComparisonKey(tagName, attributes) {
    // List of attributes that typically identify unique elements
    const identifyingAttributes = ['id', 'name', 'key'];

    let key = tagName;

    // Check for identifying attributes in priority order
    for (const attrName of identifyingAttributes) {
        if (attributes[attrName]) {
            key += `[@${attrName}="${attributes[attrName]}"]`;
            break; // Only use the first matching attribute
        }
    }

    return key;
}

// ============================================================================
// TREE TRAVERSAL UTILITIES
// ============================================================================

/**
 * Flatten a tree into a Map of XPath -> Node for fast lookups.
 * 
 * This is useful for comparing two trees, as you can quickly look up
 * whether a path exists and get its node data.
 * 
 * @param {XmlNode} tree - The root of the tree to flatten
 * @returns {Map<string, XmlNode>} Map from XPath to node
 * 
 * @example
 * const map = flattenTree(tree);
 * const node = map.get('/root/item[1]');
 */
export function flattenTree(tree) {
    const map = new Map();
    traverseAndCollect(tree, node => map.set(node.xpath, node));
    return map;
}

/**
 * Get all XPaths from a tree as a Set.
 * 
 * Useful for quick existence checks and set operations
 * (union, intersection, difference) between two trees.
 * 
 * @param {XmlNode} tree - The root of the tree
 * @returns {Set<string>} Set of all XPaths in the tree
 */
export function getAllXPaths(tree) {
    const paths = new Set();
    traverseAndCollect(tree, node => paths.add(node.xpath));
    return paths;
}

/**
 * Count the total number of nodes in a tree.
 * 
 * @param {XmlNode} tree - The root of the tree
 * @returns {number} Total node count
 */
export function countNodes(tree) {
    let count = 0;
    traverseAndCollect(tree, () => count++);
    return count;
}

/**
 * Generic tree traversal that calls a callback for each node.
 * 
 * Uses depth-first traversal (parent before children).
 * 
 * @param {XmlNode} node - The starting node
 * @param {function(XmlNode): void} callback - Function to call for each node
 */
function traverseAndCollect(node, callback) {
    callback(node);

    for (const child of node.children) {
        traverseAndCollect(child, callback);
    }
}

/**
 * Find a node by its XPath.
 * 
 * @param {XmlNode} tree - The root of the tree
 * @param {string} xpath - The XPath to find
 * @returns {XmlNode|null} The found node or null
 */
export function findNodeByXPath(tree, xpath) {
    const map = flattenTree(tree);
    return map.get(xpath) || null;
}
