import { useId, useState, type ChangeEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import Icon from '../Icon';
import classes from './Image.module.css';
import { compressImage, toBase64 } from '../../../lib/image';
import { fetchUploadConfig, uploadImage } from '../../../api/uploads';
import { toErrorMessage } from '../../../api/client';

interface ImageProps {
  value: string;
  onDone: (value: string) => void;
  label?: string;
}

export default function Image({ value, onDone, label = 'Drop a photo' }: ImageProps) {
  // useId keeps the label/input pair unique when two uploaders are mounted.
  const inputId = useId();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Cached across mounts; decides upload-to-R2 vs inline base64 fallback.
  const { data: config } = useQuery({
    queryKey: ['uploadConfig'],
    queryFn: fetchUploadConfig,
    staleTime: Infinity,
    retry: 1,
  });

  const handleChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setBusy(true);

    try {
      const { blob } = await compressImage(file);

      if (config?.enabled) {
        if (blob.size > config.maxBytes) {
          throw new Error('That image is too large.');
        }
        onDone(await uploadImage(blob));
      } else {
        // R2 not configured — keep the original inline behaviour.
        onDone(await toBase64(blob));
      }
    } catch (uploadError) {
      setError(toErrorMessage(uploadError, 'Could not use that image.'));
    } finally {
      setBusy(false);
      // Allow re-selecting the same file after an error.
      event.target.value = '';
    }
  };

  return (
    <div className={classes.wrap}>
      <label htmlFor={inputId} className={`${classes.drop} ${value ? classes.hasImage : ''}`}>
        {value ? (
          <>
            <img src={value} alt="Selected" className={classes.preview} />
            <span className={classes.swap}>
              <Icon name="image" size={14} />
              {busy ? 'Uploading…' : 'Replace'}
            </span>
          </>
        ) : (
          <span className={classes.empty}>
            <Icon name="image" size={22} />
            <span className={classes.emptyLabel}>{busy ? 'Uploading…' : label}</span>
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
        disabled={busy}
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
