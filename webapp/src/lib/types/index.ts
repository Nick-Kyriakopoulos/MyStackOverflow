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
    questionId: string
}

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

export type Tag = {
    id: string
    name: string
    slug: string
    description: string
}
