import { useEffect, useState } from 'react';
import { appUrl } from '../lib/appUrl';
import { createProjectInviteApi } from '../sync/projectApi';
import { Button, Dialog, Input, Label } from '../ui';

function buildInviteUrl(token: string): string {
  const u = new URL(window.location.origin + appUrl('/'));
  u.searchParams.set('invite', token);
  return u.toString();
}

function mailtoHref(inviteeEmail: string, inviteLink: string): string {
  const subject = encodeURIComponent('Seating plan invitation');
  const body = encodeURIComponent(
    `You've been invited to collaborate on a seating plan.\n\nOpen this link while signed in with ${inviteeEmail}:\n\n${inviteLink}\n`,
  );
  return `mailto:${encodeURIComponent(inviteeEmail)}?subject=${subject}&body=${body}`;
}

export function InviteCollaboratorsDialog({
  projectId,
  open,
  onClose,
}: {
  projectId: string;
  open: boolean;
  onClose: () => void;
}) {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [invite, setInvite] = useState<{
    token: string;
    expiresInSeconds: number;
  } | null>(null);

  useEffect(() => {
    if (!open) {
      setEmail('');
      setInvite(null);
      setBusy(false);
    }
  }, [open]);

  const inviteLink = invite ? buildInviteUrl(invite.token) : '';

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Invite collaborator"
      titleId="invite-dialog-title"
      zIndexClass="z-[300]"
      panelMaxWidthClass="max-w-md"
    >
      <p className="mt-1 text-sm text-stone-500">
        They must sign in with the same email address you enter here. Share the link by email or
        copy it.
      </p>

      {!invite ? (
        <form
          className="mt-4 flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            setBusy(true);
            void (async () => {
              try {
                const inv = await createProjectInviteApi(projectId, email);
                setInvite(inv);
              } catch (err) {
                window.alert(err instanceof Error ? err.message : 'Could not create invite');
              } finally {
                setBusy(false);
              }
            })();
          }}
        >
          <Label className="text-sm text-stone-700" htmlFor="invite-email">
            Email address
          </Label>
          <Input
            id="invite-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="friend@example.com"
            className="rounded-md px-3 py-2"
          />
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={busy}>
              {busy ? 'Creating…' : 'Create invite link'}
            </Button>
          </div>
        </form>
      ) : (
        <div className="mt-4 space-y-3">
          <Label className="text-xs font-medium uppercase tracking-wide text-stone-500">
            Invite link
          </Label>
          <Input
            readOnly
            value={inviteLink}
            className="bg-stone-50 px-3 py-2 text-xs"
            onFocus={(e) => e.target.select()}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="default"
              onClick={() => {
                void navigator.clipboard.writeText(inviteLink).then(
                  () => window.alert('Link copied to clipboard.'),
                  () => window.alert('Could not copy.'),
                );
              }}
            >
              Copy link
            </Button>
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
            <Button type="button" variant="primary" onClick={onClose}>
              Done
            </Button>
          </div>
        </div>
      )}
    </Dialog>
  );
}
