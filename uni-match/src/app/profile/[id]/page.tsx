'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { getProfile, getUserPosts, type DBSkill } from '@/lib/supabase/queries';
import { createClient } from '@/lib/supabase/client';
import styles from './page.module.css';

interface ProfileData {
    id: string;
    name: string;
    university: string;
    faculty: string;
    year: number;
    bio: string;
    avatar: string;
    skills: DBSkill[];
}

interface PostData {
    id: string;
    title: string;
    created_at: string;
}

export default function ProfilePage() {
    const params = useParams();
    const router = useRouter();
    const [user, setUser] = useState<ProfileData | null>(null);
    const [userPosts, setUserPosts] = useState<PostData[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [startingDM, setStartingDM] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            const supabase = createClient();
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (authUser) setCurrentUserId(authUser.id);

            const profile = await getProfile(params.id as string);
            setUser(profile as ProfileData | null);

            if (profile) {
                const posts = await getUserPosts(params.id as string);
                setUserPosts(posts as PostData[]);
            }
            setLoading(false);
        };
        fetchData();
    }, [params.id]);

    if (loading) {
        return (
            <div className={styles.profilePage}>
                <div className={styles.notFound}>
                    <span className={styles.notFoundIcon}>⏳</span>
                    <h2>読み込み中...</h2>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className={styles.profilePage}>
                <div className={styles.notFound}>
                    <span className={styles.notFoundIcon}>👤</span>
                    <h2>ユーザーが見つかりませんでした</h2>
                    <Link href="/board" className="btn btn-secondary" style={{ marginTop: '1rem' }}>
                        掲示板に戻る
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.profilePage}>
            <Link href="/board" className={styles.backLink}>
                ← 掲示板に戻る
            </Link>

            <div className={styles.profileCard} style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--spacing-xl)' }}>
                <div className={styles.profileHeader}>
                    <div className={styles.avatar}>{user.avatar}</div>
                    <div className={styles.profileInfo}>
                        <h1 className={styles.name}>{user.name}</h1>
                        <span className={styles.university}>{user.university} {user.faculty}</span>
                        <span className={styles.year}>{user.year}年生</span>
                        {currentUserId && currentUserId !== user.id && (
                            <button
                                className="btn btn-primary"
                                style={{ marginTop: 'var(--spacing-sm)', fontSize: '0.85rem', padding: '0.4rem 1rem' }}
                                disabled={startingDM}
                                onClick={async () => {
                                    setStartingDM(true);
                                    try {
                                        const supabase = createClient();
                                        const authUser = (await supabase.auth.getUser()).data.user;
                                        if (!authUser) { router.push('/login'); return; }
                                        // user1_id < user2_id に正規化
                                        const uid = authUser.id;
                                        const oid = user.id;
                                        const user1_id = uid < oid ? uid : oid;
                                        const user2_id = uid < oid ? oid : uid;
                                        const { data: existing } = await supabase
                                            .from('dm_conversations')
                                            .select('id')
                                            .eq('user1_id', user1_id)
                                            .eq('user2_id', user2_id)
                                            .single();
                                        if (existing) {
                                            router.push(`/dm/${existing.id}`);
                                        } else {
                                            const { data: created } = await supabase
                                                .from('dm_conversations')
                                                .insert({ user1_id, user2_id })
                                                .select('id')
                                                .single();
                                            if (created) router.push(`/dm/${created.id}`);
                                        }
                                    } finally {
                                        setStartingDM(false);
                                    }
                                }}
                            >
                                {startingDM ? '...' : '💬 DMを送る'}
                            </button>
                        )}
                    </div>
                </div>

                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>📝 自己紹介</h2>
                    <p className={styles.bio}>{user.bio || '自己紹介がまだ設定されていません'}</p>
                </div>

                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>💡 スキル</h2>
                    <div className={styles.skills}>
                        {user.skills.length > 0 ? (
                            user.skills.map((skill) => (
                                <span key={skill.id} className="skill-tag" data-category={skill.category}>
                                    {skill.name}
                                </span>
                            ))
                        ) : (
                            <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>
                                スキルがまだ登録されていません
                            </p>
                        )}
                    </div>
                </div>
            </div>

            <div className={`${styles.postsCard} glass-card`}>
                <h2 className={styles.sectionTitle}>📋 投稿したプロジェクト</h2>
                {userPosts.length === 0 ? (
                    <p className={styles.emptyPosts}>まだプロジェクトを投稿していません</p>
                ) : (
                    userPosts.map((post) => (
                        <Link href={`/board/${post.id}`} key={post.id} className={styles.postItem}>
                            <span className={styles.postItemTitle}>{post.title}</span>
                            <span className={styles.postItemMeta}>{new Date(post.created_at).toLocaleDateString('ja-JP')}</span>
                        </Link>
                    ))
                )}
            </div>
        </div>
    );
}
