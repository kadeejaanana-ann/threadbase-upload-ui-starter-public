
import { useState, useRef, useEffect } from "react";
import apiClient from "../services/apiClient.js";

const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

export default function AvatarUploader() {
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(null);
  const [progress, setProgress] = useState(0);

  const inputRef = useRef(null);

  // Validate file
  function validate(file) {
    if (!ALLOWED.includes(file.type)) {
      return "Only image files are allowed";
    }

    if (file.size > MAX_SIZE) {
      return "File is too large. Maximum size is 5MB";
    }

    return null;
  }

  // Handle selected file
  function handleFile(selectedFile) {
    if (!selectedFile) return;

    const errorMessage = validate(selectedFile);

    if (errorMessage) {
      setError(errorMessage);
      setFile(null);
      return;
    }

    setError("");
    setFile(selectedFile);
    setProgress(0);
  }

  // Drag over
  function handleDragOver(e) {
    e.preventDefault();
    setIsDragging(true);
  }

  // Drag leave
  function handleDragLeave(e) {
    e.preventDefault();
    setIsDragging(false);
  }

  // Drop
  function handleDrop(e) {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];

    handleFile(droppedFile);
  }

  // Create preview
  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }

    const url = URL.createObjectURL(file);

    setPreview(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  // Upload
  async function upload() {
    if (!file) return;

    const formData = new FormData();

    formData.append("avatar", file);

    try {
      setError("");

      const response = await apiClient.post(
        "/api/upload",
        formData,
        {
          onUploadProgress: (event) => {
            if (event.total) {
              const percent = Math.round(
                (event.loaded * 100) / event.total
              );

              setProgress(percent);
            }
          },
        }
      );

      console.log("Upload successful:", response.data);
    } catch (error) {
      console.error(error);
      setError("Upload failed");
    }
  }

  return (
    <div>
      <div
        className={
          isDragging
            ? "drop-zone dragging"
            : "drop-zone"
        }
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current.click()}
      >
        <p>Drag an image here, or click to choose</p>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => handleFile(e.target.files[0])}
        />
      </div>

      {error && (
        <p className="error">{error}</p>
      )}

      {preview && (
        <img
          src={preview}
          alt="Preview"
          className="preview"
        />
      )}

      {progress > 0 && (
        <div className="bar">
          <div
            className="fill"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      )}

      {progress > 0 && (
        <p>{progress}%</p>
      )}

      <button
        onClick={upload}
        disabled={!file}
      >
        Upload
      </button>
    </div>
  );
}
