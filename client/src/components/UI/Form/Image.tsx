import { useId, useState, type ChangeEvent } from 'react';
import Compressor from 'compressorjs';
import Icon from '../Icon';
import classes from './Image.module.css';

const QUALITY = 0.6;

function toBase64(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error('Could not read the file'));
    reader.readAsDataURL(file);
  });
}

interface ImageProps {
  value: string;
  onDone: (base64: string) => void;
  label?: string;
}

export default function Image({ value, onDone, label = 'Drop a photo' }: ImageProps) {
  // useId keeps the label/input pair unique when two uploaders are mounted.
  const inputId = useId();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setError(null);
    setBusy(true);

    new Compressor(file, {
      quality: QUALITY,
      success: (compressed) => {
        toBase64(compressed)
          .then(onDone)
          .catch(() => setError('Could not read that image.'))
          .finally(() => setBusy(false));
      },
      error: () => {
        setError('Could not compress that image.');
        setBusy(false);
      },
    });
  };

  return (
    <div className={classes.wrap}>
      <label htmlFor={inputId} className={`${classes.drop} ${value ? classes.hasImage : ''}`}>
        {value ? (
          <>
            <img src={value} alt="Selected" className={classes.preview} />
            <span className={classes.swap}>
              <Icon name="image" size={14} />
              Replace
            </span>
          </>
        ) : (
          <span className={classes.empty}>
            <Icon name="image" size={22} />
            <span className={classes.emptyLabel}>{busy ? 'Processing…' : label}</span>
            <span className={classes.emptyHint}>JPG, PNG or GIF</span>
          </span>
        )}
      </label>

      <input
        id={inputId}
        type="file"
        name="image"
        accept="image/*"
        onChange={handleChange}
        className={classes.file}
      />

      {error && (
        <p role="alert" className={classes.error}>
          {error}
        </p>
      )}
    </div>
  );
}
