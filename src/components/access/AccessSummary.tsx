"use client";

import { useEffect, useMemo, useState } from "react";

const ROLE_LABELS: Record<string, string> = {
  admin: "Admins",
  operator: "Operators",
  developer: "Developers",
  intern: "Interns",
};

type AccessUser = { id: string; name?: string | null; email: string };

function mentionTokens(text: string) {
  return [...text.matchAll(/@([^\s<>,;:()]+)/g)].map((match) => match[1].toLowerCase());
}

function userMatchesMention(user: AccessUser, tokens: string[]) {
  const email = user.email.toLowerCase();
  const local = email.split("@")[0];
  const name = (user.name ?? "").toLowerCase().replace(/\s+/g, "");
  return tokens.some((token) => token === email || token === local || (name.length > 0 && token === name));
}

export function AccessSummary({
  allowedRoles,
  allowedUsers,
  mentionText = "",
  note = "Mention a user with @email or @name to grant that user access automatically.",
}: {
  allowedRoles?: string[] | null;
  allowedUsers?: AccessUser[] | null;
  mentionText?: string;
  note?: string;
}) {
  const roles = allowedRoles?.length ? allowedRoles : ["admin"];
  const baseUsers = useMemo(() => allowedUsers ?? [], [allowedUsers]);
  const [allUsers, setAllUsers] = useState<AccessUser[]>([]);
  const tokens = useMemo(() => mentionTokens(mentionText), [mentionText]);

  useEffect(() => {
    if (tokens.length === 0) return;
    let cancelled = false;
    fetch("/api/users")
      .then((res) => (res.ok ? res.json() : { users: [] }))
      .then((data) => {
        if (!cancelled) setAllUsers(data.users ?? []);
      })
      .catch(() => {
        if (!cancelled) setAllUsers([]);
      });
    return () => {
      cancelled = true;
    };
  }, [tokens.length]);

  const users = useMemo(() => {
    const mentionedUsers = allUsers.filter((user) => userMatchesMention(user, tokens));
    return [...baseUsers, ...mentionedUsers].filter(
      (user, index, list) => list.findIndex((item) => item.id === user.id) === index
    );
  }, [allUsers, baseUsers, tokens]);

  return (
    <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--secondary))]/30 p-3 text-xs space-y-2">
      <div>
        <p className="font-medium mb-1">Accessible to roles</p>
        <div className="flex flex-wrap gap-1">
          {roles.map((role) => (
            <span key={role} className="px-2 py-0.5 rounded-full bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))]">
              {ROLE_LABELS[role] ?? role}
            </span>
          ))}
        </div>
      </div>
      <div>
        <p className="font-medium mb-1">Specific users</p>
        {users.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {users.map((user) => (
              <span key={user.id} className="px-2 py-0.5 rounded-full bg-[hsl(var(--card))] border border-[hsl(var(--border))]">
                {user.name ?? user.email}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-[hsl(var(--muted-foreground))]">No specific users yet.</p>
        )}
      </div>
      <p className="text-[hsl(var(--muted-foreground))]">{note}</p>
    </div>
  );
}
