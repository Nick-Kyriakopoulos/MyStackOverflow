import {Chip} from "@heroui/react";
import Link from "next/link";

type Props = {
    slug: string;
}

// The same chip appears on the question list and on the detail page - keeping one
// copy stops the two drifting apart.
export default function TagLink({slug}: Props) {
    return (
        <Link href={`/questions?tag=${slug}`}>
            <Chip
                size={'sm'}
                className={'border border-green-200 bg-green-100/80 py-1 text-green-900 transition-colors hover:bg-green-200 dark:border-purple-500/40 dark:bg-purple-500/15 dark:text-purple-200 dark:hover:bg-purple-500/25'}
            >
                {slug}
            </Chip>
        </Link>
    );
}
