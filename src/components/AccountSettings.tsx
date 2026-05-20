'use client'

import { useEffect, useState } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { useRouter } from 'next/navigation'
import {
  changePassword,
  updateProfile,
  type AccountFormState,
} from '@/app/actions/account'
import type { SafeUser } from '@/lib/auth-shared'
import PasswordField from '@/components/PasswordField'
import { SignOutButton } from '@/components/SignOutButton'
import styles from '@/app/dashboard/page.module.css'

function SaveButton({ label }: { label: string }) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" className={styles.fabPrimary} disabled={pending}>
      {pending ? 'Saving…' : label}
    </button>
  )
}

type AccountSettingsProps = { user: SafeUser }

export default function AccountSettings({ user }: AccountSettingsProps) {
  const router = useRouter()
  const [profileState, profileAction] = useFormState(updateProfile, undefined as AccountFormState)
  const [passwordState, passwordAction] = useFormState(changePassword, undefined as AccountFormState)
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (profileState?.success) {
      setProfileSuccess(profileState.success)
      setPasswordSuccess(null)
      router.refresh()
    }
  }, [profileState?.success, router])

  useEffect(() => {
    if (passwordState?.success) {
      setPasswordSuccess(passwordState.success)
      setProfileSuccess(null)
    }
  }, [passwordState?.success])

  return (
    <>
      <section className={styles.settingsSection}>
        <h2 className={styles.settingsTitle}>Account</h2>
        <p className={styles.settingsDesc}>
          Household of {user.householdSize}
          {user.dietaryPreferences.length > 0
            ? ` · ${user.dietaryPreferences.join(', ')}`
            : ''}
        </p>

        {profileState?.errors?.form && (
          <p className={styles.accountError}>{profileState.errors.form}</p>
        )}
        {profileSuccess && <p className={styles.accountSuccess}>{profileSuccess}</p>}

        <form action={profileAction} className={styles.accountForm}>
          <div className={styles.accountField}>
            <label className={styles.formLabel} htmlFor="account-name">
              Name
            </label>
            <input
              id="account-name"
              name="name"
              type="text"
              autoComplete="name"
              defaultValue={user.name}
              required
            />
            {profileState?.errors?.name && (
              <p className={styles.accountError}>{profileState.errors.name}</p>
            )}
          </div>
          <div className={styles.accountField}>
            <label className={styles.formLabel} htmlFor="account-email">
              Email
            </label>
            <input
              id="account-email"
              name="email"
              type="email"
              autoComplete="email"
              defaultValue={user.email}
              required
            />
            {profileState?.errors?.email && (
              <p className={styles.accountError}>{profileState.errors.email}</p>
            )}
          </div>
          <SaveButton label="Save profile" />
        </form>

        <div className={styles.accountDivider} />

        <h3 className={styles.settingsSubtitle}>Change password</h3>
        {passwordState?.errors?.form && (
          <p className={styles.accountError}>{passwordState.errors.form}</p>
        )}
        {passwordSuccess && <p className={styles.accountSuccess}>{passwordSuccess}</p>}

        <form action={passwordAction} className={styles.accountForm}>
          <PasswordField
            id="current-password"
            name="current_password"
            label="Current password"
            autoComplete="current-password"
            required
            labelClassName={styles.formLabel}
            fieldClassName={styles.accountField}
            errorClassName={styles.accountError}
            error={passwordState?.errors?.current_password}
          />
          <PasswordField
            id="new-password"
            name="new_password"
            label="New password"
            autoComplete="new-password"
            minLength={8}
            required
            labelClassName={styles.formLabel}
            fieldClassName={styles.accountField}
            errorClassName={styles.accountError}
            error={passwordState?.errors?.new_password}
          />
          <PasswordField
            id="confirm-password"
            name="confirm_password"
            label="Confirm new password"
            autoComplete="new-password"
            minLength={8}
            required
            labelClassName={styles.formLabel}
            fieldClassName={styles.accountField}
            errorClassName={styles.accountError}
            error={passwordState?.errors?.confirm_password}
          />
          <SaveButton label="Update password" />
        </form>

        <div className={styles.accountDivider} />
        <SignOutButton />
      </section>
    </>
  )
}
