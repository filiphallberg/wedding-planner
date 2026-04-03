import { useEffect, useState } from 'react'
import { appUrl } from '../lib/appUrl'
import { createProjectInviteApi } from '../sync/projectApi'

function buildInviteUrl(token: string): string {
  const u = new URL(window.location.origin + appUrl('/'))
  u.searchParams.set('invite', token)
  return u.toString()
}

function mailtoHref(inviteeEmail: string, inviteLink: string): string {
  const subject = encodeURIComponent('Seating plan invitation')
  const body = encodeURIComponent(
    `You've been invited to collaborate on a seating plan.\n\nOpen this link while signed in with ${inviteeEmail}:\n\n${inviteLink}\n`,
  )
  return `mailto:${encodeURIComponent(inviteeEmail)}?subject=${subject}&body=${body}`
}

export function InviteCollaboratorsDialog({
  projectId,
  open,
  onClose,
}: {
  projectId: string
  open: boolean
  onClose: () => void
}) {
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [invite, setInvite] = useState<{ token: string; expiresInSeconds: number } | null>(null)

  useEffect(() => {
    if (!open) {
      setEmail('')
      setInvite(null)
      setBusy(false)
    }
  }, [open])

  if (!open) return null

  const inviteLink = invite ? buildInviteUrl(invite.token) : ''

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-stone-900/40"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="invite-dialog-title"
        className="relative z-10 w-full max-w-md rounded-lg border border-stone-200 bg-white p-5 shadow-lg"
      >
        <h2 id="invite-dialog-title" className="text-lg font-medium text-stone-900">
          Invite collaborator
        </h2>
        <p className="mt-1 text-sm text-stone-500">
          They must sign in with the same email address you enter here. Share the link by email or
          copy it.
        </p>

        {!invite ? (
          <form
            className="mt-4 flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault()
              setBusy(true)
              void (async () => {
                try {
                  const inv = await createProjectInviteApi(projectId, email)
                  setInvite(inv)
                } catch (err) {
                  window.alert(err instanceof Error ? err.message : 'Could not create invite')
                } finally {
                  setBusy(false)
                }
              })()
            }}
          >
            <label className="block text-sm text-stone-700" htmlFor="invite-email">
              Email address
            </label>
            <input
              id="invite-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="friend@example.com"
              className="rounded-md border border-stone-200 px-3 py-2 text-sm text-stone-800 placeholder:text-stone-400 focus:border-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-400"
            />
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="rounded-md border border-stone-200 bg-white px-3 py-1.5 text-sm text-stone-700 hover:bg-stone-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy}
                className="rounded-md border border-stone-300 bg-stone-900 px-3 py-1.5 text-sm text-white hover:bg-stone-800 disabled:opacity-50"
              >
                {busy ? 'Creating…' : 'Create invite link'}
              </button>
            </div>
          </form>
        ) : (
          <div className="mt-4 space-y-3">
            <label className="block text-xs font-medium uppercase tracking-wide text-stone-500">
              Invite link
            </label>
            <input
              readOnly
              value={inviteLink}
              className="w-full rounded-md border border-stone-200 bg-stone-50 px-3 py-2 text-xs text-stone-800"
              onFocus={(e) => e.target.select()}
            />
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  void navigator.clipboard.writeText(inviteLink).then(
                    () => window.alert('Link copied to clipboard.'),
                    () => window.alert('Could not copy.'),
                  )
                }}
                className="rounded-md border border-stone-300 bg-white px-3 py-1.5 text-sm text-stone-700 hover:bg-stone-50"
              >
                Copy link
              </button>
              <a
                href={mailtoHref(email.trim(), inviteLink)}
                className="inline-flex items-center rounded-md border border-stone-300 bg-white px-3 py-1.5 text-sm text-stone-700 hover:bg-stone-50"
              >
                Draft email
              </a>
            </div>
            <p className="text-xs text-stone-500">
              Link expires in {Math.round(invite.expiresInSeconds / (60 * 60 * 24))} days.
            </p>
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={onClose}
                className="rounded-md border border-stone-300 bg-stone-900 px-3 py-1.5 text-sm text-white hover:bg-stone-800"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
