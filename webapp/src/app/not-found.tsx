import Link from "next/link";
import { Button } from "@heroui/react";

export default function NotFound() {
    return (
        <div className={'flex flex-col items-center justify-center h-full gap-4 text-gray-600 dark:text-gray-400'}>
            <h1 className={'text-6xl font-bold text-green-900 dark:text-purple-400'}>404</h1>
            <p className={'text-xl'}>This page could not be found.</p>
            <Link href={'/'}>
                <Button className={'bg-green-900 dark:bg-purple-700 text-white font-semibold'}>
                    Go Home
                </Button>
            </Link>
        </div>
    );
}
