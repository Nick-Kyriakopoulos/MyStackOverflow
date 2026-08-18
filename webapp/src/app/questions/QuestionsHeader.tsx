'use client'

import {Button, Chip, Tabs} from "@heroui/react";
import Link from "next/link";
import {useTagStore} from "@/lib/useTagStore";

type Props = {
    tag: string;
    total: number;
}

export default function QuestionsHeader({tag, total}: Props) {
    const selectedTag = useTagStore((state) => state.getTagBySlug(tag));
    const tabs = [
        {key: 'newest', label: 'Newest'},
        {key: 'active', label: 'Active'},
        {key: 'unanswered', label: 'Unanswered'},
    ]
    
    return (
        <div className={'rounded-3xl border border-neutral-200/70 bg-linear-to-br from-white via-stone-50 to-green-50 p-6 shadow-sm dark:border-gray-800 dark:from-gray-950 dark:via-gray-950 dark:to-purple-950/30'}>
            <div className={'flex flex-col gap-6'}>
                <div className={'flex flex-col gap-4 md:flex-row md:items-start md:justify-between'}>
                    <div className={'space-y-3'}>
                        {tag && (
                            <Chip className={'border border-green-200 bg-green-100 text-green-900 dark:border-purple-500/40 dark:bg-purple-500/15 dark:text-purple-200'}>
                                Tagged: {tag}
                            </Chip>
                        )}
                        <div className={'flex flex-col items-start gap-2'}>
                            <div className={'text-3xl font-bold tracking-tight md:text-4xl'}>
                                {tag ? `About ${tag}` : 'Newest Questions'}
                            </div>
                            <p className={'max-w-2xl text-sm leading-6 text-neutral-600 dark:text-gray-300'}>
                                {selectedTag?.description}
                            </p>
                        </div>
                        
                    </div>
                    <div className={'flex shrink-0'}>
                        <Link href={'/questions/ask'}>
                            <Button className={'bg-green-900 dark:bg-purple-700 text-white shadow-sm'}>
                                Ask Question
                            </Button>
                        </Link>
                    </div>
                </div>
                <div className={'flex flex-col gap-4 md:flex-row md:items-center md:justify-between'}>
                    <div className={'text-sm font-medium text-neutral-600 dark:text-gray-300'}>
                        {total} {total === 1 ? 'Question' : 'Questions'}
                    </div>
                    <div className={'flex items-center'}>
                        <Tabs>
                            <Tabs.List className={'bg-stone-200/80 dark:bg-gray-800/90 p-1 rounded-xl gap-1'}>
                                {tabs.map(item => (
                                    <Tabs.Tab
                                        key={item.key}
                                        className={'px-4 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 data-selected:bg-white dark:data-selected:bg-gray-700 data-selected:text-green-900 dark:data-selected:text-purple-300 data-selected:shadow-sm data-selected:font-semibold transition-all duration-300'}
                                    >
                                        {item.label}
                                    </Tabs.Tab>
                                ))}
                            </Tabs.List>
                        </Tabs>
                    </div>
                </div>
            </div>
        </div>
    );
}