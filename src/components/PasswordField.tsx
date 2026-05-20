'use client'

import { useState } from 'react'
import styles from './PasswordField.module.css'

type PasswordFieldProps = {
  id: string
  name: string
  label: string
  autoComplete?: string
  minLength?: number
  required?: boolean
  error?: string
  labelClassName?: string
  fieldClassName?: string
  errorClassName?: string
}

export default function PasswordField({
  id,
  name,
  label,
  autoComplete,
  minLength,
  required,
  error,
  labelClassName,
  fieldClassName,
  errorClassName,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false)

  return (
    <div className={fieldClassName}>
      <label className={labelClassName} htmlFor={id}>
        {label}
      </label>
      <div className={styles.row}>
        <input
          id={id}
          name={name}
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          minLength={minLength}
          required={required}
        />
        <button
          type="button"
          className={styles.toggle}
          onClick={() => setVisible(v => !v)}
          aria-pressed={visible}
          aria-label={visible ? 'Hide password' : 'Show password'}
        >
          {visible ? 'Hide' : 'Show'}
        </button>
      </div>
      {error && <p className={errorClassName ?? styles.error}>{error}</p>}
    </div>
  )
}
