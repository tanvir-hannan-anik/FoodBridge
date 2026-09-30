import type { ComponentProps } from "react";

type IconProps = ComponentProps<"svg">;

function Icon({ children, ...props }: IconProps) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {children}
    </svg>
  );
}

export const BasketIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 10h16l-1.6 8.2a2 2 0 0 1-2 1.8H7.6a2 2 0 0 1-2-1.8Z" />
    <path d="m8 10 3-6M16 10l-3-6M9 14v2M12 14v2M15 14v2" />
  </Icon>
);

export const HandshakeIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="m11 17 2 2a1.4 1.4 0 0 0 2-2" />
    <path d="m14 14 2.5 2.5a1.4 1.4 0 0 0 2-2l-3.9-3.9a3 3 0 0 0-4.2 0l-.9.9a1.4 1.4 0 0 1-2-2l2.8-2.8a5 5 0 0 1 6 -.8l.5.3a3 3 0 0 0 2 .4H21" />
    <path d="M21 4v10h-2M3 4v10h2l4.5 4.5a1.4 1.4 0 0 0 2-2M3 5h7" />
  </Icon>
);

export const BikeIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="5.5" cy="17" r="3" />
    <circle cx="18.5" cy="17" r="3" />
    <path d="M12 17V13l-3-3 4-3 2 3h3M15 5a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" />
  </Icon>
);

export const HomeHeartIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Z" />
    <path d="M12 17.5c-2.4-1.7-3.5-2.8-3.5-4a1.7 1.7 0 0 1 3.5-.7 1.7 1.7 0 0 1 3.5.7c0 1.2-1.1 2.3-3.5 4Z" />
  </Icon>
);

export const PlateIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="8" />
    <circle cx="12" cy="12" r="4.5" />
    <path d="M2 5v5a1.5 1.5 0 0 0 3 0V5M3.5 10v9M22 5c-1.7 0-2.5 2-2.5 5h2.5v9" />
  </Icon>
);

export const ArrowIcon = (p: IconProps) => (
  <Icon strokeWidth="2" {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Icon>
);

export const CheckIcon = (p: IconProps) => (
  <Icon strokeWidth="2.4" {...p}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </Icon>
);
