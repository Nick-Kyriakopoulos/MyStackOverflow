'use client'

import Link from "next/link";
import {Button} from "@heroui/react";
import {useEffect} from "react";

export default function Error(
                { error, 
                    reset }: {
                    error: Error & {digest?: string};
                    reset: () => void 
 }) {
    useEffect(() => {
        console.error( error);
    }, [error]);
    
    return (
        <div className={'flex flex-col items-center justify-center h-full gap-4 text-gray-600 dark:text-gray-400'}>
            <h1 className={'text-6xl font-bold text-green-900 dark:text-purple-400'}>Something went wrong!</h1>
            <h3 className={'text-3xl font-bold text-danger'}>{error.message}</h3>
            <div className={'flex gap-3'}>
                <Button
                    onClick={reset}
                    className={'bg-green-900 dark:bg-purple-700 text-white font-semibold hover:opacity-90 transition-opacity'}
                >
                    Try Again
                </Button>
                <Link href={'/'}>
                    <Button className={'bg-green-900 dark:bg-purple-700 text-white font-semibold hover:opacity-90 transition-opacity'}>
                        Go Home
                    </Button>
                </Link>
            </div>
        </div>
    );
}
