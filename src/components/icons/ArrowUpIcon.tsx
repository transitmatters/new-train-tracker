import { SVGProps } from 'react';

export const ArrowUpIcon = (props: SVGProps<SVGSVGElement>) => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            width="10px"
            height="10px"
            fill="grey"
            {...props}
        >
            <path fill="grey" d="M6 17.59L7.41 19L12 14.42L16.59 19L18 17.59l-6-6z"></path>
            <path fill="grey" d="m6 11l1.41 1.41L12 7.83l4.59 4.58L18 11l-6-6z"></path>
        </svg>
    );
};
