import {Card, CardFooter, Chip} from "@heroui/react";
import Link from "next/link";
import {Tag} from "@/lib/types";

type Props = {
    tag: Tag;
}

export default function TagCard({tag}: Props) {
    return (
        <Link href={`/questions?tag=${tag.slug}`} className={'block h-full'}>
            <Card className="h-full cursor-pointer border border-neutral-200/80 bg-white/90 p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-green-300 hover:bg-white hover:shadow-xl dark:border-gray-800 dark:bg-gray-900/90 dark:hover:border-purple-500/60 dark:hover:bg-gray-900">
                <Card.Header className="flex items-start justify-between gap-3 px-0 pt-0">
                    <Chip className="border border-green-200 bg-green-100/80 text-sm font-medium text-green-900 dark:border-purple-500/40 dark:bg-purple-500/15 dark:text-purple-200">
                        {tag.slug}
                    </Chip>
                </Card.Header>
                <Card.Content className={'gap-3 px-0 pt-3'}>
                    <Card.Title className={'text-xl font-semibold tracking-tight'}>{tag.name}</Card.Title>
                    <Card.Description className={'line-clamp-3 text-sm leading-6 text-neutral-600 dark:text-gray-300'}>
                        {tag.description}
                    </Card.Description>
                </Card.Content>
                <CardFooter className={'mt-auto px-0 pb-0 pt-4 text-sm text-neutral-500 dark:text-gray-400'}>
                    Browse questions tagged <span className={'ml-1 font-medium text-green-800 dark:text-purple-300'}>{tag.slug}</span>
                </CardFooter>
            </Card>
        </Link>
    )
}