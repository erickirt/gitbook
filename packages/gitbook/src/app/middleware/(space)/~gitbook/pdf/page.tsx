import {
    CustomizationSettings,
    Revision,
    RevisionPageDocument,
    RevisionPageGroup,
    SiteCustomizationSettings,
    Space,
} from '@gitbook/api';
import { Icon } from '@gitbook/icons';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import * as React from 'react';

import { DocumentView } from '@/components/DocumentView';
import { TrademarkLink } from '@/components/TableOfContents/Trademark';
import { PolymorphicComponentProp } from '@/components/utils/types';
import { getSpaceLanguage } from '@/intl/server';
import { tString } from '@/intl/translate';
import {
    getDocument,
    getSpace,
    getSpaceCustomization,
    getSpaceContentData,
    getSiteData,
} from '@/lib/api';
import { getPagePDFContainerId, PageHrefContext, getAbsoluteHref } from '@/lib/links';
import { resolvePageId } from '@/lib/pages';
import { ContentRefContext, resolveContentRef } from '@/lib/references';
import { tcls } from '@/lib/tailwind';
import { PDFSearchParams, getPDFSearchParams } from '@/lib/urls';

import './pdf.css';
import { PageControlButtons } from './PageControlButtons';
import { getSiteOrSpacePointerForPDF } from './pointer';
import { PrintButton } from './PrintButton';

const DEFAULT_LIMIT = 100;

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
    const pointer = await getSiteOrSpacePointerForPDF();
    const [space, { customization }] = await Promise.all([
        getSpace(pointer.spaceId, 'siteId' in pointer ? pointer.siteShareKey : undefined),
        'siteId' in pointer ? getSiteData(pointer) : getSpaceCustomization(),
    ]);

    return {
        title: customization.title ?? space.title,
        robots: 'noindex, nofollow',
    };
}

/**
 * Render a space as a standalone HTML page that can be printed as a PDF.
 */
export default async function PDFHTMLOutput(props: {
    searchParams: Promise<{ [key: string]: string }>;
}) {
    const pointer = await getSiteOrSpacePointerForPDF();

    const searchParams = new URLSearchParams(await props.searchParams);
    const pdfParams = getPDFSearchParams(new URLSearchParams(searchParams));

    // Build current PDF URL and preserve all search params
    let currentPDFUrl = await getAbsoluteHref('~gitbook/pdf', true);
    currentPDFUrl += '?' + searchParams.toString();

    // Load the content,
    const [{ customization }, { space, contentTarget, pages: rootPages }] = await Promise.all([
        'siteId' in pointer ? getSiteData(pointer) : getSpaceCustomization(),
        getSpaceContentData(pointer, 'siteId' in pointer ? pointer.siteShareKey : undefined),
    ]);
    const language = getSpaceLanguage(customization);

    // Compute the pages to render
    const { pages, total } = selectPages(rootPages, pdfParams);
    const pageIds = pages.map(
        ({ page }) => [page.id, getPagePDFContainerId(page)] as [string, string],
    );
    const linksContext: PageHrefContext = {
        pdf: pages.map(({ page }) => page.id),
    };

    return (
        <div className="print-mode">
            {pdfParams.back !== 'false' ? (
                <div className={tcls('fixed', 'left-12', 'top-12', 'print:hidden', 'z-50')}>
                    <a
                        title={tString(language, 'pdf_goback')}
                        href={pdfParams.back ?? (await getAbsoluteHref(''))}
                        className={tcls(
                            'flex',
                            'flex-row',
                            'items-center',
                            'justify-center',
                            'text-sm',
                            'text-dark/6',
                            'hover:text-primary',
                            'p-4',
                            'dark:text-light/5',
                            'rounded-full',
                            'bg-white',
                            'shadow-sm',
                            'hover:shadow-md',
                            'border-slate-300',
                            'border',
                        )}
                    >
                        <Icon icon="arrow-left" className={tcls('size-6')} />
                    </a>
                </div>
            ) : null}

            <div className={tcls('fixed', 'right-12', 'top-12', 'print:hidden', 'z-50')}>
                <PrintButton
                    title={tString(language, 'pdf_print')}
                    className={tcls(
                        'flex',
                        'flex-row',
                        'items-center',
                        'justify-center',
                        'text-sm',
                        'text-dark/6',
                        'hover:text-primary',
                        'p-4',
                        'dark:text-light/5',
                        'rounded-full',
                        'bg-white',
                        'shadow-sm',
                        'hover:shadow-md',
                        'border-slate-300',
                        'border',
                    )}
                >
                    <Icon icon="print" className={tcls('size-6')} />
                </PrintButton>
            </div>

            <PageControlButtons
                pageIds={pageIds}
                pdfHref={currentPDFUrl}
                singlePageMode={!!pdfParams.only}
                total={total}
                limit={pdfParams.limit ?? DEFAULT_LIMIT}
                trademark={
                    customization.trademark.enabled ? (
                        <TrademarkLink space={space} customization={customization} />
                    ) : null
                }
            />

            {pdfParams.only ? null : <PDFSpaceIntro space={space} customization={customization} />}
            {pages.map(({ page }) =>
                page.type === 'group' ? (
                    <PDFPageGroup key={page.id} space={space} page={page} />
                ) : (
                    <React.Suspense
                        key={page.id}
                        fallback={
                            <PrintPage id={getPagePDFContainerId(page)}>
                                <p>Loading...</p>
                            </PrintPage>
                        }
                    >
                        <PDFPageDocument
                            space={space}
                            page={page}
                            refContext={{
                                siteContext: 'siteId' in pointer ? pointer : null,
                                space,
                                revisionId: contentTarget.revisionId,
                                pages: rootPages,
                                page,
                                ...linksContext,
                            }}
                        />
                    </React.Suspense>
                ),
            )}
        </div>
    );
}

