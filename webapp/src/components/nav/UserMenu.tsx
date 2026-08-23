'use client';

import {User} from "next-auth";
import {Avatar, Dropdown, Label} from "@heroui/react";
import {ArrowRightStartOnRectangleIcon, UserCircleIcon} from "@heroicons/react/24/outline";
import {useRouter} from "next/navigation";
import {logoutUser} from "@/lib/actions/auth-actions";

type Props = {
    user: User
}

export default function UserMenu({user}: Props) {
    const router = useRouter();
    const initials = user.name?.charAt(0).toUpperCase() ?? '?';

    return (
        <Dropdown>
            <Dropdown.Trigger
                className={'flex shrink-0 items-center gap-2 cursor-pointer rounded-full text-green-900 dark:text-purple-400 font-semibold text-md transition-colors duration-200 hover:text-green-700 dark:hover:text-purple-300'}
            >
                <Avatar size={'sm'} className={'shrink-0'}>
                    {user.image && <Avatar.Image alt={user.name ?? 'User avatar'} src={user.image}/>}
                    <Avatar.Fallback>{initials}</Avatar.Fallback>
                </Avatar>
                <span className={'whitespace-nowrap hover:underline hover:underline-offset-2'}>{user.name}</span>
            </Dropdown.Trigger>
            <Dropdown.Popover>
                <div className={'px-3 pt-3 pb-1'}>
                    <p className={'text-sm leading-5 font-medium'}>{user.name}</p>
                    {user.email && <p className={'text-xs leading-none text-muted'}>{user.email}</p>}
                </div>
                <Dropdown.Menu
                    onAction={(key) => {
                        if (key === 'profile' && user.id) {
                            router.push(`/profiles/${user.id}`);
                        }
                        if (key === 'logout') {
                            void logoutUser();
                        }
                    }}
                >
                    <Dropdown.Item id={'profile'} textValue={'Your profile'}>
                        <div className={'flex w-full items-center justify-between gap-2'}>
                            <Label>Your profile</Label>
                            <UserCircleIcon className={'size-4'}/>
                        </div>
                    </Dropdown.Item>
                    <Dropdown.Item id={'logout'} textValue={'Log out'} variant={'danger'}>
                        <div className={'flex w-full items-center justify-between gap-2'}>
                            <Label>Log out</Label>
                            <ArrowRightStartOnRectangleIcon className={'size-4 text-danger'}/>
                        </div>
                    </Dropdown.Item>
                </Dropdown.Menu>
            </Dropdown.Popover>
        </Dropdown>
    );
}