'use client'

import {Button} from "@heroui/react";
import {useTheme} from "next-themes";
import {MoonIcon, SunIcon} from "@heroicons/react/24/solid";
import {useEffect, useState} from "react";

export default function ThemeToggle() {
    const {theme, setTheme} = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <Button
            className={'rounded-lg border-2 bg-black border-black hover:black hover:bg-black/80 text-white dark:bg-yellow-300 dark:border-yellow-300 dark:hover:bg-yellow-300/80 dark:text-gray-900'}
            isIconOnly
            aria-label={'Toggle theme'}
            onPress={() => setTheme(theme === 'light' ? 'dark' : 'light')}
        >
            {theme === 'light' ? (
                <MoonIcon className="h-8" />
            ):(
                <SunIcon className="h-8 " />
            )}
        </Button>
    );
}