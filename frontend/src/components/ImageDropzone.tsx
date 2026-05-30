import { useState, type CSSProperties, type DragEvent } from 'react';

/**
 * Drag-and-drop image upload with a URL fallback input.
 *
 * Posts to `/api/uploads/image/?folder=<folder>` and surfaces the
 * server's returned URL via `onChange`. Used wherever the control
 * panel asks the operator for a media URL (event branding, charity
 * logos / banners / impact-tier illustrations, etc.). Empty `value`
 * shows the drop hint; non-empty renders a preview with a "remove"
 * affordance.
 */
export function ImageDropzone({
  value,
  onChange,
  previewStyle,
  folder = 'misc',
}: {
  value: string;
  onChange: (url: string) => void;
  previewStyle: CSSProperties;
  /** Subfolder under /uploads/ to organise files server-side
   *  (events, charities, charity-impact, etc.). Defaults to `misc`
   *  when the caller doesn't care. */
  folder?: string;
}) {
  const inputId = `dz-${Math.random().toString(36).slice(2, 8)}`;
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const uploadFile = async (file: File) => {
    setErr(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(
        `${import.meta.env.VITE_API_URL ?? ''}/api/uploads/image/?folder=${encodeURIComponent(folder)}`,
        { method: 'POST', body: fd },
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || `Upload failed (${res.status})`);
      }
      const data = (await res.json()) as { url: string };
      onChange(data.url);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) void uploadFile(file);
  };

  return (
    <div>
      <label
        htmlFor={inputId}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        style={{
          display: 'block',
          cursor: 'pointer',
          padding: '14px 16px',
          border: dragging
            ? '2px dashed #e71347'
            : '2px dashed rgba(255,255,255,0.2)',
          background: dragging
            ? 'rgba(231,19,71,0.12)'
            : 'rgba(0,0,0,0.25)',
          borderRadius: 8,
          textAlign: 'center',
          transition: 'border-color 0.12s, background 0.12s',
        }}
      >
        {uploading ? (
          <div className="small text-white-50">Uploading…</div>
        ) : value ? (
          <div className="d-flex align-items-center gap-3 justify-content-center flex-wrap">
            <img src={value} alt="" style={{ ...previewStyle, objectFit: 'cover' }} />
            <div className="small text-white-50">
              <div>Drop a new file to replace, or</div>
              <div>
                <button
                  type="button"
                  className="btn btn-link btn-sm p-0 text-warning"
                  onClick={(ev) => {
                    ev.preventDefault();
                    onChange('');
                  }}
                >
                  remove image
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="small text-white-50">
            Drag &amp; drop an image here, or click to browse
            <div style={{ opacity: 0.6 }}>PNG · JPG · GIF · WebP · SVG · max 10 MB</div>
          </div>
        )}
      </label>
      <input
        id={inputId}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void uploadFile(f);
          e.target.value = '';
        }}
      />
      <div className="mt-2">
        <input
          // `type="text"`, NOT `type="url"`: media paths are stored as
          // CharFields so they accept site-relative paths (/assets/foo.svg)
          // as well as absolute URLs. The browser's url validation rejects
          // anything without an http(s):// scheme, which blocked /assets paths.
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="form-control form-control-sm"
          placeholder="…or paste a URL or /assets path"
        />
      </div>
      {err && <div className="text-danger small mt-1">{err}</div>}
    </div>
  );
}
