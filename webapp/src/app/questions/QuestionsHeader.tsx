'use client'

import {Button, Tabs} from "@heroui/react";
import Link from "next/link";

type Props = {
    tag: string;
    total: number;
}

export default function QuestionsHeader({tag, total}: Props) {
    const tabs = [
        {key: 'newest', label: 'Newest'},
        {key: 'active', label: 'Active'},
        {key: 'unanswered', label: 'Unanswered'},
    ]
    
    return (
        <div className={'flex flex-col w-full border-b border-neutral-300 dark:border-gray-700 gap-4 pb-4'}>
            <div className={'flex justify-between px-6'}>
                <div className={'text-3xl font-semibold'}>
                    {tag ? `[${tag}]` : 'Newest Questions'}
                </div>
                <Link href={'/questions/ask'}>
                    <Button className={'bg-green-900 dark:bg-purple-700 text-white'} >
                        Ask Question
                    </Button>
                </Link>
            </div>
            <div className={'flex justify-between px-6 items-center'}>
                <div>{total} {total === 1 ? 'Question' : 'Questions'}</div>
                <div className={'flex items-center'}>
                    <Tabs>
                        <Tabs.List className={'bg-stone-300 dark:bg-gray-800 p-1 rounded-lg gap-1'}>
                            {tabs.map(item => (
                                <Tabs.Tab
                                    key={item.key}
                                    className={'px-4 py-1.5 rounded-md text-sm font-medium text-gray-600 dark:text-gray-400 data-selected:bg-white dark:data-selected:bg-gray-700 data-selected:text-green-900 dark:data-selected:text-purple-400 data-selected:shadow-sm data-selected:font-semibold transition-all duration-450'}
                                >
                                    {item.label}
                                </Tabs.Tab>
                            ))}
                        </Tabs.List>
                    </Tabs>
                </div>
            </div>
        </div>
    );
}