'use client';

import { useState } from 'react';
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
import { cn } from '@ui/lib/utils';
import { Check, CheckIcon, ChevronDownIcon, ClipboardList } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from 'ui/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from 'ui/components/ui/dropdown-menu';
import { Input } from 'ui/components/ui/input';
import { Label } from 'ui/components/ui/label';
import { ProjectApiKeyProps } from '@/lib/types';
import { Icons } from '@/components/shared/icons/icons-static';

export default function AddApiKeyDialog({
  children,
  projectSlug,
  disabled,
  mutateKeys,
}: {
  children: React.ReactNode;
  projectSlug: string;
  disabled?: boolean;
  mutateKeys: () => void;
}) {
  const [name, setName] = useState<string>('');
  const [open, setOpen] = useState<boolean>(false);
  const [tokenOpen, setTokenOpen] = useState<boolean>(false);
  const [token, setToken] = useState<string>('');
  const [hasCopied, setHasCopied] = useState<boolean>();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [permission, setPermission] = useState<'public_access' | 'full_access'>('public_access');

  // Create API Key
  async function createApiKey() {
    const promise = new Promise<ProjectApiKeyProps['Row']>((resolve, reject) => {
      fetch(`/api/v1/projects/${projectSlug}/api-keys`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          permission,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.error) {
            reject(data.error);
          } else {
            resolve(data);
          }
        })
        .catch((err) => {
          reject(err.message);
        });
    });

    promise
      .then((data) => {
        setIsLoading(false);
        setName('');
        setOpen(false);
        mutateKeys();
        setTokenOpen(true);
        setToken(data.token);
      })
      .catch((error) => {
        setIsLoading(false);
        toast.error(error.message);
      });
  }

  return (
    <>
      {/* Create Dialog */}
      <ResponsiveDialog open={disabled ? false : open} onOpenChange={setOpen}>
        <ResponsiveDialogTrigger>{children}</ResponsiveDialogTrigger>
        <ResponsiveDialogContent className='sm:max-w-[425px]'>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              // Send invite
              setIsLoading(true);
              createApiKey();
            }}
            className='flex flex-col gap-4'>
            <ResponsiveDialogHeader>
              <ResponsiveDialogTitle>Create a new API Key</ResponsiveDialogTitle>
              <ResponsiveDialogDescription>
                Create a new API key for your project.
              </ResponsiveDialogDescription>
            </ResponsiveDialogHeader>
            <div className='flex flex-col gap-4'>
              {/* Project Name */}
              <div className='flex flex-col gap-2'>
                <div className='flex flex-row items-center gap-2'>
                  <Label htmlFor='name'>Name</Label>
                </div>

                <Input
                  id='name'
                  placeholder='Production SDK'
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value);
                  }}
                  className='col-span-3'
                />

                <Label className='text-foreground/50 text-xs font-extralight'>
                  The name of your API key. (used for identification)
                </Label>
              </div>

              {/* Project Slug */}
              <div className='flex flex-col gap-2'>
                <div className='flex flex-row items-center gap-2'>
                  <Label>Permissions</Label>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant='outline' className='w-full justify-between font-extralight'>
                      {permission === 'public_access' ? 'Public Access' : 'Full Access'}
                      <ChevronDownIcon className='text-muted-foreground ml-2 h-4 w-4' />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='start' defaultValue={permission}>
                    <DropdownMenuItem
                      className='flex flex-row items-center gap-7 px-4 py-2'
                      key='public_access'
                      onSelect={() => {
                        setPermission('public_access');
                      }}>
                      <div className='flex flex-col items-start'>
                        <p>Public Access</p>
                        <p className='text-foreground/70 text-sm font-extralight'>
                          View and create public available resources.
                        </p>
                      </div>

                      <Check
                        className={cn(
                          'ml-auto h-4 w-4',
                          permission === 'public_access' ? 'text-primary' : 'text-transparent'
                        )}
                      />
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className='flex flex-row items-center px-4 py-2'
                      key='full_access'
                      onSelect={() => {
                        setPermission('full_access');
                      }}>
                      <div className='flex flex-col items-start'>
                        <p>Full Access</p>
                        <p className='text-foreground/70 text-sm font-extralight'>
                          Admin-level access to all project resources.
                        </p>
                      </div>

                      <Check
                        className={cn(
                          'ml-auto h-4 w-4',
                          permission === 'full_access' ? 'text-primary' : 'text-transparent'
                        )}
                      />
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Label className='text-foreground/50 text-xs font-extralight'>
                  The permission scopes of your API key.
                </Label>
              </div>
            </div>
            <ResponsiveDialogFooter>
              <ResponsiveDialogClose asChild>
                <Button
                  variant='secondary'
                  type='button'
                  onClick={() => {
                    setName('');
                  }}>
                  Cancel
                </Button>
              </ResponsiveDialogClose>
              <Button type='submit' disabled={name === '' || isLoading}>
                {isLoading ? <Icons.Spinner className='mr-2 h-4 w-4 animate-spin' /> : null}
                Create Key
              </Button>
            </ResponsiveDialogFooter>
          </form>
        </ResponsiveDialogContent>
      </ResponsiveDialog>

      {/* Token Dialog */}
      <ResponsiveDialog open={tokenOpen} onOpenChange={setTokenOpen}>
        <ResponsiveDialogContent className='sm:max-w-[425px]'>
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>View API Key</ResponsiveDialogTitle>
            <ResponsiveDialogDescription>View your newly created API key.</ResponsiveDialogDescription>
          </ResponsiveDialogHeader>
          <div className='flex flex-col gap-2'>
            <div className='flex flex-row items-center gap-2'>
              <Label htmlFor='name'>Name</Label>
            </div>

            <button
              className='text-foreground/50 hover:text-foreground/80 bg-background group flex h-9 w-full cursor-pointer items-center justify-between rounded-md border px-3 py-2 text-sm font-extralight transition-all duration-200 ease-in-out'
              onClick={() => {
                navigator.clipboard.writeText(token);
                setHasCopied(true);

                setTimeout(() => {
                  setHasCopied(false);
                }, 2000);
              }}
              type='button'>
              {token}

              {hasCopied ? (
                <CheckIcon className='h-4 w-4 shrink-0 text-green-400 opacity-0 transition-opacity duration-150 group-hover:opacity-100' />
              ) : (
                <ClipboardList className='text-foreground/80 h-4 w-4 shrink-0 opacity-0 transition-opacity duration-150 group-hover:opacity-100' />
              )}
            </button>

            <Label className='text-foreground/50 text-xs font-extralight'>
              Keep this key safe. You will not be able to view it again!
            </Label>
          </div>
          <ResponsiveDialogFooter>
            <ResponsiveDialogClose asChild>
              <Button
                variant='secondary'
                onClick={() => {
                  setToken('');
                }}>
                Close
              </Button>
            </ResponsiveDialogClose>
          </ResponsiveDialogFooter>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    </>
  );
}
