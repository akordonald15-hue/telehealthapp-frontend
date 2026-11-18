// Icons exported from the Figma file (Iconoir set, 24×24, 1.5 stroke), coloured with currentColor.
// Size with className (e.g. "size-6"); colour with a text-* class.
import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function Svg({ children, ...props }: IconProps) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" {...props}>
      {children}
    </svg>
  );
}

export function ViewGridIcon(props: IconProps) {
  return <Svg {...props}><path d="M21 14.6V20.4C21 20.7314 20.7314 21 20.4 21H14.6C14.2686 21 14 20.7314 14 20.4V14.6C14 14.2686 14.2686 14 14.6 14H20.4C20.7314 14 21 14.2686 21 14.6Z" strokeWidth="1.5" stroke="currentColor"/> <path d="M10 14.6V20.4C10 20.7314 9.73137 21 9.4 21H3.6C3.26863 21 3 20.7314 3 20.4V14.6C3 14.2686 3.26863 14 3.6 14H9.4C9.73137 14 10 14.2686 10 14.6Z" strokeWidth="1.5" stroke="currentColor"/> <path d="M21 3.6V9.4C21 9.73137 20.7314 10 20.4 10H14.6C14.2686 10 14 9.73137 14 9.4V3.6C14 3.26863 14.2686 3 14.6 3H20.4C20.7314 3 21 3.26863 21 3.6Z" strokeWidth="1.5" stroke="currentColor"/> <path d="M10 3.6V9.4C10 9.73137 9.73137 10 9.4 10H3.6C3.26863 10 3 9.73137 3 9.4V3.6C3 3.26863 3.26863 3 3.6 3H9.4C9.73137 3 10 3.26863 10 3.6Z" strokeWidth="1.5" stroke="currentColor"/></Svg>;
}

export function HealthShieldIcon(props: IconProps) {
  return <Svg {...props}><path d="M10.3333 8H13.6667V10.3333H16V13.6667H13.6667V16H10.3333V13.6667H8V10.3333H10.3333V8Z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor"/> <path d="M5 18C4.58969 15.1278 3.50595 7.54165 3.13036 4.91253C3.05646 4.39524 3.39389 3.91247 3.90398 3.79912L11.5661 2.09641C11.8519 2.03291 12.1481 2.03291 12.4339 2.09641L20.096 3.79912C20.6061 3.91247 20.9435 4.39524 20.8696 4.91252C20.4941 7.54165 19.4103 15.1278 19 18C18.9293 18.495 18.5 21.5 12 21.5C5.5 21.5 5.07071 18.495 5 18Z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor"/></Svg>;
}

export function HealthcareIcon(props: IconProps) {
  return <Svg {...props}><path d="M18 20L21.8243 16.1757C21.9368 16.0632 22 15.9106 22 15.7515V10.5C22 9.67157 21.3284 9 20.5 9C19.6716 9 19 9.67157 19 10.5V15" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor"/> <path d="M18 16L18.8581 15.1419C18.949 15.051 19 14.9278 19 14.7994C19 14.6159 18.8963 14.4482 18.7322 14.3661L18.2893 14.1447C17.5194 13.7597 16.5894 13.9106 15.9807 14.5193L15.0858 15.4142C14.7107 15.7893 14.5 16.298 14.5 16.8284V20" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor"/> <path d="M6 20L2.17574 16.1757C2.06321 16.0632 2 15.9106 2 15.7515V10.5C2 9.67157 2.67157 9 3.5 9C4.32843 9 5 9.67157 5 10.5V15" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor"/> <path d="M6 16L5.14187 15.1419C5.05103 15.051 5 14.9278 5 14.7994C5 14.6159 5.10366 14.4482 5.26776 14.3661L5.71067 14.1447C6.48064 13.7597 7.41059 13.9106 8.01931 14.5193L8.91421 15.4142C9.28929 15.7893 9.5 16.298 9.5 16.8284V20" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor"/> <path d="M10.3333 4H13.6667V6.33333H16V9.66667H13.6667V12H10.3333V9.66667H8V6.33333H10.3333V4Z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor"/></Svg>;
}

export function NavArrowDownIcon(props: IconProps) {
  return <Svg {...props}><path d="M6 9L12 15L18 9" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor"/></Svg>;
}

export function MessageTextIcon(props: IconProps) {
  return <Svg {...props}><path d="M7 12L17 12" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor"/> <path d="M7 8L13 8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor"/> <path d="M6.39951 17.7506L4.06852 20.6643C3.71421 21.1072 3 20.8567 3 20.2895V5C3 3.89543 3.89543 3 5 3H19C20.1046 3 21 3.89543 21 5V15C21 16.1046 20.1046 17 19 17H7.96125C7.35368 17 6.77906 17.2762 6.39951 17.7506Z" strokeWidth="1.5" stroke="currentColor"/></Svg>;
}

