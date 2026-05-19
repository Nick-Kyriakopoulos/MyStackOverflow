"use client";

import {ReactNode} from "react";
import {RouterProvider} from "@heroui/react";
import {useRouter} from "next/navigation";
import {ThemeProvider} from "next-themes";

export default function Providers({children}: {children: ReactNode}) {
    const router = useRouter();

    return (
        <ThemeProvider attribute={"class"} defaultTheme={'light'}>
            <RouterProvider navigate={router.push} >
                {children}
            </RouterProvider>
        </ThemeProvider>
    );
}