'use client';

import { useState } from 'react';
import { Button } from '@ui/components/ui/button';
import { Input } from '@ui/components/ui/input';
import { Label } from '@ui/components/ui/label';
import {
  ResponsiveDialog,
  ResponsiveDialogClose,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogTrigger,
} from '@ui/components/ui/responsive-dialog';
import { toast } from 'sonner';
import { Icons } from '@/components/shared/icons/icons-static';

export default function SubscribeToEmailUpdates({
  projectSlug,
  children,
}: {
  projectSlug: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Subscribe to email updates
  async function subscribeToEmailUpdates() {
    // Send request
    const res = await fetch(`/api/v1/${projectSlug}/changelogs/subscribers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
      }),
    });

    // If error
    if (!res.ok) {
      const error = await res.json();
      toast.error(error.error);
    } else {
      toast.success('Subscribed to email updates.');
      setOpen(false);
    }

    setIsLoading(false);
  }

  return (
    <ResponsiveDialog open={open} onOpenChange={setOpen}>
      <ResponsiveDialogTrigger asChild>{children}</ResponsiveDialogTrigger>
      <ResponsiveDialogContent>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            // Send invite
            setIsLoading(true);
            subscribeToEmailUpdates();
          }}
          className='flex flex-col sm:gap-4'>
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>Subscribe to Email Updates</ResponsiveDialogTitle>
            <ResponsiveDialogDescription>
              Receive the latest changelogs directly to your inbox.
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>
          <div className='flex flex-col gap-4'>
            {/* Project Name */}
            <div className='flex flex-col gap-2'>
              <div className='flex flex-row items-center gap-2'>
                <Label htmlFor='email'>Email</Label>
              </div>

              <Input
                id='email'
                placeholder='Your email'
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                }}
                className='bg-secondary/30 font-light'
              />

              <Label className='text-foreground/50 text-xs font-extralight'>
                We only send you latest changelogs. No spam. Unsubscribe anytime.
              </Label>
            </div>
          </div>
          <ResponsiveDialogFooter>
            <ResponsiveDialogClose />
            <Button variant='default' type='submit' disabled={!/\S+@\S+\.\S+/.test(email) || isLoading}>
              {isLoading ? <Icons.Spinner className='mr-2 h-4 w-4 animate-spin' /> : null}
              Subscribe
            </Button>
          </ResponsiveDialogFooter>
        </form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
