'use client';

import {Button} from "@heroui/react";
import {ClipboardIcon} from "@heroicons/react/24/outline";
import {successToast} from "@/lib/util";

type Props = {
    value: string
}

export default function SessionSnippet({value}: Props) {
    const onCopy = async () => {
        await navigator.clipboard.writeText(value);
        successToast('Copied to clipboard');
    }

    return (
        <div className={'relative w-full mt-4'}>
            <Button
                className={'absolute top-2 right-2 border-blue-500 text-blue-900 hover:bg-blue-300 dark:border-blue-500 dark:text-blue-200 dark:hover:bg-blue-700/60'}
                isIconOnly
                aria-label={'Copy'}
                size={'sm'}
                variant={'ghost'}
                onPress={onCopy}
            >
                <ClipboardIcon className={'size-4'}/>
            </Button>
            <pre className={'w-full rounded-lg border border-blue-400 bg-blue-200 p-4 pr-12 text-sm text-blue-950 text-wrap whitespace-pre-wrap break-all dark:border-blue-600 dark:bg-blue-900 dark:text-blue-50'}>
                {value}
            </pre>
        </div>
    );
}
