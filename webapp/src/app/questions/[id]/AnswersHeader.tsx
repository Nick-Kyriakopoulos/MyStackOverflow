'use client'

import {Select, ListBox} from "@heroui/react";

type Props = {
    answerCount: number;
}

export default function AnswersHeader({answerCount}: Props) {
    return (
        <div className={'flex items-center justify-between pt-3 w-full px-6'}>
            <div className={'text-2xl'}>{answerCount} {answerCount === 1 ? 'Answer' : 'Answers'}</div>
            <div className={'flex items-center gap-3 justify-end w-[50%] ml-auto'}>
                <Select aria-label={'Select sorting'}>
                    <Select.Trigger>
                        <Select.Value>Highest score (default)</Select.Value>
                    </Select.Trigger>
                    <Select.Popover>
                        <ListBox>
                            <ListBox.Item id={'highScore'}>Highest score (default)</ListBox.Item>
                            <ListBox.Item id={'created'}>Date created</ListBox.Item>
                        </ListBox>
                    </Select.Popover>
                </Select>
            </div>
        </div>
    );
}