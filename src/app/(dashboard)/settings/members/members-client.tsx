"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n/context";
import { Users, Plus, Trash2, ShieldAlert, Loader2, MailCheck } from "lucide-react";

interface Member {
  id: string;
  profile_id: string;
  role: string;
  created_at: string;
  profiles: {
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

interface Invitation {
  id: string;
  email: string;
  role: string;
  status: string;
  expires_at: string;
  created_at: string;
}

interface MembersClientProps {
  members: Member[];
  invitations: Invitation[];
  userRole: string;
  userId: string;
  orgId: string;
  emailsMap: Record<string, string>; // Maps profile_id to email for listing
}

export function MembersClient({
  members: initialMembers,
  invitations: initialInvitations,
  userRole,
  userId,
  orgId,
  emailsMap,
}: MembersClientProps) {
  const router = useRouter();
  const { t } = useI18n();
  const supabase = createClient();

  const [members, setMembers] = useState(initialMembers);
  const [invitations, setInvitations] = useState(initialInvitations);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Invite form inputs
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");

  const isOwner = userRole === "owner";
  const isAdmin = userRole === "admin";
  const canManage = isOwner || isAdmin;

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage || !inviteEmail.trim()) return;

    setError(null);
    setLoading(true);

    try {
      const token = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiration

      const { data: inv, error: invErr } = await supabase
        .from("organization_invitations")
        .insert({
          organization_id: orgId,
          email: inviteEmail,
          role: inviteRole,
          token,
          status: "pending",
          invited_by: userId,
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();

      if (invErr) {
        setError(invErr.message);
      } else if (inv) {
        setInvitations([...invitations, inv]);
        setInviteEmail("");
      }
    } catch (err: any) {
      setError(err.message || "Error al invitar miembro");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (memberId: string, profileId: string, newRole: string) => {
    if (!canManage || profileId === userId) return;

    // If transferring ownership, check constraints
    if (newRole === "owner" && !isOwner) {
      alert("Sólo el propietario de la organización puede transferir la propiedad.");
      return;
    }

    if (newRole === "owner" && isOwner) {
      if (!confirm("Al transferir la propiedad, perderás el control absoluto de la organización. Tu rol se degradará a administrador. ¿Deseas continuar?")) {
        return;
      }

      // 1. Demote current owner to admin
      const currentOwnerMember = members.find((m) => m.profile_id === userId);
      if (currentOwnerMember) {
        await supabase
          .from("organization_members")
          .update({ role: "admin" })
          .eq("id", currentOwnerMember.id);
      }

      // 2. Set new owner on organization record
      await supabase
        .from("organizations")
        .update({ owner_id: profileId })
        .eq("id", orgId);

      // 3. Promote new member to owner
      await supabase
        .from("organization_members")
        .update({ role: "owner" })
        .eq("id", memberId);

      router.refresh();
      return;
    }

    const { error: roleErr } = await supabase
      .from("organization_members")
      .update({ role: newRole })
      .eq("id", memberId);

    if (!roleErr) {
      setMembers(
        members.map((m) => (m.id === memberId ? { ...m, role: newRole } : m))
      );
    } else {
      alert("Error al actualizar rol: " + roleErr.message);
    }
  };

  const handleRemoveMember = async (memberId: string, profileId: string) => {
    if (!canManage || profileId === userId) return;

    if (!confirm("¿Estás seguro de que quieres eliminar a este miembro de la organización?")) {
      return;
    }

    const { error: removeErr } = await supabase
      .from("organization_members")
      .delete()
      .eq("id", memberId);

    if (!removeErr) {
      setMembers(members.filter((m) => m.id !== memberId));
    } else {
      alert("Error al remover miembro: " + removeErr.message);
    }
  };

  const handleCancelInvite = async (inviteId: string) => {
    if (!canManage) return;

    const { error: cancelErr } = await supabase
      .from("organization_invitations")
      .delete()
      .eq("id", inviteId);

    if (!cancelErr) {
      setInvitations(invitations.filter((i) => i.id !== inviteId));
    }
  };

  return (
    <div className="space-y-6 text-xs font-semibold text-neutral-700 dark:text-neutral-350">
      <div>
        <h2 className="text-lg font-bold text-neutral-800 dark:text-neutral-100 flex items-center gap-2">
          <Users size={18} className="text-neutral-400" />
          {t("nav.members")}
        </h2>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
          Administra los roles, invitaciones y accesos de los miembros de tu equipo.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Members List */}
        <div className="md:col-span-2 space-y-4">
          <h3 className="text-sm font-bold text-neutral-850 dark:text-neutral-250">Miembros del equipo</h3>
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-neutral-50 dark:bg-neutral-850/50 border-b border-neutral-250 dark:border-neutral-800 text-neutral-500 font-semibold uppercase tracking-wider">
                    <th className="p-3">Nombre</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Rol</th>
                    <th className="p-3 w-12">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 text-neutral-700 dark:text-neutral-300">
                  {members.map((m) => {
                    const isSelf = m.profile_id === userId;
                    const memberEmail = emailsMap[m.profile_id] || "—";
                    return (
                      <tr key={m.id}>
                        <td className="p-3 font-bold">{m.profiles?.display_name} {isSelf && "(Tú)"}</td>
                        <td className="p-3">{memberEmail}</td>
                        <td className="p-3">
                          {isSelf || !canManage ? (
                            <span className="capitalize">{m.role}</span>
                          ) : (
                            <select
                              value={m.role}
                              onChange={(e) => handleRoleChange(m.id, m.profile_id, e.target.value)}
                              className="px-2 py-1 border border-neutral-300 dark:border-neutral-750 bg-white dark:bg-neutral-850 rounded text-xs"
                            >
                              <option value="viewer">Viewer</option>
                              <option value="member">Member</option>
                              <option value="admin">Admin</option>
                              {isOwner && <option value="owner">Owner (Transferir)</option>}
                            </select>
                          )}
                        </td>
                        <td className="p-3">
                          {!isSelf && canManage && m.role !== "owner" && (
                            <button
                              onClick={() => handleRemoveMember(m.id, m.profile_id)}
                              className="text-red-500 hover:text-red-700 cursor-pointer"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pending Invitations list */}
          {invitations.length > 0 && (
            <div className="space-y-3 pt-4">
              <h3 className="text-sm font-bold text-neutral-850 dark:text-neutral-250 flex items-center gap-2">
                <MailCheck size={16} className="text-neutral-400" />
                Invitaciones pendientes
              </h3>
              <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden shadow-2xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-neutral-50 dark:bg-neutral-850/50 border-b border-neutral-200 dark:border-neutral-800 text-neutral-500 font-semibold uppercase tracking-wider">
                      <th className="p-3">Email</th>
                      <th className="p-3">Rol</th>
                      <th className="p-3">Vence</th>
                      <th className="p-3 w-12"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 text-neutral-700 dark:text-neutral-300">
                    {invitations.map((i) => (
                      <tr key={i.id}>
                        <td className="p-3 font-semibold">{i.email}</td>
                        <td className="p-3 capitalize">{i.role}</td>
                        <td className="p-3 text-neutral-450">
                          {new Date(i.expires_at).toLocaleDateString()}
                        </td>
                        <td className="p-3">
                          {canManage && (
                            <button
                              onClick={() => handleCancelInvite(i.id)}
                              className="text-neutral-400 hover:text-red-650 cursor-pointer"
                            >
                              Cancelar
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Invite Member Form */}
        {canManage && (
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-5 rounded-2xl shadow-2xs h-fit space-y-4">
            <h3 className="text-sm font-bold text-neutral-850 dark:text-neutral-200 flex items-center gap-2">
              <Plus size={16} className="text-indigo-500" />
              Invitar Miembro
            </h3>

            {error && (
              <div className="p-3 text-red-650 dark:text-red-450 bg-red-50 dark:bg-red-950/20 border border-red-200 rounded-lg">
                {error}
              </div>
            )}

            <form onSubmit={handleInvite} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label>Correo electrónico del invitado</label>
                <input
                  type="email"
                  required
                  placeholder="miembro@ejemplo.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  disabled={loading}
                  className="px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 focus:outline-none text-neutral-800 dark:text-neutral-200"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label>Rol asignado</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  disabled={loading}
                  className="px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 focus:outline-none text-neutral-800 dark:text-neutral-200"
                >
                  <option value="viewer">Viewer (Sólo consulta)</option>
                  <option value="member">Member (Operación completa)</option>
                  <option value="admin">Admin (Administrador)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading || !inviteEmail.trim()}
                className="w-full flex items-center justify-center gap-2 py-2 bg-indigo-650 hover:bg-indigo-700 text-white rounded-lg font-bold transition-colors cursor-pointer"
              >
                {loading ? <Loader2 className="animate-spin" size={14} /> : "Enviar Invitación"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
