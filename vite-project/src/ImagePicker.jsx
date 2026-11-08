import { useEffect, useMemo, useRef, useState } from "react";
import { ImagePlus, Star, X } from "lucide-react";
import { ACCEPTED_TYPES, shrinkImage } from "./lib/shrinkImage";

// Choose up to `max` pictures. The first one is the main picture shown in listings.
export default function ImagePicker({ files, onChange, max = 5, existing = [] }) {
  const inputRef = useRef(null);
  const [error, setError] = useState("");
  const [working, setWorking] = useState(false);

  const previews = useMemo(() => files.map((file) => URL.createObjectURL(file)), [files]);
  useEffect(() => () => previews.forEach((url) => URL.revokeObjectURL(url)), [previews]);

  async function addFiles(event) {
    const chosen = [...event.target.files];
    event.target.value = ""; // allow choosing the same file again
    if (chosen.length === 0) return;
    setError("");

    if (files.length + chosen.length > max) {
      setError(`You can add up to ${max} pictures.`);
      return;
    }
    setWorking(true);
    try {
      const shrunk = await Promise.all(chosen.map(shrinkImage));
      onChange([...files, ...shrunk]);
    } catch (err) {
      setError(err.message);
    } finally {
      setWorking(false);
    }
  }

  const makeMain = (index) => onChange([files[index], ...files.filter((_, i) => i !== index)]);
  const remove = (index) => onChange(files.filter((_, i) => i !== index));

  return (
    <div className="picker">
      {files.length === 0 && existing.length > 0 && (
        <div className="picker-existing">
          <p>Current pictures (choose new ones below to replace them):</p>
          <ul>
            {existing.map((url) => (
              <li key={url}><img src={url} alt="" /></li>
            ))}
          </ul>
        </div>
      )}

      <ul className="picker-grid" aria-label="Chosen pictures">
        {previews.map((url, index) => (
          <li key={url} className={index === 0 ? "main" : ""}>
            <img src={url} alt={`Picture ${index + 1}`} />
            {index === 0 ? (
              <span className="picker-main-tag">Main</span>
            ) : (
              <button type="button" className="picker-star" onClick={() => makeMain(index)} aria-label={`Make picture ${index + 1} the main picture`}>
                <Star size={14} />
              </button>
            )}
            <button type="button" className="picker-remove" onClick={() => remove(index)} aria-label={`Remove picture ${index + 1}`}>
              <X size={14} />
            </button>
          </li>
        ))}

        {files.length < max && (
          <li>
            <button type="button" className="picker-add" onClick={() => inputRef.current?.click()} disabled={working}>
              <ImagePlus size={24} />
              <span>{working ? "Preparing…" : "Add pictures"}</span>
            </button>
          </li>
        )}
      </ul>

      <input
        ref={inputRef}
        hidden
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        multiple
        onChange={addFiles}
        aria-label="Choose product pictures"
      />
      <p className="picker-hint">
        JPEG, PNG or WebP, up to {max} pictures. The first picture is the one shoppers see in lists.
      </p>
      {error && <p className="picker-error" role="alert">{error}</p>}
    </div>
  );
}