async function PDFSpaceIntro(props: {
    space: Space;
    customization: CustomizationSettings | SiteCustomizationSettings;
}) {
    const { space, customization } = props;

    return (
        <PrintPage isFirst>
            <div className={tcls('flex', 'items-center', 'justify-center', 'py-12')}>
                <h1 className={tcls('text-6xl', 'font-bold')}>
                    {customization.title ?? space.title}
                </h1>
            </div>
        </PrintPage>
    );
}

async function PDFPageGroup(props: { space: Space; page: RevisionPageGroup }) {
    const { page } = props;

    return (
        <PrintPage id={getPagePDFContainerId(page)}>
            <div
                className={tcls(
                    'break-before-page',
                    'mt-10',
                    'print:mt-0',
                    'flex',
                    'items-center',
                    'justify-center',
                    'py-12',
                )}
            >
                <h1 className={tcls('text-5xl', 'font-bold')}>{page.title}</h1>
            </div>
        </PrintPage>
    );
}

async function PDFPageDocument(props: {
    space: Space;
    page: RevisionPageDocument;
    refContext: ContentRefContext;
}) {
    const { space, page, refContext } = props;

    const document = page.documentId ? await getDocument(space.id, page.documentId) : null;

    return (
        <PrintPage id={getPagePDFContainerId(page)}>
            <h1 className={tcls('text-4xl', 'font-bold')}>{page.title}</h1>
            {page.description ? (
                <p className={tcls('decoration-primary/6', 'mt-2', 'mb-3')}>{page.description}</p>
            ) : null}

            {document ? (
                <DocumentView
                    document={document}
                    style={'mt-6 space-y-6'}
                    blockStyle={['max-w-full']}
                    context={{
                        mode: 'print',
                        content: {
                            spaceId: space.id,
                            revisionId: refContext.revisionId,
                        },
                        contentRefContext: refContext,
                        resolveContentRef: (ref) => resolveContentRef(ref, refContext),
                        getId: (id) => getPagePDFContainerId(page, id),
                    }}
                />
            ) : null}
        </PrintPage>
    );
}

function PrintPage(
    props: PolymorphicComponentProp<
        'div',
        {
            isFirst?: boolean;
        }
    >,
) {
    const { children, isFirst, className, ...rest } = props;

    return (
        <div
            {...rest}
            className={tcls(
                className,
                'my-11',
                'print:my-0',
                'mx-auto',
                'max-w-4xl',
                'w-full',
                'p-12',
                'print:p-0',
                'shadow-xl',
                'print:shadow-none',
                'rounded-sm',
                'bg-white',
                'min-h-[29.7cm]',
                'print:min-h-0',
                isFirst ? null : 'break-before-page',
                'break-anywhere',
            )}
        >
            {children}
        </div>
    );
}

type FlatPageEntry = { page: RevisionPageDocument | RevisionPageGroup; depth: number };

/**
 * Compute the ordered flat set of pages to render.
 */
function selectPages(
    rootPages: Revision['pages'],
    params: PDFSearchParams,
): { pages: FlatPageEntry[]; total: number } {
    const flattenPage = (
        page: RevisionPageDocument | RevisionPageGroup,
        depth: number,
    ): FlatPageEntry[] => {
        return [
            { page, depth },
            ...page.pages.flatMap((child) => {
                if (child.type !== 'document') {
                    return [];
                }

                if (child.hidden) {
                    return [];
                }

                return flattenPage(child, depth + 1);
            }),
        ];
    };

    const limitTo = (entries: FlatPageEntry[]) => {
        return {
            // Apply a soft-limit, the limit can be controlled by the URL to allow testing
            pages: entries.slice(0, params.limit ?? DEFAULT_LIMIT),
            total: entries.length,
        };
    };

    if (params.page) {
        const found = resolvePageId(rootPages, params.page);
        if (!found) {
            notFound();
        }

        if (!params.only) {
            return limitTo([{ page: found.page, depth: 0 }]);
        }

        return limitTo(flattenPage(found.page, 0));
    }

    const allPages = rootPages.flatMap((page) => {
        if (page.type !== 'document' && page.type !== 'group') {
            return [];
        }

        if (page.hidden) {
            return [];
        }

        return flattenPage(page, 0);
    });
    return limitTo(allPages);
}