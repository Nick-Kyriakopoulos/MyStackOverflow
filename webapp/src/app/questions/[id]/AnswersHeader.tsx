'use client';

import { Select, ListBox } from "@heroui/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AnswerSort } from "@/lib/types";
import Panel from "@/components/layout/Panel";

type Props = {
    answerCount: number;
    sort: AnswerSort;
}

const SORT_LABELS: Record<AnswerSort, string> = {
    highScore: 'Highest score (default)',
    created: 'Date created',
};

export default function AnswersHeader({ answerCount, sort }: Props) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Kept in the URL rather than local state so the choice survives a refresh and can
    // be linked to - and so the server component does the sorting.
    const onChange = (key: AnswerSort) => {
        const params = new URLSearchParams(searchParams);
        params.set('answerSort', key);
        router.push(`${pathname}?${params}`, {scroll: false});
    };

    return (
        <Panel variant={'header'} className="mt-6 flex items-center justify-between py-5">
            <div>
                <div className="text-2xl font-semibold tracking-tight">
                    {answerCount} {answerCount === 1 ? 'Answer' : 'Answers'}
                </div>
                <p className="mt-1 text-sm text-neutral-600 dark:text-gray-300">
                    Review the community responses and compare the most helpful explanations.
                </p>
            </div>
            <div className="ml-auto flex items-center gap-3 justify-end">
                <Select
                    aria-label="Sort answers"
                    selectedKey={sort}
                    onSelectionChange={(key) => onChange(key as AnswerSort)}
                    className="min-w-60"
                >
                    <Select.Trigger>
                        <Select.Value>{SORT_LABELS[sort]}</Select.Value>
                    </Select.Trigger>
                    <Select.Popover>
                        <ListBox>
                            <ListBox.Item id="highScore">{SORT_LABELS.highScore}</ListBox.Item>
                            <ListBox.Item id="created">{SORT_LABELS.created}</ListBox.Item>
                        </ListBox>
                    </Select.Popover>
                </Select>
            </div>
        </Panel>
    );
}
