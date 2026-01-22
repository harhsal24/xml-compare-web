import { JSDOM } from 'jsdom';

const dom = new JSDOM();
global.DOMParser = dom.window.DOMParser;
