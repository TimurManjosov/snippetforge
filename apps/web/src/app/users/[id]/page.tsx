import { getUserProfile, getUserStats } from '@/lib/users-api';
import { UserAvatar } from '@/components/users/user-avatar';
import { UserStatsBadges } from '@/components/users/user-stats-badges';
import Link from 'next/link';
import { notFound } from 'next/navigation';

type UserProfilePageProps = {
  params: Promise<{ id: string }>;
};

export default async function UserProfilePage({ params }: UserProfilePageProps) {
  const { id } = await params;

  let profile, stats;

  try {
    [profile, stats] = await Promise.all([getUserProfile(id), getUserStats(id)]);
  } catch {
    notFound();
  }

  const name = profile!.displayName || profile!.username;

  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: 16 }}>
      <header style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        <UserAvatar
          username={profile!.username}
          displayName={profile!.displayName}
          avatarUrl={profile!.avatarUrl}
          size={72}
        />
        <div>
          <h1 style={{ margin: 0 }}>{name}</h1>
          <div style={{ opacity: 0.8 }}>@{profile!.username}</div>
          {profile!.websiteUrl && (
            <div style={{ marginTop: 6 }}>
              <a
                href={profile!.websiteUrl}
                target="_blank"
                rel="noreferrer noopener"
              >
                {profile!.websiteUrl}
              </a>
            </div>
          )}
        </div>
      </header>

      {profile!.bio && (
        <section style={{ marginTop: 16 }}>
          <p>{profile!.bio}</p>
        </section>
      )}

      <section style={{ marginTop: 16 }}>
        <h2 style={{ marginBottom: 8 }}>Stats</h2>
        <UserStatsBadges stats={stats!} />
      </section>

      <section style={{ marginTop: 16 }}>
        <Link href="/snippets">← Browse all snippets</Link>
        {/* TODO (Commit 29): Ersetzen durch /snippets?author={profile.id} sobald author-Filter existiert */}
      </section>
    </main>
  );
}
