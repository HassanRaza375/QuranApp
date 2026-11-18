// Admin panel, view only: every user, for a signed-in super admin and nobody else. A request without a session gets 401; a session that is not a super admin
// gets 404 (the route's existence is not confirmed). It returns counts and usage, never anything a user synced.
import { getQuery } from "h3";
import { useDb } from "../../utils/db";
import { apiHandler, requireSuperAdmin } from "../../utils/session";

export default apiHandler(async (event) => {
  await requireSuperAdmin(event);
  const q = getQuery(event);
  const perPage = Math.max(1, Math.min(Number(q.perPage) || 50, 100));
  const page = Math.max(1, Number(q.page) || 1);
  const db = useDb();
  const [total, users] = await Promise.all([
    db.user.count(),
    db.user.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        role: true,
        avatarPublicId: true,
        createdAt: true,
        accounts: { select: { providerId: true } },
        syncCursor: { select: { bytes: true } },
        _count: { select: { sessions: true, syncRecords: true } },
      },
    }),
  ]);
  return {
    total,
    page,
    perPage,
    users: users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      emailVerified: u.emailVerified,
      role: u.role,
      hasPhoto: Boolean(u.avatarPublicId),
      createdAt: u.createdAt.toISOString(),
      providers: [...new Set(u.accounts.map((a) => a.providerId))],
      sessions: u._count.sessions,
      syncRecords: u._count.syncRecords,
      syncBytes: u.syncCursor?.bytes ?? 0,
    })),
  };
});
