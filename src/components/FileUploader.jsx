import React, { useRef, useState } from 'react';

export const FileUploader = ({
  label,
  value, // File object or URL
  onChange,
  accept = 'image/*',
  required = false,
  error,
  helperText = 'Upload screenshot of your transaction receipt (JPEG, PNG)',
  disabled = false,
  className = '',
  ...props
}) => {
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const [localError, setLocalError] = useState('');
  const [previewUrl, setPreviewUrl] = useState(
    typeof value === 'string' ? value : value ? URL.createObjectURL(value) : ''
  );

  const handleFile = (file) => {
    if (!file) return;
    setLocalError('');

    // 5MB Size Limit
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setLocalError('File size exceeds the 5MB limit. Please upload a smaller image.');
      onChange(null);
      setPreviewUrl('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Format Restrictions: JPG, JPEG, PNG, WEBP
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp'];
    const fileExt = file.name.split('.').pop().toLowerCase();

    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExt)) {
      setLocalError('Only JPG, JPEG, PNG, and WEBP image files are allowed.');
      onChange(null);
      setPreviewUrl('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    onChange(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const clearFile = (e) => {
    e.stopPropagation();
    onChange(null);
    setPreviewUrl('');
    setLocalError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`form-group ${className}`}>
      {label && (
        <label className="form-label">
          {label} {required && <span style={{ color: 'var(--error)' }}>*</span>}
        </label>
      )}

      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
        style={{
          border: dragActive 
            ? '2px dashed var(--primary)' 
            : previewUrl 
              ? '1px solid var(--border-color)' 
              : '1px dashed var(--border-color)',
          background: dragActive 
            ? 'var(--primary-glow)' 
            : 'rgba(255, 255, 255, 0.02)',
          borderRadius: 'var(--radius-md)',
          padding: previewUrl ? '16px' : '32px 16px',
          textAlign: 'center',
          cursor: disabled ? 'not-allowed' : 'pointer',
          transition: 'all var(--transition-normal)',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px'
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileChange}
          disabled={disabled}
          style={{ display: 'none' }}
        />

        {previewUrl ? (
          <div style={{ position: 'relative', width: '100%', maxWidth: '240px' }}>
            <img
              src={previewUrl}
              alt="Receipt Preview"
              style={{
                width: '100%',
                maxHeight: '160px',
                objectFit: 'contain',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}
            />
            {!disabled && (
              <button
                type="button"
                onClick={clearFile}
                style={{
                  position: 'absolute',
                  top: '-8px',
                  right: '-8px',
                  background: 'var(--error)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}
              >
                ✕
              </button>
            )}
          </div>
        ) : (
          <>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-secondary)'
              }}
            >
              {/* Upload SVG icon */}
              <svg
                style={{ width: '20px', height: '20px' }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                />
              </svg>
            </div>
            <div>
              <p
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  color: 'var(--text-primary)',
                  marginBottom: '4px'
                }}
              >
                Click to upload or drag & drop
              </p>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {helperText}
              </p>
            </div>
          </>
        )}
      </div>

      {(localError || error) && (
        <span
          style={{
            fontSize: '0.78rem',
            color: 'var(--error)',
            marginTop: '4px',
            display: 'block'
          }}
        >
          {localError || error}
        </span>
      )}
    </div>
  );
};

export default FileUploader;
