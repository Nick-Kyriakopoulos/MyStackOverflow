'use client';

import { useState } from "react";
import { Select, ListBox } from "@heroui/react";
import Panel from "@/components/layout/Panel";

type Props = {
    answerCount: number;
}

const SORT_LABELS: Record<string, string> = {
    highScore: 'Highest score (default)',
    created: 'Date created',
};

export default function AnswersHeader({ answerCount }: Props) {
    const [sortKey, setSortKey] = useState<string>('highScore');

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
                    aria-label="Select sorting"
                    value={sortKey}
                    onChange={(key) => setSortKey(key as string)}
                    className="min-w-60"
                >
                    <Select.Trigger>
                        <Select.Value>{SORT_LABELS[sortKey]}</Select.Value>
                    </Select.Trigger>
                    <Select.Popover>
                        <ListBox>
                            <ListBox.Item id="highScore">Highest score (default)</ListBox.Item>
                            <ListBox.Item id="created">Date created</ListBox.Item>
                        </ListBox>
                    </Select.Popover>
                </Select>
            </div>
        </Panel>
    );
}