import {Answer} from "@/lib/types";
import UserBadge from "@/components/profiles/UserBadge";

type Props = {
    answer: Answer;
}

export default function AnswerFooter({answer}: Props) {
    return (
        <div className={'mt-4 flex justify-end'}>
            <UserBadge
                profile={answer.author}
                action={'Answered'}
                timestamp={answer.createdAt}
            />
        </div>
    );
}
