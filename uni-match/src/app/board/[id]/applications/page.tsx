'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { getPostById, getPostApplications, updateApplicationStatus, createNotification, type DBSkill } from '@/lib/supabase/queries';
import { createClient } from '@/lib/supabase/client';
import styles from './page.module.css';

interface Applicant {
    id: string;
    name: string;
    university: string;
    faculty: string;
    year: number;
    bio: string;
    avatar: string;
    skills: DBSkill[];
}

interface Application {
    id: string;
    post_id: string;
    applicant_id: string;
    message: string;
    status: 'pending' | 'accepted' | 'rejected';
    created_at: string;
    applicant: Applicant | null;
}

interface PostInfo {
    id: string;
    title: string;
    category: string;
    author_id: string;
}

export default function ApplicationsPage() {
    const params = useParams();
    const router = useRouter();
    const postId = params.id as string;

    const [applications, setApplications] = useState<Application[]>([]);
    const [postInfo, setPostInfo] = useState<PostInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState<string | null>(null);

    useEffect(() => {
        const init = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                router.push('/login');
                return;
            }

            const postData = await getPostById(postId);

            if (!postData) {
                router.push('/board');
                return;
            }

            // 投稿者以外はアクセス不可
            if (postData.author?.id !== user.id) {
                router.push(`/board/${postId}`);
                return;
            }

            setPostInfo(postData as unknown as PostInfo);

            const apps = await getPostApplications(postId);
            setApplications(apps as Application[]);
            setLoading(false);
        };

        init();
    }, [postId, router]);

    const handleUpdateStatus = async (applicationId: string, status: 'accepted' | 'rejected') => {
        setUpdating(applicationId);
        try {
            await updateApplicationStatus(applicationId, status);
            setApplications((prev) =>
                prev.map((app) =>
                    app.id === applicationId ? { ...app, status } : app
                )
            );

            // 申請者に通知を送信
            const app = applications.find((a) => a.id === applicationId);
            if (app?.applicant_id && postInfo) {
                await createNotification({
                    user_id: app.applicant_id,
                    type: status === 'accepted' ? 'application_accepted' : 'application_rejected',
                    title: status === 'accepted' ? '申請が承認されました！' : '申請が拒否されました',
                    message: `「${postInfo.title}」への${status === 'accepted' ? '参加が承認されました' : '申請は残念ながら拒否されました'}`,
                    link: `/board/${postId}`,
                });
            }
        } catch (err) {
            console.error('Update error:', err);
            alert('更新に失敗しました。');
        } finally {
            setUpdating(null);
        }
    };

    const statusLabel = (status: string) => {
        switch (status) {
            case 'pending': return '審査中';
            case 'accepted': return '承認済';
            case 'rejected': return '拒否';
            default: return status;
        }
    };

    const pendingCount = applications.filter((a) => a.status === 'pending').length;
    const acceptedCount = applications.filter((a) => a.status === 'accepted').length;
    const rejectedCount = applications.filter((a) => a.status === 'rejected').length;

    if (loading) {
        return (
            <div className={styles.page}>
                <div className={styles.loadingState}>
                    <span className={styles.loadingIcon}>📋</span>
                    <p>申請一覧を読み込み中...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.page}>
            <Link href={`/board/${postId}`} className={styles.backLink}>
                ← 投稿に戻る
            </Link>

            {/* Header */}
            <div className={styles.pageHeader}>
                <div>
                    <h1 className={styles.pageTitle}>📋 申請管理</h1>
                    <p className={styles.pageSubtitle}>{postInfo?.title}</p>
                </div>
            </div>

            {/* Stats */}
            <div className={styles.statsRow}>
                <div className={`${styles.statCard} glass-card`}>
                    <span className={styles.statValue}>{applications.length}</span>
                    <span className={styles.statLabel}>全申請</span>
                </div>
                <div className={`${styles.statCard} glass-card`}>
                    <span className={`${styles.statValue} ${styles.statPending}`}>{pendingCount}</span>
                    <span className={styles.statLabel}>審査中</span>
                </div>
                <div className={`${styles.statCard} glass-card`}>
                    <span className={`${styles.statValue} ${styles.statAccepted}`}>{acceptedCount}</span>
                    <span className={styles.statLabel}>承認済</span>
                </div>
                <div className={`${styles.statCard} glass-card`}>
                    <span className={`${styles.statValue} ${styles.statRejected}`}>{rejectedCount}</span>
                    <span className={styles.statLabel}>拒否</span>
                </div>
            </div>

            {/* Applications List */}
            {applications.length === 0 ? (
                <div className={`${styles.emptyState} glass-card`}>
                    <span className={styles.emptyIcon}>📭</span>
                    <h3>まだ申請がありません</h3>
                    <p>プロジェクトへの参加申請が届くとここに表示されます。</p>
                </div>
            ) : (
                <div className={styles.applicationsList}>
                    {applications.map((app) => (
                        <div key={app.id} className={`${styles.applicationCard} glass-card`}>
                            <div className={styles.cardTop}>
                                <div className={styles.applicantInfo}>
                                    <Link href={`/profile/${app.applicant?.id}`} className={styles.applicantAvatar}>
                                        {app.applicant?.avatar || '🧑‍💻'}
                                    </Link>
                                    <div className={styles.applicantDetails}>
                                        <Link href={`/profile/${app.applicant?.id}`} className={styles.applicantName}>
                                            {app.applicant?.name}
                                        </Link>
                                        <span className={styles.applicantUni}>
                                            {app.applicant?.university} {app.applicant?.faculty} {app.applicant?.year}年
                                        </span>
                                    </div>
                                </div>
                                <span className={`${styles.statusBadge} ${styles[`status_${app.status}`]}`}>
                                    {statusLabel(app.status)}
                                </span>
                            </div>

                            {app.applicant?.bio && (
                                <p className={styles.applicantBio}>{app.applicant.bio}</p>
                            )}

                            {app.applicant?.skills && app.applicant.skills.length > 0 && (
                                <div className={styles.skillsRow}>
                                    {app.applicant.skills.map((skill) => (
                                        <span key={skill.id} className="skill-tag" data-category={skill.category}>
                                            {skill.name}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {app.message && (
                                <div className={styles.messageBox}>
                                    <span className={styles.messageLabel}>💬 メッセージ</span>
                                    <p className={styles.messageText}>{app.message}</p>
                                </div>
                            )}

                            <div className={styles.cardFooter}>
                                <span className={styles.appliedDate}>
                                    📅 {new Date(app.created_at).toLocaleDateString('ja-JP')}
                                </span>

                                {app.status === 'pending' && (
                                    <div className={styles.actionButtons}>
                                        <button
                                            className={`${styles.actionBtn} ${styles.rejectBtn}`}
                                            onClick={() => handleUpdateStatus(app.id, 'rejected')}
                                            disabled={updating === app.id}
                                        >
                                            {updating === app.id ? '...' : '✕ 拒否'}
                                        </button>
                                        <button
                                            className={`${styles.actionBtn} ${styles.acceptBtn}`}
                                            onClick={() => handleUpdateStatus(app.id, 'accepted')}
                                            disabled={updating === app.id}
                                        >
                                            {updating === app.id ? '...' : '✓ 承認'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
