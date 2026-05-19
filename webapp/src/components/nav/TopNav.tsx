import Link from "next/link";
import {AcademicCapIcon} from "@heroicons/react/24/solid";
import {MagnifyingGlassIcon} from "@heroicons/react/24/outline";
import {Button, InputGroup} from "@heroui/react";
import ThemeToggle from "@/components/nav/ThemeToggle";

export default function TopNav() {
    return (
        <header className={'p-2 w-full fixed top-0 z-50 border-b bg-white dark:bg-gray-900 dark:border-gray-700'}>
            <div className={'flex px-10 mx-auto'}>
                <div className={'flex items-center gap-6'}>
                    <Link href={'/'} className={'flex items-center gap-3 max-h-16'}>
                        <AcademicCapIcon className={'size-10 text-green-900 dark:text-purple-400'} />
                        <h3 className={'text-xl font-semibold uppercase dark:text-white'}>MyStackOverflow</h3>
                    </Link>
                    <nav className={'flex gap-3 my-2 text-md text-neutral-500 dark:text-gray-400'}>
                        <Link href={'/'} >About</Link>
                        <Link href={'/'} >Products</Link>
                        <Link href={'/'} >Contact</Link>
                    </nav>
                </div>
                <InputGroup className={'ml-6 w-full'} variant={'secondary'}>
                    <InputGroup.Prefix>
                        <MagnifyingGlassIcon className={'size-7 text-blue-500'} />
                    </InputGroup.Prefix>
                    <InputGroup.Input type={"search"} placeholder={'Search'} />
                </InputGroup>

                <div className={'flex ml-auto basis-1/4 shrink-0 justify-end gap-3'}>
                    <ThemeToggle />
                    <Button className={'dark:text-purple-400 dark:border-purple-400 hover:bg-green-900 hover:text-white dark:hover:bg-purple-700 dark:hover:text-white transition-colors duration-200'} variant={'outline'}>Login</Button>
                    <Button className={'text-green-900 dark:text-purple-400 dark:border-purple-400 hover:bg-green-900 hover:text-white dark:hover:bg-purple-700 dark:hover:text-white transition-colors duration-200'} variant={'outline'}>Register</Button>
                </div>
            </div>
        </header>
    );
}
