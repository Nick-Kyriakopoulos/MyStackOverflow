"use client";

import {ReactNode, useEffect} from "react";
import {RouterProvider, ToastProvider} from "@heroui/react";
import {useRouter} from "next/navigation";
import {ThemeProvider} from "next-themes";
import {useTagStore} from "@/lib/useTagStore";
import {getTags} from "@/lib/actions/tag-actions";

export default function Providers({children}: {children: ReactNode}) {
    const router = useRouter();
    const setTags = useTagStore((state) => state.setTags);
    
    useEffect(() => {
        const loadTags= async () => {
            const {data: tags} = await  getTags();
            if (tags) setTags(tags);
        }
        
        void loadTags();
    }, [setTags]);

    return (
        <ThemeProvider attribute={"class"} defaultTheme={'light'}>
            <RouterProvider navigate={router.push}>
                {children}
                <ToastProvider placement="bottom end" maxVisibleToasts={5} />
            </RouterProvider>
        </ThemeProvider>
    );
}