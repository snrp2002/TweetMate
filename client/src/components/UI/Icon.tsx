import type { ReactElement, SVGProps } from 'react';

export type IconName =
  | 'home'
  | 'compose'
  | 'logout'
  | 'user'
  | 'edit'
  | 'grid'
  | 'clock'
  | 'heart'
  | 'comment'
  | 'share'
  | 'more'
  | 'image'
  | 'close'
  | 'crosshair';

const PATHS: Record<IconName, ReactElement> = {
  home: (
    <>
      <path d="M3.5 11.2 12 3.5l8.5 7.7" />
      <path d="M5.8 10v10.5h12.4V10" />
      <path d="M10 20.5v-5.2h4v5.2" />
    </>
  ),
  compose: (
    <>
      <path d="M12 5.2v13.6M5.2 12h13.6" />
    </>
  ),
  logout: (
    <>
      <path d="M9.5 4.5H5.2v15h4.3" />
      <path d="M15.5 8.2 19.3 12l-3.8 3.8" />
      <path d="M19.3 12H9.8" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8.4" r="3.9" />
      <path d="M4.4 20.6c.5-3.9 3.8-5.9 7.6-5.9s7.1 2 7.6 5.9" />
    </>
  ),
  edit: (
    <>
      <path d="M4.2 19.8h4.2L20 8.2 15.8 4 4.2 15.6v4.2Z" />
      <path d="M14.2 5.6 18.4 9.8" />
    </>
  ),
  grid: (
    <>
      <path d="M4.2 4.2h6v6h-6zM13.8 4.2h6v6h-6zM4.2 13.8h6v6h-6zM13.8 13.8h6v6h-6z" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.2" />
      <path d="M12 7.3V12l3.2 2.1" />
    </>
  ),
  heart: (
    <>
      <path d="M12 20.4C9.6 18.9 3.4 14.9 3.4 10.3A4.9 4.9 0 0 1 12 7.1a4.9 4.9 0 0 1 8.6 3.2c0 4.6-6.2 8.6-8.6 10.1Z" />
    </>
  ),
  comment: (
    <>
      <path d="M4.2 4.8h15.6v11.1H9.6l-5.4 4.1V4.8Z" />
    </>
  ),
  share: (
    <>
      <path d="M12 15.2V3.4" />
      <path d="M7.8 7.6 12 3.4l4.2 4.2" />
      <path d="M4.6 13.2v7.4h14.8v-7.4" />
    </>
  ),
  more: (
    <>
      <circle cx="5.4" cy="12" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="18.6" cy="12" r="1.5" fill="currentColor" stroke="none" />
    </>
  ),
  image: (
    <>
      <path d="M3.4 5.2h17.2v13.6H3.4z" />
      <path d="m3.4 15.4 4.8-4.6 3.7 3.6 3.1-3 5.6 5.4" />
      <circle cx="15.6" cy="9.1" r="1.6" />
    </>
  ),
  close: (
    <>
      <path d="M5.6 5.6l12.8 12.8M18.4 5.6 5.6 18.4" />
    </>
  ),
  crosshair: (
    <>
      <circle cx="12" cy="12" r="6.4" />
      <path d="M12 1.6v20.8M1.6 12h20.8" />
    </>
  ),
};

interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  name: IconName;
  size?: number;
  /** Fills the heart, for the "liked" state. */
  filled?: boolean;
}

export default function Icon({ name, size = 20, filled = false, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="square"
      strokeLinejoin="miter"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {PATHS[name]}
    </svg>
  );
}

/** The Google mark, kept in brand colours so it stays recognisable. */
export function GoogleMark({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <path
        fill="#4285F4"
        d="M45.1 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h11.8c-.5 2.7-2 5-4.4 6.6v5.5h7.1c4.2-3.8 6.6-9.5 6.6-16.1Z"
      />
      <path
        fill="#34A853"
        d="M24 46c6 0 11-2 14.6-5.4l-7.1-5.5c-2 1.3-4.5 2.1-7.5 2.1-5.8 0-10.6-3.9-12.4-9.1H4.3v5.7C7.9 41.1 15.4 46 24 46Z"
      />
      <path fill="#FBBC05" d="M11.6 28.1c-.5-1.3-.7-2.7-.7-4.1s.3-2.8.7-4.1v-5.7H4.3A22 22 0 0 0 2 24c0 3.6.9 6.9 2.3 9.8l7.3-5.7Z" />
      <path
        fill="#EA4335"
        d="M24 9.5c3.3 0 6.2 1.1 8.5 3.3l6.3-6.3C35 2.9 30 1 24 1 15.4 1 7.9 5.9 4.3 13.1l7.3 5.7c1.8-5.2 6.6-9.3 12.4-9.3Z"
      />
    </svg>
  );
}
