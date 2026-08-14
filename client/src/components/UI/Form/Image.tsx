import { useId, useState, type ChangeEvent } from 'react';
import Compressor from 'compressorjs';
import addImage from '../../../images/add-image.png';
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

export default function Image({ value, onDone, label = 'Add Image*' }: ImageProps) {
  // `useId` keeps the label/input pair unique even when two uploaders
  // are mounted at once (the old component hardcoded id="file").
  const inputId = useId();
  const [error, setError] = useState<string | null>(null);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setError(null);

    new Compressor(file, {
      quality: QUALITY,
      success: (compressed) => {
        toBase64(compressed)
          .then(onDone)
          .catch(() => setError('Could not read that image.'));
      },
      error: () => setError('Could not compress that image.'),
    });
  };

  return (
    <>
      <div className={classes.inputDiv}>
        <label htmlFor={inputId}>
          <img src={addImage} alt="" />
          <div>{label}</div>
        </label>
        <input id={inputId} type="file" name="image" accept="image/*" onChange={handleChange} />
      </div>
      {error && <p role="alert">{error}</p>}
      <div className={classes.preview}>{value && <img src={value} alt="Selected preview" />}</div>
    </>
  );
}