export function GiftIcon(props: IconProps) {
  return <Svg {...props}><path d="M20 12V21.4C20 21.7314 19.7314 22 19.4 22H4.6C4.26863 22 4 21.7314 4 21.4V12" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor"/> <path d="M2.6 12H21.4C21.7314 12 22 11.7314 22 11.4V7.6C22 7.26863 21.7314 7 21.4 7H2.6C2.26863 7 2 7.26863 2 7.6V11.4C2 11.7314 2.26863 12 2.6 12Z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor"/> <path d="M12 22V7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor"/> <path d="M12 7H7.5C6.83696 7 6.20107 6.73661 5.73223 6.26777C5.26339 5.79893 5 5.16304 5 4.5C5 3.83696 5.26339 3.20107 5.73223 2.73223C6.20107 2.26339 6.83696 2 7.5 2C11 2 12 7 12 7Z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor"/> <path d="M12 7H16.5C17.163 7 17.7989 6.73661 18.2678 6.26777C18.7366 5.79893 19 5.16304 19 4.5C19 3.83696 18.7366 3.20107 18.2678 2.73223C17.7989 2.26339 17.163 2 16.5 2C13 2 12 7 12 7Z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor"/></Svg>;
}

export function HelpCircleIcon(props: IconProps) {
  return <Svg {...props}><path d="M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor"/> <path d="M9 9C9 5.49997 14.5 5.5 14.5 9C14.5 11.5 12 10.9999 12 13.9999" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor"/> <path d="M12 18.01L12.01 17.9989" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor"/></Svg>;
}

export function SettingsIcon(props: IconProps) {
  return <Svg {...props}><path d="M15 12C15 13.6569 13.6569 15 12 15C10.3431 15 9 13.6569 9 12C9 10.3431 10.3431 9 12 9C13.6569 9 15 10.3431 15 12Z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor"/> <path d="M19.6224 10.3954L18.5247 7.7448L20 6L18 4L16.2647 5.48295L13.5578 4.36974L12.9353 2H10.981L10.3491 4.40113L7.70441 5.51596L6 4L4 6L5.45337 7.78885L4.3725 10.4463L2 11V13L4.40111 13.6555L5.51575 16.2997L4 18L6 20L7.79116 18.5403L10.397 19.6123L11 22H13L13.6045 19.6132L16.2551 18.5155C16.6969 18.8313 18 20 18 20L20 18L18.5159 16.2494L19.6139 13.598L21.9999 12.9772L22 11L19.6224 10.3954Z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor"/></Svg>;
}

export function VerifiedUserIcon(props: IconProps) {
  return <Svg {...props}><path d="M2 20V19C2 15.134 5.13401 12 9 12" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor"/> <path d="M14.532 12.8403V12.8403C13.5799 12.7958 12.7958 13.5799 12.8403 14.532V14.532C12.8628 15.0132 12.6697 15.4794 12.3135 15.8038V15.8038C11.6088 16.4456 11.6088 17.5544 12.3135 18.1962V18.1962C12.6697 18.5206 12.8628 18.9868 12.8403 19.468V19.468C12.7958 20.4201 13.5799 21.2042 14.532 21.1597V21.1597C15.0132 21.1372 15.4794 21.3303 15.8038 21.6865V21.6865C16.4456 22.3912 17.5544 22.3912 18.1962 21.6865V21.6865C18.5206 21.3303 18.9868 21.1372 19.468 21.1597V21.1597C20.4201 21.2042 21.2042 20.4201 21.1597 19.468V19.468C21.1372 18.9868 21.3303 18.5206 21.6865 18.1962V18.1962C22.3912 17.5544 22.3912 16.4456 21.6865 15.8038V15.8038C21.3303 15.4794 21.1372 15.0132 21.1597 14.532V14.532C21.2042 13.5799 20.4201 12.7958 19.468 12.8403V12.8403C18.9868 12.8628 18.5206 12.6697 18.1962 12.3135V12.3135C17.5544 11.6088 16.4456 11.6088 15.8038 12.3135V12.3135C15.4794 12.6697 15.0132 12.8628 14.532 12.8403Z" strokeWidth="1.5" stroke="currentColor"/> <path d="M15.3633 17L16.4542 18.0909L18.636 15.9091" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor"/> <path d="M13 8C13 10.2091 11.2091 12 9 12C6.79086 12 5 10.2091 5 8C5 5.79086 6.79086 4 9 4C11.2091 4 13 5.79086 13 8Z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor"/></Svg>;
}

export function ArrowRightIcon(props: IconProps) {
  return <Svg {...props}><path d="M6 12H18.5M12.5 18L18.5 12L12.5 6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor"/></Svg>;
}

export function StarIcon(props: IconProps) {
  return <Svg {...props}><path d="M8.58737 8.23597L11.1849 3.00376C11.5183 2.33208 12.4817 2.33208 12.8151 3.00376L15.4126 8.23597L21.2215 9.08017C21.9668 9.18848 22.2638 10.0994 21.7243 10.6219L17.5217 14.6918L18.5135 20.4414C18.6409 21.1798 17.8614 21.7428 17.1945 21.3941L12 18.678L6.80547 21.3941C6.1386 21.7428 5.35909 21.1798 5.48645 20.4414L6.47825 14.6918L2.27575 10.6219C1.73617 10.0994 2.03322 9.18848 2.77852 9.08017L8.58737 8.23597Z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor"/></Svg>;
}

