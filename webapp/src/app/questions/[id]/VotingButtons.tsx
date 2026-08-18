import {Button} from "@heroui/react";
import {ArrowDownCircleIcon, ArrowUpCircleIcon, CheckIcon} from "@heroicons/react/24/outline";

type Props = {
    accepted?: boolean;
}

export default function VotingButtons({accepted}: Props){
    return (
        <div className={'flex h-full shrink-0 flex-col items-center justify-start gap-3 rounded-2xl bg-stone-100/80 px-2 py-3 dark:bg-gray-800/80'}>
            <Button isIconOnly variant={'ghost'} className={'border-0 text-green-900 hover:text-green-700 dark:text-purple-400 dark:hover:text-purple-300'}>
                <ArrowUpCircleIcon className={'w-12 h-12'} />
            </Button>
            <span className={'text-xl font-semibold'}>0</span>
            <Button isIconOnly variant={'ghost'} className={'border-0 text-green-900 hover:text-green-700 dark:text-purple-400 dark:hover:text-purple-300'}>
                <ArrowDownCircleIcon className={'w-12 h-12'} />
            </Button>
            {accepted && (
                <Button isIconOnly variant={'ghost'} className={'border-0'}>
                    <CheckIcon className={'size-12 text-green-600 dark:text-purple-400'} strokeWidth={4}/>
                </Button>
            )}
        </div>
    );
}