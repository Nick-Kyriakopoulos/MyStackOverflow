export type Profile = {
    id: string
    displayName: string
    imageUrl?: string
    reputation: number
    createdAt: string
}

export type Question = {
    id: string
    title: string
    content: string
    askerId: string
    // Filled in by question-actions, not by the API - see enrichWithAuthors.
    author: Profile
    createdAt: string
    updatedAt?: string
    viewCount: number
    tagSlugs: string[]
    hasAcceptedAnswer: boolean
    votes: number
    answerCount: number
    answers: Answer[]
}

export type Answer = {
    id: string
    content: string
    userId: string
    author: Profile
    createdAt: string
    updatedAt?: string
    accepted: boolean
    votes: number
    questionId: string
}

// A vote this user has already cast. Votes are final, so the presence of a record is
// what disables the buttons - there is no toggling.
export type VoteRecord = {
    targetId: string
    targetType: 'question' | 'answer'
    value: number
}

// Offset paging. totalCount is across all pages, not the length of items.
export type Paged<T> = {
    items: T[]
    totalCount: number
    page: number
    pageSize: number
}

export type QuestionSort = 'newest' | 'active' | 'unanswered';

// Answers are sorted in the web app, not the API - they are never paginated, and EF
// cannot reliably order an included collection.
export type AnswerSort = 'highScore' | 'created';

// Search hits come from Typesense, not the question database, and carry only the
// fields SearchService indexes - no author, no view count.
export type SearchResult = {
    id: string
    title: string
    content: string
    tags: string[]
    createdAt: number
    hasAcceptedAnswer: boolean
    answerCount: number
}

// Usage over a rolling seven days, from StatsService. Unrelated to Tag.usageCount,
// which is the all-time total and only ever grows.
export type TrendingTag = {
    tag: string
    count: number
}

// Reputation gained over a rolling week, from StatsService. It knows ids only.
export type TopUser = {
    userId: string
    gained: number
}

// A TopUser once the name has been resolved from ProfileService.
export type RankedUser = {
    gained: number
    profile: Profile
}

export type Tag = {
    id: string
    name: string
    slug: string
    description: string
    // Running total of questions carrying this tag. Trending tags are a different,
    // time-windowed figure and come from StatsService.
    usageCount: number
}
