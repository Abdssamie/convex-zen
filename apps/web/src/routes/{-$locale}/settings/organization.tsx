import { Badge } from "@convex-zen/ui/components/badge";
import { Button } from "@convex-zen/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@convex-zen/ui/components/card";
import { Input } from "@convex-zen/ui/components/input";
import { Label } from "@convex-zen/ui/components/label";
import { Textarea } from "@convex-zen/ui/components/textarea";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { BaseLayout } from "@/components/layouts/base-layout";
import { authClient } from "@/lib/auth-client";
import { slugifyOrganizationName, useOrganizationState } from "@/lib/organization";

export const Route = createFileRoute("/{-$locale}/settings/organization")({
  beforeLoad: ({ context, location }) => {
    if (!context.isAuthenticated) {
      throw redirect({
        to: "/{-$locale}/sign-in",
        params: { locale: location.pathname.split("/")[1] || "en" },
        search: {
          redirectTo: location.href,
        },
      });
    }
  },
  component: RouteComponent,
});

function getAuthErrorMessage(error: { error: { message?: string; statusText?: string } }) {
  return error.error.message || error.error.statusText || "Organization action failed";
}

function formatDate(value: Date | string) {
  return new Date(value).toLocaleDateString();
}

function RouteComponent() {
  const session = authClient.useSession();
  const currentUserId = session.data?.user?.id;
  const { activeOrganization, organizations, isLoading, error } = useOrganizationState();

  const [createName, setCreateName] = useState("");
  const [createSlug, setCreateSlug] = useState("");
  const [createLogo, setCreateLogo] = useState("");

  const [updateName, setUpdateName] = useState("");
  const [updateSlug, setUpdateSlug] = useState("");
  const [updateLogo, setUpdateLogo] = useState("");
  const [updateMetadata, setUpdateMetadata] = useState("");

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"member" | "admin" | "owner">("member");

  useEffect(() => {
    setUpdateName(activeOrganization?.name ?? "");
    setUpdateSlug(activeOrganization?.slug ?? "");
    setUpdateLogo(activeOrganization?.logo ?? "");
    setUpdateMetadata(
      activeOrganization?.metadata == null
        ? ""
        : JSON.stringify(activeOrganization.metadata, null, 2),
    );
  }, [activeOrganization]);

  return (
    <BaseLayout
      title="Organization"
      description="Create workspaces, switch active organization, invite teammates, and manage roles."
    >
      <div className="grid gap-6 px-4 lg:px-6">
        {error ? (
          <Card>
            <CardHeader>
              <CardTitle>Organization sync issue</CardTitle>
              <CardDescription>{error}</CardDescription>
            </CardHeader>
          </Card>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>Create organization</CardTitle>
            <CardDescription>
              Every verified user can create a workspace. Invitations go through Better Auth and
              Brevo.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="create-org-name">Organization name</Label>
              <Input
                id="create-org-name"
                value={createName}
                onChange={(event) => {
                  const nextName = event.target.value;
                  setCreateName(nextName);
                  if (!createSlug || createSlug === slugifyOrganizationName(createName)) {
                    setCreateSlug(slugifyOrganizationName(nextName));
                  }
                }}
                placeholder="Acme Labs"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-org-slug">Slug</Label>
              <Input
                id="create-org-slug"
                value={createSlug}
                onChange={(event) => setCreateSlug(slugifyOrganizationName(event.target.value))}
                placeholder="acme-labs"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-org-logo">Logo URL</Label>
              <Input
                id="create-org-logo"
                value={createLogo}
                onChange={(event) => setCreateLogo(event.target.value)}
                placeholder="https://example.com/logo.png"
              />
            </div>
            <div className="md:col-span-2">
              <Button
                disabled={isLoading || !createName.trim() || !createSlug.trim()}
                onClick={() => {
                  authClient.organization.create(
                    {
                      name: createName.trim(),
                      slug: createSlug.trim(),
                      logo: createLogo.trim() || undefined,
                    },
                    {
                      onSuccess: () => {
                        setCreateName("");
                        setCreateSlug("");
                        setCreateLogo("");
                        toast.success("Organization created");
                      },
                      onError: (error) => {
                        toast.error(getAuthErrorMessage(error));
                      },
                    },
                  );
                }}
              >
                Create organization
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Organizations</CardTitle>
            <CardDescription>
              Switch active workspace for dashboard and member management.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {organizations.length ? (
              organizations.map((organization) => {
                const isActive = organization.id === activeOrganization?.id;

                return (
                  <div
                    key={organization.id}
                    className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{organization.name}</p>
                        {isActive ? <Badge>Active</Badge> : null}
                      </div>
                      <p className="text-muted-foreground text-sm">{organization.slug}</p>
                      <p className="text-muted-foreground text-xs">
                        Created {formatDate(organization.createdAt)}
                      </p>
                    </div>
                    <Button
                      variant={isActive ? "secondary" : "outline"}
                      disabled={isActive}
                      onClick={() => {
                        authClient.organization.setActive(
                          { organizationId: organization.id },
                          {
                            onSuccess: () => {
                              toast.success(`${organization.name} is now active`);
                            },
                            onError: (error) => {
                              toast.error(getAuthErrorMessage(error));
                            },
                          },
                        );
                      }}
                    >
                      {isActive ? "Current organization" : "Set active"}
                    </Button>
                  </div>
                );
              })
            ) : (
              <p className="text-muted-foreground text-sm">No organizations yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active organization</CardTitle>
            <CardDescription>
              Update workspace details used across invitations and dashboard context.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            {activeOrganization ? (
              <>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="update-org-name">Organization name</Label>
                  <Input
                    id="update-org-name"
                    value={updateName}
                    onChange={(event) => setUpdateName(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="update-org-slug">Slug</Label>
                  <Input
                    id="update-org-slug"
                    value={updateSlug}
                    onChange={(event) => setUpdateSlug(slugifyOrganizationName(event.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="update-org-logo">Logo URL</Label>
                  <Input
                    id="update-org-logo"
                    value={updateLogo}
                    onChange={(event) => setUpdateLogo(event.target.value)}
                    placeholder="https://example.com/logo.png"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="update-org-metadata">Metadata JSON</Label>
                  <Textarea
                    id="update-org-metadata"
                    value={updateMetadata}
                    onChange={(event) => setUpdateMetadata(event.target.value)}
                    rows={6}
                    placeholder='{"plan":"pro"}'
                  />
                </div>
                <div className="md:col-span-2 flex flex-wrap gap-3">
                  <Button
                    onClick={() => {
                      let metadata: Record<string, unknown> | undefined;

                      if (updateMetadata.trim()) {
                        try {
                          metadata = JSON.parse(updateMetadata) as Record<string, unknown>;
                        } catch {
                          toast.error("Metadata must be valid JSON");
                          return;
                        }
                      }

                      authClient.organization.update(
                        {
                          organizationId: activeOrganization.id,
                          data: {
                            name: updateName.trim(),
                            slug: updateSlug.trim(),
                            logo: updateLogo.trim() || undefined,
                            metadata,
                          },
                        },
                        {
                          onSuccess: () => {
                            toast.success("Organization updated");
                          },
                          onError: (error) => {
                            toast.error(getAuthErrorMessage(error));
                          },
                        },
                      );
                    }}
                  >
                    Save changes
                  </Button>
                  <Badge variant="secondary">{activeOrganization.slug}</Badge>
                </div>
              </>
            ) : (
              <p className="text-muted-foreground text-sm md:col-span-2">
                Pick or create an organization to manage it here.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Invite members</CardTitle>
            <CardDescription>
              Invitation emails use Brevo and Better Auth invitation links.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="invite-email">Email</Label>
              <Input
                id="invite-email"
                type="email"
                value={inviteEmail}
                onChange={(event) => setInviteEmail(event.target.value)}
                placeholder="teammate@example.com"
                disabled={!activeOrganization}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-role">Role</Label>
              <select
                id="invite-role"
                className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs focus-visible:ring-1 focus-visible:outline-hidden"
                value={inviteRole}
                onChange={(event) =>
                  setInviteRole(event.target.value as "member" | "admin" | "owner")
                }
                disabled={!activeOrganization}
              >
                <option value="member">Member</option>
                <option value="admin">Admin</option>
                <option value="owner">Owner</option>
              </select>
            </div>
            <div className="md:col-span-3">
              <Button
                disabled={!activeOrganization || !inviteEmail.trim()}
                onClick={() => {
                  if (!activeOrganization) {
                    return;
                  }

                  authClient.organization.inviteMember(
                    {
                      email: inviteEmail.trim().toLowerCase(),
                      role: inviteRole,
                      organizationId: activeOrganization.id,
                      resend: true,
                    },
                    {
                      onSuccess: () => {
                        setInviteEmail("");
                        setInviteRole("member");
                        toast.success("Invitation sent");
                      },
                      onError: (error) => {
                        toast.error(getAuthErrorMessage(error));
                      },
                    },
                  );
                }}
              >
                Send invitation
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pending invitations</CardTitle>
            <CardDescription>Track outstanding invites and cancel stale ones.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {activeOrganization?.invitations.length ? (
              activeOrganization.invitations.map((invitation) => (
                <div
                  key={invitation.id}
                  className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{invitation.email}</p>
                      <Badge variant={invitation.status === "pending" ? "default" : "secondary"}>
                        {invitation.status}
                      </Badge>
                      <Badge variant="outline">{invitation.role}</Badge>
                    </div>
                    <p className="text-muted-foreground text-xs">
                      Expires {formatDate(invitation.expiresAt)}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => {
                      authClient.organization.cancelInvitation(
                        { invitationId: invitation.id },
                        {
                          onSuccess: () => {
                            toast.success("Invitation canceled");
                          },
                          onError: (error) => {
                            toast.error(getAuthErrorMessage(error));
                          },
                        },
                      );
                    }}
                  >
                    Cancel invitation
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-sm">
                No invitations for active organization.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Members</CardTitle>
            <CardDescription>
              Review roles and remove members from active workspace.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {activeOrganization?.members.length ? (
              activeOrganization.members.map((member) => {
                const isCurrentUser = member.userId === currentUserId;

                return (
                  <div
                    key={member.id}
                    className="flex flex-col gap-3 rounded-lg border p-4 lg:flex-row lg:items-center lg:justify-between"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">
                          {member.user?.name ?? member.user?.email ?? member.userId}
                        </p>
                        <Badge variant="outline">{member.role}</Badge>
                        {isCurrentUser ? <Badge>You</Badge> : null}
                      </div>
                      <p className="text-muted-foreground text-sm">
                        {member.user?.email ?? "No email"}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <select
                        className="border-input bg-background ring-offset-background placeholder:text-muted-foreground flex h-9 rounded-md border px-3 py-1 text-sm shadow-xs focus-visible:ring-1 focus-visible:outline-hidden"
                        defaultValue={member.role}
                        disabled={isCurrentUser || !activeOrganization}
                        onChange={(event) => {
                          if (!activeOrganization) {
                            return;
                          }

                          authClient.organization.updateMemberRole(
                            {
                              memberId: member.id,
                              organizationId: activeOrganization.id,
                              role: event.target.value,
                            },
                            {
                              onSuccess: () => {
                                toast.success("Role updated");
                              },
                              onError: (error) => {
                                toast.error(getAuthErrorMessage(error));
                              },
                            },
                          );
                        }}
                      >
                        <option value="member">Member</option>
                        <option value="admin">Admin</option>
                        <option value="owner">Owner</option>
                      </select>
                      <Button
                        variant="outline"
                        disabled={isCurrentUser || !activeOrganization}
                        onClick={() => {
                          if (!activeOrganization) {
                            return;
                          }

                          authClient.organization.removeMember(
                            {
                              memberIdOrEmail: member.id,
                              organizationId: activeOrganization.id,
                            },
                            {
                              onSuccess: () => {
                                toast.success("Member removed");
                              },
                              onError: (error) => {
                                toast.error(getAuthErrorMessage(error));
                              },
                            },
                          );
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-muted-foreground text-sm">No members for active organization.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </BaseLayout>
  );
}
