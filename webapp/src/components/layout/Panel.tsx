import {ReactNode} from "react";
import clsx from "clsx";

type Props = {
    // 'header' is the tinted panel that opens a page; 'card' is the plain surface
    // that holds its content. Everything in the app sits on one or the other.
    variant?: 'header' | 'card';
    // Off for panels whose children draw their own edge-to-edge rows. A p-0 passed
    // through className would not win: it has the same specificity as p-6, and
    // Tailwind emits it earlier in the stylesheet.
    padded?: boolean;
    className?: string;
    children: ReactNode;
}

const VARIANTS = {
    header: 'border-neutral-200/70 bg-linear-to-br from-white via-stone-50 to-green-50 dark:border-gray-800 dark:from-gray-950 dark:via-gray-950 dark:to-purple-950/30',
    card: 'border-neutral-200/80 bg-white/90 dark:border-gray-800 dark:bg-gray-900/90',
};

export default function Panel({variant = 'card', padded = true, className, children}: Props) {
    return (
        <div className={clsx('rounded-3xl border shadow-sm', padded && 'p-6', VARIANTS[variant], className)}>
            {children}
        </div>
    );
}
