import {
    CustomizationSettings,
    Revision,
    RevisionPageDocument,
    RevisionPageGroup,
    SiteCustomizationSettings,
    SiteInsightsTrademarkPlacement,
    Space,
} from '@gitbook/api';
import React from 'react';

import { SiteContentPointer } from '@/lib/api';
import { ContentRefContext } from '@/lib/references';
import { tcls } from '@/lib/tailwind';

import { PagesList } from './PagesList';
import { TOCScrollContainer } from './TOCScroller';
import { Trademark } from './Trademark';

export function TableOfContents(props: {
    space: Space;
    customization: CustomizationSettings | SiteCustomizationSettings;
    content: SiteContentPointer;
    context: ContentRefContext;
    pages: Revision['pages'];
    ancestors: Array<RevisionPageDocument | RevisionPageGroup>;
    header?: React.ReactNode; // Displayed outside the scrollable TOC as a sticky header
    headerOffset: {
        sectionsHeader: boolean;
        topHeader: boolean;
    };
    innerHeader?: React.ReactNode; // Displayed outside the scrollable TOC, directly above the page list
}) {
    const { innerHeader, space, customization, pages, ancestors, header, context, headerOffset } =
        props;

    return (
        <aside // Sidebar container, responsible for setting the right dimensions and position for the sidebar.
            data-testid="table-of-contents"
            className={tcls(
                'group',
                'page-no-toc:hidden',

                'grow-0',
                'shrink-0',
                'basis-full',
                'lg:basis-72',

                'relative',
                'z-[1]',
                'lg:sticky',
                // Without header
                'lg:top-0',
                'lg:h-screen',

                // With header
                'site-header:lg:top-16',
                'site-header:lg:h-[calc(100vh_-_4rem)]',

                // With header and sections
                'site-header-sections:lg:top-[6.75rem]',
                'site-header-sections:lg:h-[calc(100vh_-_6.75rem)]',

                'pt-6',
                'pb-4',
                'sidebar-filled:lg:pr-6',

                'hidden',
                'navigation-open:flex',
                'lg:flex',
                'flex-col',
                'gap-4',

                'navigation-open:border-b',
                'border-tint-subtle',
            )}
        >
            {header && header}
            <div // The actual sidebar, either shown with a filled bg or transparent.
                className={tcls(
                    'lg:-ms-5',
                    'overflow-hidden',
                    'relative',

                    'flex',
                    'flex-col',
                    'flex-grow',

                    'sidebar-filled:bg-tint-subtle',
                    'theme-muted:bg-tint-subtle',
                    'theme-bold-tint:bg-tint-subtle',
                    '[html.sidebar-filled.theme-muted_&]:bg-tint-base',
                    '[html.sidebar-filled.theme-bold.tint_&]:bg-tint-base',

                    'sidebar-filled:rounded-xl',
                    'straight-corners:rounded-none',
                )}
            >
                {innerHeader && <div className={tcls('px-5 *:my-4')}>{innerHeader}</div>}
                <TOCScrollContainer // The scrollview inside the sidebar
                    className={tcls(
                        'flex',
                        'flex-grow',
                        'flex-col',

                        'p-2',
                        customization.trademark.enabled && 'lg:pb-20',

                        'overflow-y-auto',
                        'lg:gutter-stable',
                        '[&::-webkit-scrollbar]:bg-transparent',
                        '[&::-webkit-scrollbar-thumb]:bg-transparent',
                        'group-hover:[&::-webkit-scrollbar]:bg-tint-subtle',
                        'group-hover:[&::-webkit-scrollbar-thumb]:bg-tint-7',
                        'group-hover:[&::-webkit-scrollbar-thumb:hover]:bg-tint-8',
                    )}
                >
                    <PagesList
                        rootPages={pages}
                        pages={pages}
                        ancestors={ancestors}
                        context={context}
                        style={tcls('sidebar-list-line:border-l', 'border-tint-subtle')}
                    />
                    {customization.trademark.enabled ? (
                        <Trademark
                            space={space}
                            customization={customization}
                            placement={SiteInsightsTrademarkPlacement.Sidebar}
                        />
                    ) : null}
                </TOCScrollContainer>
            </div>
        </aside>
    );
}
