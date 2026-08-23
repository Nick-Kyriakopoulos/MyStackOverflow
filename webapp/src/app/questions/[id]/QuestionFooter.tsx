import {Question} from "@/lib/types";
import UserBadge from "@/components/profiles/UserBadge";
import TagLink from "@/components/tags/TagLink";

type Props = {
    question: Question;
}

export default function QuestionFooter({ question }: Props) {
    return (
        <div className={'mt-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between'}>
            <div className={'flex flex-wrap gap-2'}>
                {question.tagSlugs.map(tag => (
                    <TagLink key={tag} slug={tag}/>
                ))}
            </div>

            <div className={'self-end'}>
                <UserBadge
                    profile={question.author}
                    action={'Asked'}
                    timestamp={question.createdAt}
                />
            </div>
        </div>
    );
}
