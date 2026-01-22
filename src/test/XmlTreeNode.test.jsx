import { render, screen } from '@testing-library/react';
import XmlTreeNode from '../components/XmlTreeNode';
import useXmlStore from '../store/useXmlStore';

// Mock the store
vi.mock('../store/useXmlStore');

describe('XmlTreeNode', () => {
    it('shows borders when showBorders is true', () => {
        useXmlStore.mockReturnValue({
            showBorders: true,
            diffResults: null,
            selectedXPath: null,
            fontSize: 14,
            leftTree: null,
            rightTree: null
        });

        const node = { tagName: 'root', children: [], attributes: {}, textContent: '', xpath: '/root', key: 'root' };
        render(<XmlTreeNode node={node} side="left" />);

        const nodeElement = screen.getByText('<root>').parentElement;
        expect(nodeElement).toHaveClass('border');
    });

    it('hides borders when showBorders is false', () => {
        useXmlStore.mockReturnValue({
            showBorders: false,
            diffResults: null,
            selectedXPath: null,
            fontSize: 14,
            leftTree: null,
            rightTree: null
        });

        const node = { tagName: 'root', children: [], attributes: {}, textContent: '', xpath: '/root', key: 'root' };
        render(<XmlTreeNode node={node} side="left" />);

        const nodeElement = screen.getByText('<root>').parentElement;
        expect(nodeElement).not.toHaveClass('border');
    });
});