export function BellNotificationIcon(props: IconProps) {
  return <Svg {...props}><path d="M18.1336 11C18.7155 16.3755 21 18 21 18H3C3 18 6 15.8667 6 8.4C6 6.70261 6.63214 5.07475 7.75736 3.87452C8.88258 2.67428 10.4087 2 12 2C12.3373 2 12.6717 2.0303 13 2.08949" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor"/> <path d="M22 5C22 6.65685 20.6569 8 19 8C17.3431 8 16 6.65685 16 5C16 3.34315 17.3431 2 19 2C20.6569 2 22 3.34315 22 5Z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor"/> <path d="M13.7295 21C13.5537 21.3031 13.3014 21.5547 12.9978 21.7295C12.6941 21.9044 12.3499 21.9965 11.9995 21.9965C11.6492 21.9965 11.3049 21.9044 11.0013 21.7295C10.6977 21.5547 10.4453 21.3031 10.2695 21" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor"/></Svg>;
}

export function GoogleDocsIcon(props: IconProps) {
  return <Svg {...props}><path d="M5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3L5 3C3.89543 3 3 3.89543 3 5L3 19C3 20.1046 3.89543 21 5 21Z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor"/> <path d="M7 7L17 7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor"/> <path d="M7 12L17 12" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor"/> <path d="M7 17L13 17" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor"/></Svg>;
}

export function CalendarIcon(props: IconProps) {
  return <Svg {...props}><path d="M15 4V2M15 4V6M15 4H10.5M3 10V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V10H3Z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor"/> <path d="M3 10V6C3 4.89543 3.89543 4 5 4H7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor"/> <path d="M7 2V6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor"/> <path d="M21 10V6C21 4.89543 20.1046 4 19 4H18.5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor"/></Svg>;
}

export function TwitterVerifiedBadgeIcon(props: IconProps) {
  return <Svg {...props}><path d="M7.92905 4.39508L6.41554 4.32435C5.23857 4.26934 4.26934 5.23857 4.32435 6.41553L4.39508 7.92905C4.42288 8.52388 4.18418 9.10016 3.74391 9.50111L2.62368 10.5213C1.75255 11.3147 1.75255 12.6853 2.62368 13.4787L3.74391 14.4989C4.18418 14.8998 4.42288 15.4761 4.39508 16.071L4.32435 17.5845C4.26934 18.7614 5.23857 19.7307 6.41553 19.6757L7.92905 19.6049C8.52388 19.5771 9.10016 19.8158 9.50111 20.2561L10.5213 21.3763C11.3147 22.2475 12.6853 22.2475 13.4787 21.3763L14.4989 20.2561C14.8998 19.8158 15.4761 19.5771 16.071 19.6049L17.5845 19.6757C18.7614 19.7307 19.7307 18.7614 19.6757 17.5845L19.6049 16.071C19.5771 15.4761 19.8158 14.8998 20.2561 14.4989L21.3763 13.4787C22.2475 12.6853 22.2475 11.3147 21.3763 10.5213L20.2561 9.50111C19.8158 9.10016 19.5771 8.52388 19.6049 7.92905L19.6757 6.41554C19.7307 5.23857 18.7614 4.26934 17.5845 4.32435L16.071 4.39508C15.4761 4.42288 14.8998 4.18418 14.4989 3.74391L13.4787 2.62368C12.6853 1.75255 11.3147 1.75255 10.5213 2.62368L9.50111 3.74391C9.10016 4.18418 8.52388 4.42288 7.92905 4.39508Z" strokeWidth="1.5" stroke="currentColor"/> <path d="M9 12L11 14L15 10" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor"/></Svg>;
}

export function VideoCameraIcon(props: IconProps) {
  return <Svg {...props}><path d="M15 12V16.4C15 16.7314 14.7314 17 14.4 17H3.6C3.26863 17 3 16.7314 3 16.4V7.6C3 7.26863 3.26863 7 3.6 7H14.4C14.7314 7 15 7.26863 15 7.6V12ZM15 12L20.0159 7.82009C20.4067 7.49443 21 7.77232 21 8.28103V15.719C21 16.2277 20.4067 16.5056 20.0159 16.1799L15 12Z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" stroke="white"/></Svg>;
}

export function ClockIcon(props: IconProps) {
  return <Svg {...props}><path d="M9 4.5L9 9L13.5 9" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor"/> <path d="M16.5 9C16.5 13.1421 13.1421 16.5 9 16.5C4.85786 16.5 1.5 13.1421 1.5 9C1.5 4.85786 4.85786 1.5 9 1.5C13.1421 1.5 16.5 4.85786 16.5 9Z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor"/></Svg>;
}

export function ArrowLeftIcon({ className, ...props }: IconProps) {
  return <ArrowRightIcon className={`-scale-x-100 ${className ?? ""}`} {...props} />;
}
