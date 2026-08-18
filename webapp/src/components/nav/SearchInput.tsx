"use client";

import {SearchField} from "@heroui/react";
import React, {useEffect} from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import clsx from "clsx";
import {Question} from "@/lib/types";
import {searchQuestions} from "@/lib/actions/question-actions";

export default function SearchInput() {
    const router = useRouter();
    const [query, setQuery] = React.useState('');
    const [loading, setLoading] = React.useState(false);
    const [results, setResults] = React.useState<Question[] | null>(null);
    const [showDropdown, setShowDropdown] = React.useState(false);
    const [activeIndex, setActiveIndex] = React.useState(-1);
    const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);
    const containerRef = React.useRef<HTMLDivElement | null>(null);
    const itemRefs = React.useRef<(HTMLAnchorElement | null)[]>([]);

    useEffect(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        if (!query) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setResults(null);
            setShowDropdown(false);
            setActiveIndex(-1);
            return;
        }
        setLoading(true);
        timeoutRef.current = setTimeout(() => {
            searchQuestions(query)
                .then(({data}) => {
                    setResults(data ?? []);
                    setShowDropdown(true);
                    setActiveIndex(-1);
                })
                .finally(() => setLoading(false));
        }, 300);
    }, [query]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (activeIndex >= 0) {
            itemRefs.current[activeIndex]?.scrollIntoView({block: 'nearest'});
        }
    }, [activeIndex]);

    const handleKeyDown = (event: React.KeyboardEvent) => {
        if (event.key === 'Enter') {
            if (showDropdown && results && results.length > 0 && activeIndex >= 0) {
                event.preventDefault();
                const question = results[activeIndex];
                setShowDropdown(false);
                router.push(`/questions/${question.id}`);
            } else if (query.trim()) {
                event.preventDefault();
                setShowDropdown(false);
                router.push(`/search?query=${encodeURIComponent(query)}`);
            }
            return;
        }

        if (!showDropdown || !results || results.length === 0) return;

        if (event.key === 'ArrowDown') {
            event.preventDefault();
            setActiveIndex(prev => (prev + 1) % results.length);
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            setActiveIndex(prev => (prev <= 0 ? results.length - 1 : prev - 1));
        } else if (event.key === 'Escape') {
            setShowDropdown(false);
        }
    };

    return (
        <div ref={containerRef} className={'relative ml-6 w-full max-w-3xl'}>
        <SearchField className={'w-full'} name={'search'} value={query} onChange={setQuery}>
            <SearchField.Group className={'w-full'}>
                <SearchField.SearchIcon className={'text-green-900 dark:text-purple-400'} />
                <SearchField.Input placeholder="Search..." onKeyDown={handleKeyDown} />
                <SearchField.ClearButton />
            </SearchField.Group>
        </SearchField>
        {showDropdown && results && (
            <ul className={'absolute top-full left-0 mt-2 w-full max-h-96 overflow-y-auto bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md shadow-lg z-50'}>
                {!loading && results.length === 0 && (
                    <li className={'px-4 py-2 text-gray-500 dark:text-gray-400'}>No results found</li>
                )}
                {!loading && results.map((question, index) => (
                    <li key={question.id}>
                        <Link
                            ref={el => { itemRefs.current[index] = el; }}
                            href={`/questions/${question.id}`}
                            onClick={() => setShowDropdown(false)}
                            onMouseEnter={() => setActiveIndex(index)}
                            className={clsx('flex items-start gap-3 px-4 py-2 cursor-pointer', {
                                'bg-gray-100 dark:bg-gray-700': index === activeIndex,
                                'hover:bg-gray-100 dark:hover:bg-gray-700': index !== activeIndex
                            })}
                        >
                            <div
                                className={clsx('flex shrink-0 flex-col items-center rounded-lg px-2 py-1 text-xs', {
                                    'bg-stone-100 dark:bg-gray-700': question.answerCount === 0,
                                    'border border-green-600/40 bg-green-50 text-green-800 dark:border-purple-500/50 dark:bg-purple-500/10 dark:text-purple-200': question.answerCount > 0,
                                    'border border-green-600 bg-green-600 text-white dark:border-purple-600 dark:bg-purple-600': question.hasAcceptedAnswer
                                })}
                            >
                                <span className={'font-semibold'}>{question.answerCount}</span>
                                <span>{question.answerCount === 1 ? 'answer' : 'answers'}</span>
                            </div>
                            <div className={'min-w-0 flex-1'}>
                                <div className={'whitespace-normal wrap-break-word font-medium'}>{question.title}</div>
                                <div
                                    className={'line-clamp-1 text-sm text-gray-500 dark:text-gray-400'}
                                    dangerouslySetInnerHTML={{__html: question.content}}
                                />
                            </div>
                        </Link>
                    </li>
                ))}
            </ul>
        )}
        </div>
    );
}
