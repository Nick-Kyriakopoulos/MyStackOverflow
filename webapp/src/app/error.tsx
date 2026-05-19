'use client'

import Link from "next/link";
import {Button} from "@heroui/react";

export default function Error({ reset }: { reset: () => void }) {
    return (
        <div className={'flex flex-col items-center justify-center h-full gap-4 text-gray-600 dark:text-gray-400'}>
            <h1 className={'text-6xl font-bold text-green-900 dark:text-purple-400'}>Oops!</h1>
            <p className={'text-xl'}>Something went wrong.</p>
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
