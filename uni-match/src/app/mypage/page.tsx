'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { getProfile, getUserPosts, getMyApplications, type DBSkill } from '@/lib/supabase/queries';
import styles from './page.module.css';

interface ProfileData {
    id: string;
    name: string;
    university: string;
    faculty: string;
    year: number;
    avatar: string;
    skills: DBSkill[];
}

interface PostData {
    id: string;
    title: string;
    created_at: string;
    max_members: number;
    current_members: number;
    required_skills: DBSkill[];
    applications_count: number;
}

interface ApplicationData {
    id: string;
    status: string;
    created_at: string;
    post: {
        id: string;
        title: string;
        created_at: string;
    } | null;
}

export default function MyPage() {
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [myPosts, setMyPosts] = useState<PostData[]>([]);
    const [myApplications, setMyApplications] = useState<ApplicationData[]>([]);
    const [activeTab, setActiveTab] = useState<'posts' | 'applied'>('posts');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                setLoading(false);
                return;
            }

            const [profileData, postsData, appsData] = await Promise.all([
                getProfile(user.id),
                getUserPosts(user.id),
                getMyApplications(),
            ]);

            setProfile(profileData as ProfileData | null);
            setMyPosts(postsData as PostData[]);
            setMyApplications(appsData as ApplicationData[]);
            setLoading(false);
        };
        fetchData();
    }, []);

    if (loading) {
        return (
            <div className={styles.myPage}>
                <div className={styles.emptyState}>
                    <span className={styles.emptyIcon}>⏳</span>
                    <p>読み込み中...</p>
                </div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className={styles.myPage}>
                <div className={styles.loginPrompt}>
                    <h2 className={styles.loginPromptTitle}>ログインが必要です</h2>
                    <p className={styles.loginPromptDesc}>マイページを表示するにはログインしてください</p>
                    <Link href="/login" className="btn btn-primary btn-lg">
                        ログインする →
                    </Link>
                </div>
            </div>
        );
    }

    const totalApplications = myPosts.reduce((sum, p) => sum + (p.applications_count || 0), 0);

    return (
        <div className={styles.myPage}>
            <div className={styles.pageHeader}>
                <h1 className={styles.pageTitle}>📊 マイページ</h1>
                <Link href="/board/new" className="btn btn-primary">
                    ＋ 新規投稿
                </Link>
            </div>

            {/* Profile Summary */}
            <div className={`${styles.profileSummary} glass-card`}>
                <div className={styles.avatar}>{profile.avatar}</div>
                <div className={styles.profileInfo}>
                    <h2 className={styles.profileName}>{profile.name}</h2>
                    <span className={styles.profileUni}>{profile.university} {profile.faculty} {profile.year}年</span>
                    <div className={styles.profileSkills}>
                        {profile.skills.map((skill) => (
                            <span key={skill.id} className="skill-tag" data-category={skill.category}>
                                {skill.name}
                            </span>
                        ))}
                    </div>
                </div>
                <Link href="/mypage/edit" className="btn btn-secondary">
                    ✏️ プロフィール編集
                </Link>
            </div>

            {/* Stats */}
            <div className={styles.statsGrid}>
                <div className={`${styles.statCard} glass-card`}>
                    <div className={styles.statValue}>{myPosts.length}</div>
                    <div className={styles.statLabel}>投稿数</div>
                </div>
                <div className={`${styles.statCard} glass-card`}>
                    <div className={styles.statValue}>{totalApplications}</div>
                    <div className={styles.statLabel}>受けた応募数</div>
                </div>
                <div className={`${styles.statCard} glass-card`}>
                    <div className={styles.statValue}>{profile.skills.length}</div>
                    <div className={styles.statLabel}>登録スキル数</div>
                </div>
            </div>

            {/* Tabs */}
            <div className={styles.tabs}>
                <button
                    className={`${styles.tabBtn} ${activeTab === 'posts' ? styles.tabBtnActive : ''}`}
                    onClick={() => setActiveTab('posts')}
                >
                    📋 自分の投稿
                </button>
                <button
                    className={`${styles.tabBtn} ${activeTab === 'applied' ? styles.tabBtnActive : ''}`}
                    onClick={() => setActiveTab('applied')}
                >
                    🙋 応募した投稿
                </button>
            </div>

            {/* Posts Tab */}
            {activeTab === 'posts' && (
                <div className={styles.postList}>
                    {myPosts.length === 0 ? (
                        <div className={styles.emptyState}>
                            <span className={styles.emptyIcon}>📝</span>
                            <p>まだ投稿がありません</p>
                            <Link href="/board/new" className="btn btn-primary" style={{ marginTop: '1rem' }}>
                                最初の投稿を作成する
                            </Link>
                        </div>
                    ) : (
                        myPosts.map((post) => (
                            <Link href={`/board/${post.id}`} key={post.id} className={`${styles.postItem} glass-card`}>
                                <div className={styles.postItemContent}>
                                    <span className={styles.postItemTitle}>{post.title}</span>
                                    <div className={styles.postItemMeta}>
                                        <span>📅 {new Date(post.created_at).toLocaleDateString('ja-JP')}</span>
                                        <span>👥 {post.current_members}/{post.max_members}人</span>
                                        <span>💬 {post.applications_count || 0}件の応募</span>
                                    </div>
                                    <div className={styles.postItemSkills}>
                                        {post.required_skills.map((skill) => (
                                            <span key={skill.id} className="skill-tag" data-category={skill.category}>
                                                {skill.name}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </Link>
                        ))
                    )}
                </div>
            )}

            {/* Applications Tab */}
            {activeTab === 'applied' && (
                <div className={styles.postList}>
                    {myApplications.length === 0 ? (
                        <div className={styles.emptyState}>
                            <span className={styles.emptyIcon}>🙋</span>
                            <p>まだ応募した投稿はありません</p>
                            <Link href="/board" className="btn btn-secondary" style={{ marginTop: '1rem' }}>
                                掲示板を見る
                            </Link>
                        </div>
                    ) : (
                        myApplications.map((app) => (
                            app.post && (
                                <Link href={`/board/${app.post.id}`} key={app.id} className={`${styles.postItem} glass-card`}>
                                    <div className={styles.postItemContent}>
                                        <div className={styles.postItemTitleRow}>
                                            <span className={styles.postItemTitle}>{app.post.title}</span>
                                            <span className={`${styles.statusBadge} ${styles[`status_${app.status}`]}`}>
                                                {app.status === 'pending' && '⏳ 審査中'}
                                                {app.status === 'accepted' && '✅ 承認済'}
                                                {app.status === 'rejected' && '❌ 不承認'}
                                            </span>
                                        </div>
                                        <div className={styles.postItemMeta}>
                                            <span>📅 応募日: {new Date(app.created_at).toLocaleDateString('ja-JP')}</span>
                                        </div>
                                    </div>
                                </Link>
                            )
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
