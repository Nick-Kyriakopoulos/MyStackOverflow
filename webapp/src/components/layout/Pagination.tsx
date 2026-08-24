'use client';

import {Pagination as HeroPagination} from "@heroui/react";
import {usePathname, useRouter, useSearchParams} from "next/navigation";

type Props = {
    page: number;
    pageSize: number;
    totalCount: number;
}

// Which page numbers to show. Beyond seven pages the middle collapses so the control
// keeps a fixed width instead of growing with the data.
function pageNumbers(page: number, totalPages: number): (number | 'gap')[] {
    if (totalPages <= 7) {
        return Array.from({length: totalPages}, (_, i) => i + 1);
    }

    const pages: (number | 'gap')[] = [1];
    if (page > 3) pages.push('gap');

    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
        pages.push(i);
    }

    if (page < totalPages - 2) pages.push('gap');
    pages.push(totalPages);

    return pages;
}

export default function Pagination({page, pageSize, totalCount}: Props) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const totalPages = Math.ceil(totalCount / pageSize);

    // One page is not a choice, so there is nothing to show.
    if (totalPages <= 1) return null;

    const goTo = (next: number) => {
        // Built from the current query so the tag filter and sort survive paging.
        const params = new URLSearchParams(searchParams);
        params.set('page', String(next));
        router.push(`${pathname}?${params}`);
    };

    const first = (page - 1) * pageSize + 1;
    const last = Math.min(page * pageSize, totalCount);

    return (
        <HeroPagination className={'mt-6 justify-center'}>
            <HeroPagination.Summary>
                Showing {first}-{last} of {totalCount} questions
            </HeroPagination.Summary>
            <HeroPagination.Content>
                <HeroPagination.Item>
                    <HeroPagination.Previous isDisabled={page === 1} onPress={() => goTo(page - 1)}>
                        <HeroPagination.PreviousIcon/>
                        <span>Previous</span>
                    </HeroPagination.Previous>
                </HeroPagination.Item>

                {pageNumbers(page, totalPages).map((p, i) => (
                    <HeroPagination.Item key={p === 'gap' ? `gap-${i}` : p}>
                        {p === 'gap' ? (
                            <HeroPagination.Ellipsis/>
                        ) : (
                            <HeroPagination.Link isActive={p === page} onPress={() => goTo(p)}>
                                {p}
                            </HeroPagination.Link>
                        )}
                    </HeroPagination.Item>
                ))}

                <HeroPagination.Item>
                    <HeroPagination.Next isDisabled={page === totalPages} onPress={() => goTo(page + 1)}>
                        <span>Next</span>
                        <HeroPagination.NextIcon/>
                    </HeroPagination.Next>
                </HeroPagination.Item>
            </HeroPagination.Content>
        </HeroPagination>
    );
}
