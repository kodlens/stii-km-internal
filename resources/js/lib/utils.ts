import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import dayjs from "dayjs";


export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}



export const dateFormat = (item: string): string => {
    return dayjs(item).format("MMM-DD-YYYY");
};
