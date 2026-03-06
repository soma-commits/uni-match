'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { getPostById, applyToPost, updatePostStatus, deletePost, createNotification, type DBSkill } from '@/lib/supabase/queries';
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
    const router = useRouter();
    const [post, setPost] = useState<PostDetail | null>(null);
    const [applied, setApplied] = useState(false);
    const [loading, setLoading] = useState(true);
    const [applying, setApplying] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [toggling, setToggling] = useState(false);
    const [applyMessage, setApplyMessage] = useState('');
    const [deleting, setDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        const fetchPost = async () => {
            const supabaseClient = createClient();
            const { data: { user } } = await supabaseClient.auth.getUser();
            if (user) setCurrentUserId(user.id);

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
            await applyToPost(params.id as string, applyMessage);
            setApplied(true);
            // 投稿者に通知を送信
            if (post) {
                await createNotification({
                    user_id: post.author.id,
                    type: 'application_received',
                    title: '新しい参加申請',
                    message: `「${post.title}」に新しい参加申請があります`,
                    link: `/board/${post.id}/applications`,
                });
            }
        } catch (err) {
            console.error('Application error:', err);
            alert('応募に失敗しました。すでに応募済みの可能性があります。');
        } finally {
            setApplying(false);
        }
    };

    const handleDelete = async () => {
        setShowDeleteConfirm(false);
        setDeleting(true);
        try {
            await deletePost(params.id as string);
            router.push('/board');
        } catch (err) {
            console.error('Delete error:', err);
            alert('削除に失敗しました。');
            setDeleting(false);
        }
    };

    const handleToggleStatus = async () => {
        if (!post) return;
        setToggling(true);
        try {
            const newStatus = post.status === 'closed' ? 'recruiting' : 'closed';
            await updatePostStatus(post.id, newStatus);
            setPost({ ...post, status: newStatus });
        } catch (err) {
            console.error('Status toggle error:', err);
            alert('ステータスの変更に失敗しました。');
        } finally {
            setToggling(false);
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
        <div className={styles.layoutWrapper}>
            <div className={styles.mainContent}>
                <div className={styles.mainHeader}>
                    <Link href="/board" className={styles.backLink}>
                        ← 掲示板に戻る
                    </Link>
                    <button className={styles.sidebarToggleBtn} onClick={() => setIsSidebarOpen(true)}>
                        ℹ️ プロジェクト詳細
                    </button>
                </div>

                <div className={styles.threadArea}>
                    <div className={styles.threadHeader}>
                        <div className={styles.threadHeaderTop}>
                            <h1 className={styles.title}>{post.title}</h1>
                            <span className={`${styles.statusBadge} ${post.status === 'closed' ? styles.statusClosed : styles.statusRecruiting}`}>
                                {post.status === 'closed' ? '🔴 募集終了' : '🟢 募集中'}
                            </span>
                        </div>
                        <div className={styles.meta}>
                            <span className={styles.metaItem}>📅 {new Date(post.created_at).toLocaleDateString('ja-JP')}</span>
                            <span className={styles.metaItem}>👥 {post.current_members}/{post.max_members}人</span>
                            <span className={styles.metaItem}>💬 {post.applications_count}件の応募</span>
                        </div>
                    </div>


                </div>
            </div>

            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div className={styles.sidebarOverlay} onClick={() => setIsSidebarOpen(false)} />
            )}

            <div className={`${styles.sidebar} ${isSidebarOpen ? styles.sidebarOpen : ''}`}>
                <div className={styles.sidebarHeader}>
                    <h3 className={styles.sidebarTitle}>📌 プロジェクト詳細</h3>
                    <button className={styles.sidebarCloseBtn} onClick={() => setIsSidebarOpen(false)}>×</button>
                </div>

                <div className={styles.sidebarScrollArea}>
                    {/* Compact Action Bar */}
                    <div className={styles.actionBar}>

                        {currentUserId === post.author.id && (
                            <>
                                <Link href={`/board/${post.id}/applications`} className={styles.actionBtn}>
                                    📋 申請管理
                                    {post.applications_count > 0 && (
                                        <span className={styles.actionBadge}>{post.applications_count}</span>
                                    )}
                                </Link>
                                <button
                                    className={styles.actionBtn}
                                    onClick={handleToggleStatus}
                                    disabled={toggling}
                                >
                                    {toggling ? '⏳' : post.status === 'closed' ? '🟢 募集再開' : '🔴 募集終了'}
                                </button>
                                <Link href={`/board/${post.id}/edit`} className={styles.actionBtn}>
                                    ✏️ 編集
                                </Link>
                                <button
                                    className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                                    onClick={() => setShowDeleteConfirm(true)}
                                    disabled={deleting}
                                >
                                    {deleting ? '...' : '🗑 削除'}
                                </button>
                            </>
                        )}
                    </div>

                    <div className={`${styles.mainCard} glass-card`}>
                        <div className={styles.cardHeader}>
                            <span className={styles.categoryBadge}>{post.category}</span>
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
                        <div className={styles.authorInfo}>
                            <Link href={`/profile/${post.author.id}`} className={styles.authorAvatarLink}>
                                <span className={styles.authorAvatar}>{post.author.avatar}</span>
                            </Link>
                            <div className={styles.authorMeta}>
                                <Link href={`/profile/${post.author.id}`} className={styles.authorName}>
                                    {post.author.name}
                                </Link>
                                <span className={styles.authorUni}>
                                    {post.author.university} {post.author.faculty} {post.author.year}年
                                </span>
                            </div>
                        </div>
                        <p className={styles.authorBio}>{post.author.bio}</p>
                    </div>

                    {/* Apply Section */}
                    <div className={`${styles.applySection} glass-card`}>
                        <h3 className={styles.applyTitle}>チームに参加する</h3>

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
                                ✅ 申請を送信しました
                            </div>
                        ) : (
                            <>
                                <div className="form-group" style={{ marginBottom: 'var(--spacing-md)' }}>
                                    <textarea
                                        id="apply-message"
                                        className="form-input"
                                        placeholder="自己PRや参加動機を送信..."
                                        value={applyMessage}
                                        onChange={(e) => setApplyMessage(e.target.value)}
                                        rows={2}
                                        style={{ resize: 'none', fontSize: '0.875rem' }}
                                    />
                                </div>
                                <button
                                    className="btn btn-primary"
                                    onClick={handleApply}
                                    disabled={applying}
                                    style={{ width: '100%', fontSize: '0.875rem', padding: '0.5rem' }}
                                >
                                    {applying ? '送信中...' : '参加を申請'}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Delete Confirm Modal */}
            {showDeleteConfirm && (
                <div className={styles.modalOverlay} onClick={() => setShowDeleteConfirm(false)}>
                    <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
                        <h3 className={styles.modalTitle}>⚠️ 投稿を削除しますか？</h3>
                        <p className={styles.modalDesc}>この操作は取り消せません。関連する申請やコメントもすべて削除されます。</p>
                        <div className={styles.modalActions}>
                            <button className="btn btn-secondary" onClick={() => setShowDeleteConfirm(false)}>キャンセル</button>
                            <button className={styles.modalDeleteBtn} onClick={handleDelete}>🗑 削除する</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
