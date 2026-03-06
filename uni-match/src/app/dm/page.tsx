'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { getDMConversations, getOrCreateConversation, type DBConversation } from '@/lib/supabase/queries';
import { createClient } from '@/lib/supabase/client';
import styles from './page.module.css';

function DMPageInner() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [conversations, setConversations] = useState<DBConversation[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    useEffect(() => {
        const init = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }
            setCurrentUserId(user.id);

            // ?user=<userId> クエリパラメータがあれば会話を開始してリダイレクト
            const targetUserId = searchParams.get('user');
            if (targetUserId && targetUserId !== user.id) {
                const conv = await getOrCreateConversation(targetUserId);
                if (conv) {
                    router.replace(`/dm/${conv.id}`);
                    return;
                }
            }

            const convs = await getDMConversations();
            setConversations(convs);
            setLoading(false);
        };
        init();
    }, [router, searchParams]);

    if (loading) {
        return (
            <div className={styles.dmPage}>
                <div className={styles.loadingWrap}>
                    <div className={styles.spinner} />
                    <p>読み込み中...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.dmPage}>
            <div className={styles.container}>
                <div className={styles.pageHeader}>
                    <h1 className={styles.pageTitle}>💬 ダイレクトメッセージ</h1>
                    <p className={styles.pageSubtitle}>他のユーザーと1対1でメッセージをやり取りできます</p>
                </div>

                {conversations.length === 0 ? (
                    <div className={`${styles.emptyState} glass-card`}>
                        <span className={styles.emptyIcon}>💬</span>
                        <h2 className={styles.emptyTitle}>まだ会話がありません</h2>
                        <p className={styles.emptyDesc}>
                            他のユーザーのプロフィールページから「DMを送る」ボタンで会話を開始できます
                        </p>
                        <Link href="/board" className="btn btn-primary">
                            掲示板を見る
                        </Link>
                    </div>
                ) : (
                    <div className={styles.conversationList}>
                        {conversations.map((conv) => {
                            const other = conv.other_user;
                            const lastMsg = conv.last_message;
                            const unread = conv.unread_count || 0;
                            const isOwnLastMsg = lastMsg?.sender_id === currentUserId;

                            return (
                                <Link
                                    key={conv.id}
                                    href={`/dm/${conv.id}`}
                                    className={`${styles.convItem} ${unread > 0 ? styles.convItemUnread : ''}`}
                                >
                                    <div className={styles.convAvatar}>
                                        {other?.avatar || '👤'}
                                    </div>
                                    <div className={styles.convBody}>
                                        <div className={styles.convTop}>
                                            <span className={styles.convName}>{other?.name || '不明なユーザー'}</span>
                                            {lastMsg && (
                                                <span className={styles.convTime}>
                                                    {formatTime(lastMsg.created_at)}
                                                </span>
                                            )}
                                        </div>
                                        <div className={styles.convBottom}>
                                            <span className={`${styles.convPreview} ${unread > 0 && !isOwnLastMsg ? styles.convPreviewBold : ''}`}>
                                                {lastMsg
                                                    ? `${isOwnLastMsg ? 'あなた: ' : ''}${lastMsg.content}`
                                                    : 'メッセージを送ってみましょう'}
                                            </span>
                                            {unread > 0 && (
                                                <span className={styles.unreadBadge}>{unread}</span>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

export default function DMPage() {
    return (
        <Suspense fallback={
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
                <div style={{ width: 40, height: 40, border: '3px solid #333', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            </div>
        }>
            <DMPageInner />
        </Suspense>
    );
}

function formatTime(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'たった今';
    if (diffMins < 60) return `${diffMins}分前`;
    if (diffHours < 24) return `${diffHours}時間前`;
    if (diffDays < 7) return `${diffDays}日前`;
    return date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' });
}


