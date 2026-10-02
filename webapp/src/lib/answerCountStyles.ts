// The answer tally is colour-coded in three places - the question list, the search
// page and the search dropdown - and the three states have to mean the same thing
// everywhere: plain when nobody has answered, tinted once somebody has, solid once
// the asker accepted one.
export function answerCountStyles(answerCount: number, hasAcceptedAnswer: boolean) {
    return {
        'bg-stone-100 dark:bg-gray-800': answerCount === 0,
        'border border-green-600/40 bg-green-50 text-green-800 dark:border-purple-500/50 dark:bg-purple-500/10 dark:text-purple-200': answerCount > 0,
        'border border-green-700 bg-green-700 text-white dark:border-purple-600 dark:bg-purple-600': hasAcceptedAnswer,
    };
}
