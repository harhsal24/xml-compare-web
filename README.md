# XML Compare Tool

A powerful side-by-side XML comparison tool with XPath awareness that highlights extra, missing, and different elements between two XML files.

![XML Compare Screenshot](./screenshots/comparison.png)

## Features

- 📄 **Side-by-side Comparison** - View both XML files simultaneously
- 🔍 **XPath Awareness** - Click any element to see its full XPath
- 🎨 **Visual Diff Highlighting**:
  - 🟢 **Matched** - Element exists and is identical in both files
  - 🟠 **Extra** - Element only exists in this file
  - 🟣 **Different** - Element exists in both but has different content/attributes
- 📊 **Statistics Dashboard** - See totals: elements, matched, left-only, right-only, different
- 📁 **File Upload** - Upload .xml files or paste XML content directly
- 🌳 **Collapsible Tree View** - Expand/collapse nested elements

## Tech Stack

- **Frontend**: React 19 (Vite)
- **Styling**: TailwindCSS 4
- **State Management**: Zustand
- **Testing**: Vitest + jsdom

## Project Architecture

```
src/
├── core/                    # 👈 Framework-agnostic core logic
│   ├── index.js             # Main exports
│   ├── xmlParser.js         # XML parsing with XPath generation
│   └── xmlComparer.js       # Comparison logic
│
├── test/                    # 👈 Test suite with fixtures
│   ├── fixtures/            # Sample XML files for testing
│   │   ├── sample-left.xml
│   │   ├── sample-right.xml
│   │   ├── complex-nested.xml
│   │   ├── multiple-siblings.xml
│   │   ├── attributes.xml
│   │   ├── minimal.xml
│   │   └── empty.xml
│   ├── fixtures.js          # Fixture loader utility
│   ├── xmlParser.test.js    # Parser unit tests (40 tests)
│   └── xmlComparer.test.js  # Comparer unit tests (24 tests)
│
├── utils/                   # Presentation layer adapters
│   ├── xmlParser.js         # Re-exports from core
│   └── xmlComparer.js       # Re-exports from core
│
├── store/                   # State management
│   └── useXmlStore.js       # Zustand store
│
├── components/              # React UI components
│   ├── CompareView.jsx      # Main comparison layout
│   ├── XmlPanel.jsx         # Input/tree panel
│   ├── XmlTreeNode.jsx      # Recursive tree node
│   └── DiffLegend.jsx       # Color legend
│
└── App.jsx                  # Root component
```

### Why This Architecture?

The core logic (`/src/core`) is **completely framework-agnostic**:
- No React, no browser APIs except DOMParser
- Can be used in Electron, Node.js CLI tools, or other frameworks
- Fully tested with 64 unit tests using sample XML fixtures
- Ready for future Electron desktop app migration

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### Installation

```bash
# Clone or navigate to the project
cd "xml compare web"

# Install dependencies
npm install

# Start development server
npm run dev
```

### Running Tests

```bash
# Run tests in watch mode
npm test

# Run tests once
npm run test:run
```

### Building for Production

```bash
npm run build
npm run preview
```

## Usage

1. **Load XML Files**:
   - Click "Upload" to select a .xml file, OR
   - Paste XML content directly into the text area

2. **Compare**:
   - Click the "Compare XML" button
   - View highlighted differences in both panels

3. **Explore**:
   - Click any element to see its XPath
   - Use expand/collapse toggles to navigate deep trees
   - Review statistics at the top for a quick summary

## Core Library API

If you want to use the comparison logic programmatically:

```javascript
import { parseXml, compareXml, getDiffStatus } from './src/core';

// Parse XML strings
const leftTree = parseXml('<root><a>1</a><b/></root>');
const rightTree = parseXml('<root><a>2</a><c/></root>');

// Compare trees
const results = compareXml(leftTree, rightTree);

console.log(results.stats);
// { totalLeft: 3, totalRight: 3, matched: 1, leftOnly: 1, rightOnly: 1, different: 1 }

console.log(results.leftOnly);   // ['/root/b']
console.log(results.rightOnly);  // ['/root/c']
console.log(results.different);  // ['/root/a']

// Get status for UI highlighting
const status = getDiffStatus('/root/a', results, 'left');
// 'different'
```

## Future Plans

- [ ] **Electron Desktop App** - The core library is ready for Electron migration
- [ ] Export diff report (HTML, JSON, PDF)
- [ ] Sync scroll between panels
- [ ] Search/filter by XPath
- [ ] Dark mode

## License

MIT
