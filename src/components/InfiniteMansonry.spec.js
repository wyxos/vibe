/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import InfiniteMasonry from './InfiniteMasonry.vue';
import { nextTick } from 'vue';

describe('InfiniteMasonry layout calculations', () => {
    let wrapper;

    const mockPages = [
        {
            page: 1,
            items: [
                { id: 'a', width: 100, height: 200, src: 'img1.jpg' },
                { id: 'b', width: 100, height: 300, src: 'img2.jpg' },
                { id: 'c', width: 100, height: 150, src: 'img3.jpg' }
            ]
        }
    ];

    beforeEach(() => {
        // Create mock container before mounting
        const div = document.createElement('div');
        document.body.appendChild(div);

        // Fake layout size via getBoundingClientRect (JSDOM-friendly)
        vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(900);

        wrapper = mount(InfiniteMasonry, {
            props: {
                modelValue: mockPages,
                options: {
                    sizes: {
                        3: { min: 0, max: 2000 }
                    },
                    gutterX: 10,
                    gutterY: 10
                }
            },
            attachTo: div
        });

        // Override getScrollbarWidth to return 0
        wrapper.vm.getScrollbarWidth = () => 0;

        // Trigger initial resize logic
        wrapper.vm.onResize();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('computes correct layout positions for items', async () => {
        await nextTick();

        const layouts = wrapper.vm.layouts;
        expect(layouts).toHaveLength(3);

        const colWidth = Math.floor((900 - 2 * 10) / 3); // 3 cols, 2 gutters

        expect(layouts[0]).toMatchObject({
            id: 'a',
            left: 0,
            top: 0,
            width: colWidth,
            height: Math.round((200 / 100) * colWidth)
        });

        expect(layouts[1]).toMatchObject({
            id: 'b',
            left: colWidth + 10,
            top: 0
        });

        expect(layouts[2]).toMatchObject({
            id: 'c',
            left: (colWidth + 10) * 2,
            top: 0
        });
    });
});
