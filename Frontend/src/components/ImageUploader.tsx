import { useState, useRef } from 'react';
import { imageAPI } from '../lib/api';

const CATEGORIES = [
  { key: 'bedroom',  label: 'Bedroom',  required: true  },
  { key: 'washroom', label: 'Washroom', required: true  },
  { key: 'hallway',  label: 'Hallway',  required: false },
  { key: 'outside',  label: 'Outside',  required: false },
];

const MIN = 2;
const MAX = 4;

type FileEntry = { file: File; preview: string };
type CategoryImages = { [key: string]: FileEntry[] };

export default function ImageUploadStep({
  pgId,
  onComplete,
}: {
  pgId: number;
  onComplete: () => void;
}) {
  const [images, setImages]   = useState<CategoryImages>({
    bedroom: [], washroom: [], hallway: [], outside: [],
  });
  const [uploading, setUploading] = useState<string | null>(null); // which category is uploading
  const [errors, setErrors]       = useState<{ [key: string]: string }>({});
  const [uploaded, setUploaded]   = useState<{ [key: string]: boolean }>({});
  const inputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const handleFileSelect = (category: string, files: FileList | null) => {
    if (!files) return;
    const selected = Array.from(files);
    const current  = images[category];
    const newTotal = current.length + selected.length;

    if (newTotal > MAX) {
      setErrors(e => ({ ...e, [category]: `Max ${MAX} images allowed for ${category}` }));
      return;
    }

    const newEntries: FileEntry[] = selected.map(file => ({
      file,
      preview: URL.createObjectURL(file),
    }));

    setImages(prev => ({ ...prev, [category]: [...prev[category], ...newEntries] }));
    setErrors(e => ({ ...e, [category]: '' }));

    // reset input so same file can be re-selected if removed
    if (inputRefs.current[category]) inputRefs.current[category]!.value = '';
  };

  const removeImage = (category: string, index: number) => {
    setImages(prev => {
      const updated = [...prev[category]];
      URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);
      return { ...prev, [category]: updated };
    });
  };

  const uploadCategory = async (category: string) => {
    const files = images[category];

    if (files.length < MIN) {
      setErrors(e => ({ ...e, [category]: `Upload at least ${MIN} images` }));
      return;
    }

    try {
      setUploading(category);
      setErrors(e => ({ ...e, [category]: '' }));

      await imageAPI.uploadCategory(pgId, category, files.map(f => f.file));

      setUploaded(u => ({ ...u, [category]: true }));
    } catch (err: any) {
      setErrors(e => ({ ...e, [category]: err.message || 'Upload failed. Try again.' }));
    } finally {
      setUploading(null);
    }
  };

  const requiredDone = ['bedroom', 'washroom'].every(c => uploaded[c]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Header */}
      <div>
        <h2 style={{ color: 'var(--color-text-primary)', margin: '0 0 4px' }}>
          Upload PG Images
        </h2>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, margin: 0 }}>
          Bedroom &amp; Washroom are required (min 2, max 4 each). Hallway &amp; Outside are optional.
        </p>
      </div>

      {CATEGORIES.map(({ key, label, required }) => {
        const count       = images[key].length;
        const isDone      = uploaded[key];
        const isUploading = uploading === key;
        const canSave     = count >= MIN && !isDone && !isUploading;
        const isFull      = count >= MAX;

        return (
          <div
            key={key}
            style={{
              border: `1px solid ${isDone ? '#4caf50' : 'var(--color-border-secondary)'}`,
              borderRadius: 12,
              padding: '20px',
              background: 'var(--color-background-secondary)',
              opacity: uploading && uploading !== key ? 0.6 : 1,
              transition: 'opacity 0.2s',
            }}
          >
            {/* Section header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontWeight: 500, fontSize: 15, color: 'var(--color-text-primary)' }}>
                  {label}
                </span>
                {required
                  ? <span style={{ fontSize: 11, color: '#e07b39', background: 'rgba(224,123,57,0.15)', padding: '2px 8px', borderRadius: 20 }}>Required</span>
                  : <span style={{ fontSize: 11, color: 'var(--color-text-tertiary)', background: 'var(--color-background-tertiary)', padding: '2px 8px', borderRadius: 20 }}>Optional</span>
                }
                {isDone && (
                  <span style={{ fontSize: 12, color: '#4caf50' }}>✓ Saved</span>
                )}
              </div>
              <span style={{ fontSize: 13, color: 'var(--color-text-tertiary)' }}>
                {count}/{MAX}
              </span>
            </div>

            {/* Image previews */}
            {count > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 12 }}>
                {images[key].map((img, idx) => (
                  <div
                    key={idx}
                    style={{ position: 'relative', aspectRatio: '1', borderRadius: 8, overflow: 'hidden' }}
                  >
                    <img
                      src={img.preview}
                      alt={`${label} ${idx + 1}`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    {!isDone && (
                      <button
                        onClick={() => removeImage(key, idx)}
                        style={{
                          position: 'absolute', top: 4, right: 4,
                          background: 'rgba(0,0,0,0.65)', color: '#fff',
                          border: 'none', borderRadius: '50%',
                          width: 22, height: 22, cursor: 'pointer',
                          fontSize: 11, lineHeight: '22px', padding: 0,
                        }}
                      >✕</button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Drop zone — hidden when done or full */}
            {!isDone && !isFull && (
              <div
                onClick={() => inputRefs.current[key]?.click()}
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); handleFileSelect(key, e.dataTransfer.files); }}
                style={{
                  border: '1.5px dashed var(--color-border-secondary)',
                  borderRadius: 8, padding: '18px',
                  textAlign: 'center', cursor: 'pointer',
                  color: 'var(--color-text-tertiary)', fontSize: 13,
                  marginBottom: 12,
                }}
              >
                Drag &amp; drop or{' '}
                <span style={{ color: '#e07b39' }}>click to browse</span>
                <div style={{ fontSize: 12, marginTop: 4 }}>
                  JPG, PNG, WEBP · Max 5MB · {MAX - count} more allowed
                </div>
              </div>
            )}

            {/* Hidden file input */}
            <input
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp"
              ref={el => { inputRefs.current[key] = el; }}
              style={{ display: 'none' }}
              onChange={e => handleFileSelect(key, e.target.files)}
            />

            {/* Error message */}
            {errors[key] && (
              <p style={{ color: '#e05252', fontSize: 13, margin: '0 0 10px' }}>
                {errors[key]}
              </p>
            )}

            {/* Save button */}
            {!isDone && (
              <button
                onClick={() => uploadCategory(key)}
                disabled={!canSave}
                style={{
                  width: '100%', padding: '10px',
                  background: canSave ? '#e07b39' : 'var(--color-background-tertiary)',
                  color: canSave ? '#fff' : 'var(--color-text-tertiary)',
                  border: 'none', borderRadius: 8,
                  cursor: canSave ? 'pointer' : 'not-allowed',
                  fontWeight: 500, fontSize: 14, transition: 'background 0.2s',
                }}
              >
                {isUploading
                  ? 'Uploading...'
                  : count < MIN
                    ? `Add ${MIN - count} more image${MIN - count > 1 ? 's' : ''} to save`
                    : `Save ${label} images`}
              </button>
            )}
          </div>
        );
      })}

      {/* Continue button */}
      <button
        onClick={onComplete}
        disabled={!requiredDone}
        style={{
          padding: '14px',
          background: requiredDone ? '#e07b39' : 'var(--color-background-tertiary)',
          color: requiredDone ? '#fff' : 'var(--color-text-tertiary)',
          border: 'none', borderRadius: 10,
          cursor: requiredDone ? 'pointer' : 'not-allowed',
          fontWeight: 500, fontSize: 15, transition: 'background 0.2s',
        }}
      >
        {requiredDone ? 'Continue →' : 'Upload Bedroom & Washroom to continue'}
      </button>
    </div>
  );
}