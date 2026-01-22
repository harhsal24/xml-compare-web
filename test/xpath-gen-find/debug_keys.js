import fs from 'fs';
import { JSDOM } from 'jsdom';
import { parseXml } from '../../src/core/xmlParser.js';

// Polyfill DOMParser
const dom = new JSDOM();
global.DOMParser = dom.window.DOMParser;
global.Node = dom.window.Node;

const leftXml = fs.readFileSync('./test/xpath-gen-find/left.xml', 'utf8');
const rightXml = fs.readFileSync('./test/xpath-gen-find/right.xml', 'utf8');

const leftTree = parseXml(leftXml);
const rightTree = parseXml(rightXml);

console.log('--- LEFT TREE KEYS ---');
if (leftTree.children) leftTree.children.forEach(c => console.log(c.key, c.xpath));

console.log('--- RIGHT TREE KEYS ---');
if (rightTree.children) rightTree.children.forEach(c => console.log(c.key, c.xpath));
