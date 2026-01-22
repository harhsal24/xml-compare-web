import { render, screen } from '@testing-library/react';
import XmlPanel from '../components/XmlPanel';
import useXmlStore from '../store/useXmlStore';

// Mock the store
vi.mock('../store/useXmlStore');

describe('XmlPanel', () => {
    it('truncates long XPaths', () => {
        const longXPath = '/a/very/long/xpath/that/should/be/truncated/and/not/overflow/the/container';
        useXmlStore.mockReturnValue({
            selectedXPath: longXPath,
            tree: { tagName: 'root', children: [], attributes: {}, textContent: '', xpath: '/root', key: 'root' },
            leftXml: '',
            rightXml: '',
            leftTree: null,
            rightTree: null,
            leftError: null,
            rightError: null,
            diffResults: null,
            isComparing: false,
            activeCategory: null,
            fontSize: 14,
            isZenMode: false,
            showBorders: true,
        });

        render(<XmlPanel side="left" title="Left XML" />);

        const xpathElement = screen.getByText(longXPath);
        expect(xpathElement).toHaveClass('truncate');
    });
});
