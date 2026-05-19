import {Button} from "@heroui/react";
import {ArrowDownCircleIcon, ArrowUpCircleIcon, CheckIcon} from "@heroicons/react/24/outline";

type Props = {
    accepted?: boolean;
}

export default function VotingButtons({accepted}: Props){
    return (
        <div className={'shrink-0 flex flex-col gap-3 items-center justify-start mt-4'}>
            <Button isIconOnly variant={'ghost'} className={'text-green-900 dark:text-purple-400 hover:text-green-700 dark:hover:text-purple-300 border-0'}>
                <ArrowUpCircleIcon className={'w-12 h-12'} />
            </Button>
            <span className={'text-xl font-semibold'}>0</span>
            <Button isIconOnly variant={'ghost'} className={'text-green-900 dark:text-purple-400 hover:text-green-700 dark:hover:text-purple-300 border-0'}>
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