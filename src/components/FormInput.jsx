import React from 'react';

export const FormInput = ({
  label,
  type = 'text', // text, number, email, password, select, textarea
  name,
  value,
  onChange,
  placeholder,
  required = false,
  error,
  options = [], // for type="select"
  rows = 3, // for type="textarea"
  helperText,
  disabled = false,
  className = '',
  ...props
}) => {
  const inputId = `input-${name}`;

  return (
    <div className={`form-group ${className}`}>
      {label && (
        <label htmlFor={inputId} className="form-label">
          {label} {required && <span style={{ color: 'var(--error)' }}>*</span>}
        </label>
      )}

      {type === 'select' ? (
        <select
          id={inputId}
          name={name}
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
          className="form-input"
          style={{
            appearance: 'none',
            backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 16px center',
            backgroundSize: '16px',
            paddingRight: '40px',
            cursor: disabled ? 'not-allowed' : 'pointer'
          }}
          {...props}
        >
          {placeholder && <option value="" disabled>{placeholder}</option>}
          {options.map((opt) => (
            <option
              key={opt.value}
              value={opt.value}
              style={{ background: 'var(--bg-surface-solid)', color: 'var(--text-primary)' }}
            >
              {opt.label}
            </option>
          ))}
        </select>
      ) : type === 'textarea' ? (
        <textarea
          id={inputId}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          rows={rows}
          disabled={disabled}
          className="form-input"
          style={{ resize: 'vertical' }}
          {...props}
        />
      ) : (
        <input
          id={inputId}
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className="form-input"
          {...props}
        />
      )}

      {error && (
        <span
          style={{
            fontSize: '0.78rem',
            color: 'var(--error)',
            marginTop: '4px',
            display: 'block'
          }}
        >
          {error}
        </span>
      )}
      
      {!error && helperText && (
        <span
          style={{
            fontSize: '0.78rem',
            color: 'var(--text-muted)',
            marginTop: '4px',
            display: 'block'
          }}
        >
          {helperText}
        </span>
      )}
    </div>
  );
};

export default FormInput;
