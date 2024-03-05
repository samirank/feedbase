'use client';

import { useCallback, useEffect, useState } from 'react';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { fontMono } from '@ui/styles/fonts';
import { CheckIcon, ClipboardList, Download, MoreVertical } from 'lucide-react';
import { toast } from 'sonner';
import useSWR from 'swr';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from 'ui/components/ui/accordion';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from 'ui/components/ui/alert-dialog';
import { Button } from 'ui/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from 'ui/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from 'ui/components/ui/dropdown-menu';
import { Input } from 'ui/components/ui/input';
import { Label } from 'ui/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from 'ui/components/ui/tabs';
import { ProjectApiKeyWithoutTokenProps, ProjectConfigWithoutSecretProps, ProjectProps } from '@/lib/types';
import { fetcher } from '@/lib/utils';
import { Icons } from '@/components/shared/icons/icons-static';
import DefaultTooltip from '@/components/shared/tooltip';
import AddApiKeyDialog from '../modals/add-api-key-modal';

interface domainData {
  name: string;
  apexName: string;
  verified: boolean;
  verification: {
    type: string;
    domain: string;
    value: string;
    reason: string;
  }[];
}

export default function GeneralConfigCards({
  projectData,
  projectConfig,
}: {
  projectData: ProjectProps['Row'];
  projectConfig: ProjectConfigWithoutSecretProps;
}) {
  const [project, setProject] = useState<ProjectProps['Row']>(projectData);
  const [domain, setDomain] = useState<string>(projectConfig?.custom_domain || '');
  const [domainStatus, setDomainStatus] = useState<
    'verified' | 'unverified' | 'refreshing' | 'requesting' | null
  >(
    projectConfig?.custom_domain_verified === true
      ? 'verified'
      : projectConfig?.custom_domain_verified === false
      ? 'unverified'
      : null
  );
  const [domainData, setDomainData] = useState<domainData>();
  const [hasCopied, setHasCopied] = useState<string[]>([]);
  const {
    data: apiKeys,
    isLoading,
    mutate,
  } = useSWR<ProjectApiKeyWithoutTokenProps[]>(`/api/v1/projects/${projectData.slug}/api-keys`, fetcher);

  function handleSlugChange(event: React.ChangeEvent<HTMLInputElement>) {
    // Replace spaces with dashes
    event.target.value = event.target.value.replace(/\s+/g, '-').toLowerCase();

    setProject((prevProject) => {
      if (prevProject) {
        return {
          ...prevProject,
          slug: event.target.value,
        };
      }
      return prevProject; // Return null or the initial value if prevProject is null
    });
  }

  function handleNameChange(event: React.ChangeEvent<HTMLInputElement>) {
    // Prevent default
    event.preventDefault();

    setProject((prevProject) => {
      if (prevProject) {
        return {
          ...prevProject,
          name: event.target.value,
        };
      }
      return prevProject; // Return null or the initial value if prevProject is null
    });
  }

  async function handleDeleteProject() {
    const promise = new Promise((resolve, reject) => {
      fetch(`/api/v1/projects/${project.slug}`, {
        method: 'DELETE',
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

    toast.promise(promise, {
      loading: 'Deleting project...',
      success: 'Project deleted successfully.',
      error: (err) => {
        return err;
      },
    });

    promise.then(() => {
      window.location.href = '/';
    });
  }

  async function handleSaveProject() {
    const promise = new Promise((resolve, reject) => {
      fetch(`/api/v1/projects/${projectData.slug}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        // Pass only the changed values
        body: JSON.stringify({
          name: project.name !== projectData.name ? project.name : undefined,
          slug: project.slug !== projectData.slug ? project.slug : undefined,
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

    toast.promise(promise, {
      loading: 'Updating project...',
      success: 'Project updated successfully.',
      error: (err) => {
        return err;
      },
    });

    promise.then(() => {
      // If the slug has changed, redirect to the new slug
      if (project.slug !== projectData.slug) {
        window.location.href = `/${project.slug}/settings/general`;
      } else {
        window.location.reload();
      }
    });
  }

  // submit domain
  async function handleSubmitDomain() {
    const promise = new Promise((resolve, reject) => {
      fetch(`/api/v1/projects/${projectData.slug}/config/domain`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: domain,
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

    toast.promise(promise, {
      loading: 'Updating domain...',
      success: 'Domain updated successfully.',
      error: (err) => {
        return err;
      },
    });

    promise.then((data) => {
      // Set domain data
      setDomainData(data as domainData);

      // Fetch domain data to set status
      fetchDomainData(true);
    });
  }

  // remove domain
  async function handleRemoveDomain() {
    const promise = new Promise((resolve, reject) => {
      fetch(`/api/v1/projects/${projectData.slug}/config/domain`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
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

    toast.promise(promise, {
      loading: 'Removing domain...',
      success: 'Domain removed successfully.',
      error: (err) => {
        return err;
      },
    });

    promise.then(() => {
      // Reset states
      setDomainData(undefined);
      setDomain('');
      setDomainStatus(null);
    });
  }

  // On revoke api key
  function handleRevokeApiKey(apiKey: ProjectApiKeyWithoutTokenProps) {
    const promise = new Promise((resolve, reject) => {
      fetch(`/api/v1/projects/${projectData.slug}/api-keys/${apiKey.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
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

    toast.promise(promise, {
      loading: 'Revoking API key...',
      success: () => {
        mutate();
        return `API key revoked!`;
      },
      error: (err) => {
        return err;
      },
    });
  }

  function handleCopyToClipboard(value: string) {
    navigator.clipboard.writeText(value);
    setHasCopied((prevHasCopied) => [...prevHasCopied, value]);

    setTimeout(() => {
      setHasCopied((prevHasCopied) => prevHasCopied.filter((item) => item !== value));
    }, 3000);
  }

  // Fetch domain status
  const fetchDomainData = useCallback(
    (requestLoading = false) => {
      if (requestLoading) {
        setDomainStatus('requesting');
      } else {
        setDomainStatus('refreshing');
      }

      fetch(`/api/v1/projects/${projectData.slug}/config/domain`)
        .then((res) => res.json())
        .then((data) => {
          if (data.error) {
            toast.error(data.error);
          } else if (data.verified && !data.config.misconfigured) {
            setDomainStatus('verified');
          } else {
            setDomainData(data.domain);
            setDomainStatus('unverified');
          }
        })
        .catch((err) => {
          toast.error(err.message);
        });
    },
    [projectData]
  );

  // handle export feedback
  function handleExportFeedback() {
    const promise = new Promise((resolve, reject) => {
      fetch(`/api/v1/projects/${projectData.slug}/feedback/export`)
        .then((res) => res.blob())
        .then((blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${projectData.name}-${Date.now()}.csv`;
          document.body.appendChild(a);
          a.click();
          a.remove();
          resolve('Feedback exported successfully.');
        })
        .catch((err) => {
          reject(err.message);
        });
    });

    toast.promise(promise, {
      loading: 'Exporting feedback...',
      success: 'Feedback exported successfully.',
      error: (err) => {
        return err;
      },
    });
  }

  // While domain is unverified, check each 5 seconds if it's verified
  useEffect(() => {
    if (domainStatus === 'unverified') {
      // Fetch domain data
      const interval = setInterval(() => {
        if (domainStatus === 'unverified') fetchDomainData();
      }, 5000);

      // Clear interval on unmount
      return () => {
        clearInterval(interval);
      };
    }
  }, [domainStatus, fetchDomainData]);

  // Fetch once on mount
  useEffect(() => {
    if (domainStatus === 'unverified') fetchDomainData();
    // In this case, we don't want to re-run this effect if domainStatus changes as it would cause an infinite loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <Card className='flex w-full flex-col '>
        <CardHeader>
          <CardTitle>General</CardTitle>
          <CardDescription>Configure your project&apos;s general settings.</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Name & Slug Config */}
          <div className='flex h-full w-full flex-col space-y-3'>
            <div className='space-y-1'>
              <Label className='text-foreground/70 text-sm font-light'>Name</Label>
              <Input className='w-full max-w-xs' value={project.name} onChange={handleNameChange} />
              <Label className='text-foreground/50 text-xs font-extralight'>
                This is the name of your project.
              </Label>
            </div>

            <div className='space-y-1'>
              <Label className='text-foreground/70 text-sm font-light'>Slug</Label>

              <div className='bg-background focus-within:ring-ring ring-offset-root flex h-9 w-full max-w-xs rounded-md border text-sm font-extralight transition-shadow duration-200 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-1'>
                <Input
                  className='h-full w-full border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0'
                  placeholder='slug'
                  value={project.slug}
                  onChange={handleSlugChange}
                />
                <div className='text-foreground/50 bg-accent select-none rounded-r-md border-l px-3 py-2'>
                  .{process.env.NEXT_PUBLIC_ROOT_DOMAIN}
                </div>
              </div>

              <Label className='text-foreground/50 text-xs font-extralight'>
                This is the subdomain of your project.
              </Label>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            className='w-32'
            disabled={
              (project.name === projectData.name && project.slug === projectData.slug) ||
              !project.name ||
              !project.slug
            }
            onClick={handleSaveProject}>
            Save changes
          </Button>
        </CardFooter>
      </Card>

      {/* Domain */}
      <Card className='flex w-full flex-col'>
        <CardHeader>
          <CardTitle>Custom Domain</CardTitle>
          <CardDescription>Configure your project&apos;s custom domain.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='space-y-1'>
            <Label className='text-foreground/70 text-sm font-light'>Domain</Label>
            <Input
              className='w-full max-w-xs'
              placeholder='hub.domain.com'
              value={domain}
              onChange={(e) => {
                setDomain(e.target.value);
              }}
              disabled={domainStatus !== null}
            />
            <Label className='text-foreground/50 text-xs font-extralight'>
              The domain you want to link your public hub to.
            </Label>
          </div>

          {/* If unverified domain, show how to verify */}
          {domainStatus !== 'verified' && domainStatus !== 'requesting' && domainStatus ? (
            <Accordion type='single' collapsible className='pt-1'>
              <AccordionItem value='item-1' className='-mb-3 max-w-[550px] border-none'>
                <AccordionTrigger>
                  <div className='flex flex-row items-center gap-2 text-base font-light'>
                    <ExclamationCircleIcon className='h-5 w-5 text-yellow-400' />
                    Verification Required
                    {/* Refresh Status */}
                    {domainStatus === 'refreshing' && (
                      <Icons.Spinner className='text-foreground/70 h-4 w-4 animate-spin' />
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent className='flex h-full w-full flex-col space-y-4'>
                  {/* Loading */}
                  {!domainData && (
                    <div className='flex w-full flex-col items-center justify-center gap-2'>
                      <Icons.Spinner className='text-foreground/70 h-5 w-5 animate-spin' />
                      <Label className='text-foreground/70 text-sm font-light'>Fetching domain data...</Label>
                    </div>
                  )}

                  {/* Tabs, if domain is not assigned to a vercel project yet */}
                  {domainData && domainData.verification === undefined ? (
                    <Tabs defaultValue='a' className='w-[550px]'>
                      <TabsList className='space-x-5 border-b-0 bg-transparent p-0'>
                        <TabsTrigger
                          value='a'
                          className='rounded-none border-b border-transparent px-1 data-[state=active]:border-b data-[state=active]:border-white data-[state=active]:bg-transparent'>
                          A Record (Recommended)
                        </TabsTrigger>
                        <TabsTrigger
                          value='cname'
                          className='rounded-none border-b border-transparent px-1 data-[state=active]:border-b data-[state=active]:border-white data-[state=active]:bg-transparent'>
                          CNAME Record
                        </TabsTrigger>
                      </TabsList>
                      <TabsContent value='a' className='flex w-full flex-col'>
                        <Label className='text-foreground/80 cursor-text select-text pt-1 text-sm font-light'>
                          To verify your domain, add the following A Records to your DNS settings.
                        </Label>

                        {/* Info Table */}
                        <div className='bg-background my-3 overflow-x-auto rounded border px-5 py-3'>
                          {/* Type */}
                          <div className='flex flex-row gap-3'>
                            <div className='flex w-full flex-col justify-start gap-2'>
                              <Label className='text-foreground/90 text-sm font-light'>Type</Label>
                              <span
                                className={`${fontMono.variable} font-monospace text-foreground/70 text-sm font-extralight`}>
                                A
                              </span>
                            </div>
                            <div className='flex w-full flex-col justify-start gap-2'>
                              <Label className='text-foreground/90 text-sm font-light'>Name</Label>
                              <button
                                className='group flex cursor-pointer flex-row items-center justify-between space-x-2'
                                onClick={() => {
                                  handleCopyToClipboard('@');
                                }}
                                type='button'>
                                <span
                                  className={`${fontMono.variable} font-monospace text-foreground/70 text-sm font-extralight`}>
                                  @
                                </span>

                                {hasCopied.includes('@') ? (
                                  <CheckIcon className='h-4 w-4 text-green-400 opacity-0 transition-opacity duration-150 group-hover:opacity-100' />
                                ) : (
                                  <ClipboardList className='text-foreground/70 h-4 w-4 opacity-0 transition-opacity duration-150 group-hover:opacity-100' />
                                )}
                              </button>
                            </div>
                            <div className='flex w-full flex-col justify-start gap-2'>
                              <Label className='text-foreground/90 text-sm font-light'>Value</Label>

                              <button
                                className='group flex cursor-pointer flex-row items-center justify-between space-x-2'
                                onClick={() => {
                                  handleCopyToClipboard('76.76.21.21');
                                }}
                                type='button'>
                                <span
                                  className={`${fontMono.variable} font-monospace text-foreground/70 text-sm font-extralight`}>
                                  76.76.21.21
                                </span>

                                {hasCopied.includes('76.76.21.21') ? (
                                  <CheckIcon className='h-4 w-4 text-green-400 opacity-0 transition-opacity duration-150 group-hover:opacity-100' />
                                ) : (
                                  <ClipboardList className='text-foreground/70 h-4 w-4 opacity-0 transition-opacity duration-150 group-hover:opacity-100' />
                                )}
                              </button>
                            </div>
                            <div className='flex w-full flex-col justify-start gap-2'>
                              <Label className='text-foreground/90 text-sm font-light'>TTL</Label>
                              <button
                                className='group flex cursor-pointer flex-row items-center justify-between space-x-2'
                                onClick={() => {
                                  handleCopyToClipboard('86400');
                                }}
                                type='button'>
                                <span
                                  className={`${fontMono.variable} font-monospace text-foreground/70 text-sm font-extralight`}>
                                  86400
                                </span>

                                {hasCopied.includes('86400') ? (
                                  <CheckIcon className='h-4 w-4 text-green-400 opacity-0 transition-opacity duration-150 group-hover:opacity-100' />
                                ) : (
                                  <ClipboardList className='text-foreground/70 h-4 w-4 opacity-0 transition-opacity duration-150 group-hover:opacity-100' />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Note */}
                        <Label className='text-foreground/80 cursor-text select-text text-sm font-light'>
                          Note: If{' '}
                          <span
                            className={`${fontMono.variable} bg-background font-monospace rounded px-1 py-0.5`}>
                            86400
                          </span>{' '}
                          is not supported for TLL, make sure to use the highest TTL value available.
                        </Label>
                      </TabsContent>
                      <TabsContent value='cname' className='flex w-full flex-col'>
                        <Label className='text-foreground/80 -mt-1 cursor-text select-text text-sm font-light'>
                          To verify your domain, add the following CNAME Records to your DNS settings.
                        </Label>

                        {/* Info Table */}
                        <div className='bg-background my-3 overflow-x-auto rounded border px-5 py-3'>
                          {/* Type */}
                          <div className='flex flex-row gap-3'>
                            <div className='flex w-full flex-col justify-start gap-2'>
                              <Label className='text-foreground/90 text-sm font-light'>Type</Label>
                              <span
                                className={`${fontMono.variable} font-monospace text-foreground/70 text-sm font-extralight`}>
                                CNAME
                              </span>
                            </div>
                            <div className='flex w-full flex-col justify-start gap-2'>
                              <Label className='text-foreground/90 text-sm font-light'>Name</Label>
                              <button
                                className='group flex cursor-pointer flex-row items-center justify-between space-x-2'
                                onClick={() => {
                                  handleCopyToClipboard('www');
                                }}
                                type='button'>
                                <span
                                  className={`${fontMono.variable} font-monospace text-foreground/70 text-sm font-extralight`}>
                                  www
                                </span>

                                {hasCopied.includes('www') ? (
                                  <CheckIcon className='h-4 w-4 shrink-0 text-green-400 opacity-0 transition-opacity duration-150 group-hover:opacity-100' />
                                ) : (
                                  <ClipboardList className='text-foreground/70 h-4 w-4 shrink-0 opacity-0 transition-opacity duration-150 group-hover:opacity-100' />
                                )}
                              </button>
                            </div>
                            <div className='flex w-full flex-col justify-start gap-2'>
                              <Label className='text-foreground/90 text-sm font-light'>Value</Label>

                              <button
                                className='group flex cursor-pointer flex-row items-center justify-between space-x-2'
                                onClick={() => {
                                  handleCopyToClipboard('76.76.21.21');
                                }}
                                type='button'>
                                <span
                                  className={`${fontMono.variable} font-monospace text-foreground/70 text-sm font-extralight`}>
                                  cname.vercel-dns.com
                                </span>

                                {hasCopied.includes('76.76.21.21') ? (
                                  <CheckIcon className='h-4 w-4 shrink-0 text-green-400 opacity-0 transition-opacity duration-150 group-hover:opacity-100' />
                                ) : (
                                  <ClipboardList className='text-foreground/70 h-4 w-4 shrink-0 opacity-0 transition-opacity duration-150 group-hover:opacity-100' />
                                )}
                              </button>
                            </div>
                            <div className='flex w-full flex-col justify-start gap-2'>
                              <Label className='text-foreground/90 text-sm font-light'>TTL</Label>
                              <button
                                className='group flex cursor-pointer flex-row items-center justify-between space-x-2'
                                onClick={() => {
                                  handleCopyToClipboard('86400');
                                }}
                                type='button'>
                                <span
                                  className={`${fontMono.variable} font-monospace text-foreground/70 text-sm font-extralight`}>
                                  86400
                                </span>

                                {hasCopied.includes('86400') ? (
                                  <CheckIcon className='h-4 w-4 shrink-0 text-green-400 opacity-0 transition-opacity duration-150 group-hover:opacity-100' />
                                ) : (
                                  <ClipboardList className='text-foreground/70 h-4 w-4 shrink-0 opacity-0 transition-opacity duration-150 group-hover:opacity-100' />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Note */}
                        <Label className='text-foreground/80 cursor-text select-text pb-2 text-sm font-light'>
                          Note: If{' '}
                          <span
                            className={`${fontMono.variable} bg-background font-monospace rounded px-1 py-0.5`}>
                            86400
                          </span>{' '}
                          is not supported for TLL, make sure to use the highest TTL value available.
                        </Label>
                      </TabsContent>
                    </Tabs>
                  ) : null}

                  {/* Verification Instructions for already vercel assigned domains */}
                  {domainData?.verification !== undefined ? (
                    <div className='flex max-w-[600px] flex-col space-y-2'>
                      <Label className='text-foreground/80 cursor-text select-text pt-1 text-sm font-light'>
                        To prove ownership of{' '}
                        <span
                          className={`${fontMono.variable} bg-background font-monospace rounded px-1 py-0.5`}>
                          {domainData.apexName}
                        </span>
                        , please add the following TXT Record to your DNS settings.
                      </Label>

                      {/* Info Table */}
                      <div className='bg-background my-3 overflow-x-auto rounded border px-5 py-3'>
                        {/* Type */}
                        <div className='flex flex-row gap-3'>
                          <div className='flex w-full flex-col justify-start gap-2'>
                            <Label className='text-foreground/90 text-sm font-light'>Type</Label>
                            <span
                              className={`${fontMono.variable} font-monospace text-foreground/70 text-sm font-extralight`}>
                              TXT
                            </span>
                          </div>
                          <div className='flex w-full flex-col justify-start gap-2'>
                            <Label className='text-foreground/90 text-sm font-light'>Name</Label>
                            <button
                              className='group flex cursor-pointer flex-row items-center justify-between space-x-2'
                              onClick={() => {
                                handleCopyToClipboard(domainData.verification[0].domain);
                              }}
                              type='button'>
                              <span
                                className={`${fontMono.variable} font-monospace text-foreground/70 text-sm font-extralight`}>
                                {domainData.verification[0].domain}
                              </span>

                              {hasCopied.includes(domainData.verification[0].domain) ? (
                                <CheckIcon className='h-4 w-4 shrink-0 text-green-400 opacity-0 transition-opacity duration-150 group-hover:opacity-100' />
                              ) : (
                                <ClipboardList className='text-foreground/70 h-4 w-4 shrink-0 opacity-0 transition-opacity duration-150 group-hover:opacity-100' />
                              )}
                            </button>
                          </div>
                          <div className='flex w-full flex-col justify-start gap-2'>
                            <Label className='text-foreground/90 text-sm font-light'>Value</Label>

                            <button
                              className='group flex cursor-pointer flex-row items-center justify-between space-x-2'
                              onClick={() => {
                                handleCopyToClipboard(domainData.verification[0].value);
                              }}
                              type='button'>
                              <span
                                className={`${fontMono.variable} font-monospace text-foreground/70 text-sm font-extralight`}>
                                {domainData.verification[0].value}
                              </span>

                              {hasCopied.includes(domainData.verification[0].value) ? (
                                <CheckIcon className='h-4 w-4 shrink-0 text-green-400 opacity-0 transition-opacity duration-150 group-hover:opacity-100' />
                              ) : (
                                <ClipboardList className='text-foreground/70 h-4 w-4 shrink-0 opacity-0 transition-opacity duration-150 group-hover:opacity-100' />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Note */}
                      <Label className='text-foreground/80 cursor-text select-text text-sm font-light'>
                        Warning: If{' '}
                        <span
                          className={`${fontMono.variable} bg-background font-monospace rounded px-1 py-0.5`}>
                          {domainData.apexName}
                        </span>{' '}
                        is already in use, the TXT Record will transfer away from the existing domain
                        ownership and break the site. Consider using a subdomain instead.
                      </Label>
                    </div>
                  ) : null}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          ) : null}
        </CardContent>
        <CardFooter className='flex flex-row gap-2'>
          {!domainData?.name && domain !== projectConfig.custom_domain ? (
            <Button
              variant='default'
              className='w-32'
              onClick={handleSubmitDomain}
              disabled={
                domain === projectConfig.custom_domain ||
                !domain ||
                domain === domainData?.name ||
                !/(?:https?:\/\/)?(?:[a-zA-Z0-9_-]+\.)+[a-zA-Z]{2,}(?::\d{1,5})?(?:\/\S*)?/i.test(domain) ||
                domainStatus === 'requesting'
              }>
              Save domain
            </Button>
          ) : (
            <Button
              variant='destructive'
              className=''
              onClick={handleRemoveDomain}
              disabled={domainStatus === 'requesting'}>
              Remove domain
            </Button>
          )}

          {domainStatus === 'requesting' && (
            <Icons.Spinner className='text-foreground/70 h-5 w-5 animate-spin' />
          )}
        </CardFooter>
      </Card>

      {/* API Access Card */}
      <Card className='flex w-full flex-col'>
        <CardHeader>
          <CardTitle>API Access</CardTitle>
          <CardDescription>Configure your project&apos;s API access.</CardDescription>
        </CardHeader>
        {apiKeys?.length !== 0 && !isLoading && (
          <CardContent>
            {/* Top Row */}
            <div className='bg-background flex w-full max-w-xs flex-row items-center justify-between rounded-md border border-b px-3 py-1.5'>
              <span className='text-foreground/70 w-full max-w-[100px] text-xs'>Name</span>

              <span className='text-foreground/70 w-full max-w-[120px] text-xs'>Token</span>

              <span className='text-foreground/70 w-full max-w-[80px] text-xs'>Permissions</span>

              <span className='text-foreground/70 w-full max-w-[10px] text-xs' />
            </div>

            {apiKeys?.map((apiKey) => (
              <div
                className='flex max-w-xs flex-row items-center justify-between rounded-md px-3.5 py-1.5'
                key={apiKey.id}>
                <span className='text-foreground/90 w-full max-w-[100px] text-sm font-light'>
                  {apiKey.name}
                </span>

                <div className='flex w-full max-w-[120px]'>
                  <span className='text-foreground/70 bg-background line-clamp-1 w-[80px] rounded py-0.5 pl-1.5 pr-1 text-xs font-light'>
                    {/* Replace last 2 characters with new line so it line clamps  */}
                    {`${apiKey.short_token.slice(0, -1)}\n${apiKey.short_token.slice(-1)}`}
                  </span>
                </div>
                {/* Permissions */}
                <span className='text-foreground/90 w-full max-w-[80px] text-sm font-light'>
                  {apiKey.permission === 'full_access' ? 'Full Access' : 'Public Only'}
                </span>

                <div className='-mr-2 flex flex-row items-center space-x-2'>
                  {/* Actions */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant='secondary'
                        size='icon'
                        className='text-foreground/50 hover:text-foreground h-7 w-4'>
                        <MoreVertical className='h-4 w-4' />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align='end'>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem
                            className='text-destructive focus:text-destructive/90 focus:bg-destructive/20'
                            onSelect={(event) => {
                              event.preventDefault();
                            }}>
                            Revoke
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently make your API key invalid
                              and you will not be able to use it anymore.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className='bg-destructive hover:bg-destructive/90 dark:text-foreground'
                              onClick={() => {
                                handleRevokeApiKey(apiKey);
                              }}>
                              Yes, revoke
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </CardContent>
        )}
        <CardFooter>
          <AddApiKeyDialog
            projectSlug={project.slug}
            disabled={isLoading || (apiKeys && apiKeys.length >= 3)}
            mutateKeys={mutate}>
            <DefaultTooltip
              content='Due to security reasons, you can only have up to 3 API keys per project.'
              disabled={!(apiKeys && apiKeys.length >= 3)}>
              <div className='flex flex-row items-center space-x-2'>
                <Button
                  variant='default'
                  className='w-32'
                  disabled={isLoading || (apiKeys && apiKeys.length >= 3)}>
                  Generate key
                </Button>

                {isLoading ? <Icons.Spinner className='text-foreground/70 h-5 w-5 animate-spin' /> : null}
              </div>
            </DefaultTooltip>
          </AddApiKeyDialog>
        </CardFooter>
      </Card>

      {/* Export / Import data */}
      <Card className='flex w-full flex-col '>
        <CardHeader>
          <CardTitle>Export</CardTitle>
          <CardDescription>Export all your project&apos;s data in a CSV file.</CardDescription>
        </CardHeader>
        <CardContent className='flex flex-row space-x-4'>
          <Button
            variant='outline'
            onClick={handleExportFeedback}
            className='text-foreground/70 w-fit font-light'>
            <Download className='mr-2 h-4 w-4' />
            Export data
          </Button>
        </CardContent>
      </Card>

      {/* Delete Project Card */}
      <Card className='hover:border-destructive flex w-full flex-col transition-colors duration-300'>
        <CardHeader>
          <CardTitle>Danger Zone</CardTitle>
          <CardDescription>Delete your project and all of its data.</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Delete Project */}
          <div className='flex h-full w-full flex-col space-y-4'>
            <div className='space-y-1'>
              <div className='flex h-10 w-full flex-row space-x-2'>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant='destructive' className='w-32'>
                      Delete project
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete your project and remove all
                        your data from our servers.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        className='bg-destructive hover:bg-destructive/90 dark:text-foreground'
                        onClick={handleDeleteProject}>
                        Yes, delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
