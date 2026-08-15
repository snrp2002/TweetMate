import classes from './Avatar.module.css';
import Icon from './Icon';
import { avatarImage } from '../../lib/cloudinary';

interface AvatarProps {
  src?: string | undefined;
  name?: string | undefined;
  size?: number;
  onClick?: (() => void) | undefined;
  /** Renders the vermilion keyline used for the signed-in user. */
  accent?: boolean;
}

/**
 * A photograph if we have one, a letterpress initial if we know the name,
 * otherwise a plain glyph. Replaces the old stock silhouette PNG, which was
 * white-on-white against paper.
 */
export default function Avatar({ src, name, size = 40, onClick, accent = false }: AvatarProps) {
  const initial = name?.trim().charAt(0).toUpperCase();
  const interactive = typeof onClick === 'function';

  const className = [
    classes.avatar,
    accent ? classes.accent : '',
    interactive ? classes.clickable : '',
  ]
    .filter(Boolean)
    .join(' ');

  const style = { '--avatar-size': `${size}px` } as React.CSSProperties;

  let content;
  if (src) {
    // Not lazy: avatars are tiny and usually above the fold, so deferring them
    // only delays first paint.
    content = <img src={avatarImage(src, size)} alt={name ?? ''} />;
  } else if (initial) {
    content = (
      <span className={classes.initial} aria-hidden="true">
        {initial}
      </span>
    );
  } else {
    content = (
      <span className={classes.glyph} aria-hidden="true">
        <Icon name="user" size={Math.round(size * 0.52)} />
      </span>
    );
  }

  if (!interactive) {
    return (
      <span className={className} style={style}>
        {content}
      </span>
    );
  }

  return (
    <button type="button" className={className} style={style} onClick={onClick} aria-label={name ?? 'Profile'}>
      {content}
    </button>
  );
}
