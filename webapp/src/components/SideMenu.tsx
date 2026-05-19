'use client'

import {HomeIcon, QuestionMarkCircleIcon, TagIcon, UserIcon} from "@heroicons/react/24/solid";
import {usePathname} from "next/navigation";
import Link from "next/link";

export default function SideMenu() {
    const pathname = usePathname();
    const navLinks = [
        {key: 'home', icon: HomeIcon, text: 'Home', href: '/'},
        {key: 'questions', icon: QuestionMarkCircleIcon, text: 'Questions', href: '/questions'},
        {key: 'tags', icon: TagIcon, text: 'Tags', href: '/tags'},
        {key: 'session', icon: UserIcon, text: 'User Session', href: '/session'}
    ]

    return (
        <nav className={'flex flex-col sticky top-20 ml-6 w-48 gap-1'}>
            {navLinks.map(({key, href, icon: Icon, text}) => (
                <Link
                    key={key}
                    href={href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-base transition-colors
                        ${pathname === href
                            ? 'text-green-900 font-semibold bg-green-900/10 dark:text-purple-400 dark:bg-purple-400/10'
                            : 'text-gray-600 dark:text-gray-400 hover:text-green-900 dark:hover:text-purple-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                >
                    <Icon className={'size-5 shrink-0'} />
                    {text}
                </Link>
            ))}
        </nav>
    );
}