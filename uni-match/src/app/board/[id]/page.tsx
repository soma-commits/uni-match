'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { getPostById, applyToPost, type DBSkill } from '@/lib/supabase/queries';
import { createClient } from '@/lib/supabase/client';
import styles from './page.module.css';

interface PostDetail {
    id: string;
    title: string;
    description: string;
    category: string;
    max_members: number;
    current_members: number;
    status: string;
    created_at: string;
    author: {
        id: string;
        name: string;
        university: string;
        faculty: string;
        year: number;
        bio: string;
        avatar: string;
        skills: DBSkill[];
    };
    required_skills: DBSkill[];
    tags: string[];
    applications_count: number;
}

export default function PostDetailPage() {
    const params = useParams();
    const [post, setPost] = useState<PostDetail | null>(null);
    const [applied, setApplied] = useState(false);
    const [loading, setLoading] = useState(true);
    const [applying, setApplying] = useState(false);

    useEffect(() => {
        const fetchPost = async () => {
            const data = await getPostById(params.id as string);
            setPost(data as PostDetail | null);
            setLoading(false);
        };
        fetchPost();
    }, [params.id]);

    const handleApply = async () => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            window.location.href = '/login';
            return;
        }

        setApplying(true);
        try {
            await applyToPost(params.id as string);
            setApplied(true);
        } catch (err) {
            console.error('Application error:', err);
            alert('応募に失敗しました。すでに応募済みの可能性があります。');
        } finally {
            setApplying(false);
        }
    };

    if (loading) {
        return (
            <div className={styles.detailPage}>
                <div className={styles.notFound}>
                    <span className={styles.notFoundIcon}>⏳</span>
                    <h2>読み込み中...</h2>
                </div>
            </div>
        );
    }

    if (!post) {
        return (
            <div className={styles.detailPage}>
                <div className={styles.notFound}>
                    <span className={styles.notFoundIcon}>🔍</span>
                    <h2>投稿が見つかりませんでした</h2>
                    <Link href="/board" className="btn btn-secondary" style={{ marginTop: '1rem' }}>
                        掲示板に戻る
                    </Link>
                </div>
            </div>
        );
    }

    const memberPercent = (post.current_members / post.max_members) * 100;

    return (
        <div className={styles.detailPage}>
            <Link href="/board" className={styles.backLink}>
                ← 掲示板に戻る
            </Link>

            <div className={`${styles.mainCard} glass-card`}>
                <div className={styles.cardHeader}>
                    <span className={styles.categoryBadge}>{post.category}</span>
                    <span className={`${styles.statusBadge} ${styles.statusRecruiting}`}>
                        🟢 募集中
                    </span>
                </div>

                <h1 className={styles.title}>{post.title}</h1>

                <div className={styles.meta}>
                    <span className={styles.metaItem}>📅 {new Date(post.created_at).toLocaleDateString('ja-JP')}</span>
                    <span className={styles.metaItem}>👥 {post.current_members}/{post.max_members}人</span>
                    <span className={styles.metaItem}>💬 {post.applications_count}件の応募</span>
                </div>

                <div className={styles.description}>{post.description}</div>

                <div className={styles.section}>
                    <h3 className={styles.sectionTitle}>求めるスキル</h3>
                    <div className={styles.skills}>
                        {post.required_skills.map((skill) => (
                            <span key={skill.id} className="skill-tag" data-category={skill.category}>
                                {skill.name}
                            </span>
                        ))}
                    </div>
                </div>

                {post.tags.length > 0 && (
                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>タグ</h3>
                        <div className={styles.tags}>
                            {post.tags.map((tag) => (
                                <span key={tag} className={styles.tag}>#{tag}</span>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Author Card */}
            <div className={`${styles.authorCard} glass-card`}>
                <h3 className={styles.sectionTitle}>投稿者</h3>
                <div className={styles.authorHeader}>
                    <Link href={`/profile/${post.author.id}`} className={styles.authorAvatar}>
                        {post.author.avatar}
                    </Link>
                    <div className={styles.authorInfo}>
                        <Link href={`/profile/${post.author.id}`} className={styles.authorName}>
                            {post.author.name}
                        </Link>
                        <span className={styles.authorUni}>
                            {post.author.university} {post.author.faculty} {post.author.year}年
                        </span>
                    </div>
                </div>
                <p className={styles.authorBio}>{post.author.bio}</p>
                <div style={{ marginTop: 'var(--spacing-md)' }}>
                    <div className={styles.skills}>
                        {post.author.skills.map((skill) => (
                            <span key={skill.id} className="skill-tag" data-category={skill.category}>
                                {skill.name}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Apply Section */}
            <div className={`${styles.applySection} glass-card`}>
                <h3 className={styles.applyTitle}>このプロジェクトに参加する</h3>
                <p className={styles.applyDesc}>興味があれば、チームへの参加を申請しましょう</p>

                <div className={styles.memberProgress}>
                    <span className={styles.progressLabel}>
                        メンバー: {post.current_members} / {post.max_members}人
                    </span>
                    <div className={styles.progressBar}>
                        <div className={styles.progressFill} style={{ width: `${memberPercent}%` }} />
                    </div>
                </div>

                {applied ? (
                    <div className={styles.appliedMessage}>
                        ✅ 参加申請を送信しました！投稿者からの連絡をお待ちください。
                    </div>
                ) : (
                    <button
                        className="btn btn-primary btn-lg"
                        onClick={handleApply}
                        disabled={applying}
                    >
                        {applying ? '送信中...' : '🙋 チームに参加したい！'}
                    </button>
                )}
            </div>
        </div>
    );
}
