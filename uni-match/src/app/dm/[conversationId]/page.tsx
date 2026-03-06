'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
    getDMMessages,
    sendDM,
    markDMsRead,
    type DBDirectMessage,
    type DBProfile,
} from '@/lib/supabase/queries';
import { createClient } from '@/lib/supabase/client';
import styles from './page.module.css';

export default function DMChatPage() {
    const params = useParams();
    const router = useRouter();
    const conversationId = params.conversationId as string;

    const [messages, setMessages] = useState<DBDirectMessage[]>([]);
    const [otherUser, setOtherUser] = useState<DBProfile | null>(null);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = useCallback(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    useEffect(() => {
        const init = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }
            setCurrentUserId(user.id);

            // 会話の相手情報を取得
            const { data: conv } = await supabase
                .from('dm_conversations')
                .select(`
                    *,
                    user1:profiles!dm_conversations_user1_id_fkey(id, name, avatar, university, faculty, year),
                    user2:profiles!dm_conversations_user2_id_fkey(id, name, avatar, university, faculty, year)
                `)
                .eq('id', conversationId)
                .single();

            if (!conv) {
                router.push('/dm');
                return;
            }

            const other = conv.user1_id === user.id ? conv.user2 : conv.user1;
            setOtherUser(other as DBProfile);

            // メッセージ取得
            const msgs = await getDMMessages(conversationId);
            setMessages(msgs);
            setLoading(false);

            // 既読にする
            await markDMsRead(conversationId);

            // Realtime購読
            const channel = supabase
                .channel(`dm-${conversationId}`)
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'direct_messages',
                        filter: `conversation_id=eq.${conversationId}`,
                    },
                    async (payload) => {
                        const newMsg = payload.new as DBDirectMessage;
                        // 送信者プロフィールを補完
                        const { data: sender } = await supabase
                            .from('profiles')
                            .select('id, name, avatar, university, faculty, year, bio, created_at, updated_at')
                            .eq('id', newMsg.sender_id)
                            .single();
                        setMessages((prev) => [...prev, { ...newMsg, sender: (sender || undefined) as DBProfile | undefined }]);
                        // 相手のメッセージなら既読に
                        if (newMsg.sender_id !== user.id) {
                            markDMsRead(conversationId);
                        }
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        };

        const cleanup = init();
        return () => {
            cleanup.then((fn) => fn?.());
        };
    }, [conversationId, router]);

    // メッセージが増えたらスクロール
    useEffect(() => {
        if (!loading) scrollToBottom();
    }, [messages, loading, scrollToBottom]);

    const handleSend = async () => {
        if (!input.trim() || sending) return;
        const content = input.trim();
        setInput('');
        setSending(true);
        try {
            await sendDM(conversationId, content);
        } catch (err) {
            console.error('Send DM error:', err);
            setInput(content);
        } finally {
            setSending(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    if (loading) {
        return (
            <div className={styles.chatPage}>
                <div className={styles.loadingWrap}>
                    <div className={styles.spinner} />
                </div>
            </div>
        );
    }

    return (
        <div className={styles.chatPage}>
            {/* Header */}
            <div className={styles.chatHeader}>
                <Link href="/dm" className={styles.backBtn}>←</Link>
                <div className={styles.chatHeaderInfo}>
                    <span className={styles.chatAvatar}>{otherUser?.avatar || '👤'}</span>
                    <div>
                        <Link href={`/profile/${otherUser?.id}`} className={styles.chatName}>
                            {otherUser?.name || '不明なユーザー'}
                        </Link>
                        {otherUser?.university && (
                            <p className={styles.chatUni}>{otherUser.university}</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div className={styles.messageArea}>
                {messages.length === 0 ? (
                    <div className={styles.noMessages}>
                        <span>💬</span>
                        <p>まだメッセージがありません<br />最初のメッセージを送ってみましょう！</p>
                    </div>
                ) : (
                    <>
                        {messages.map((msg, i) => {
                            const isMine = msg.sender_id === currentUserId;
                            const showDate = i === 0 || !isSameDay(messages[i - 1].created_at, msg.created_at);
                            return (
                                <div key={msg.id}>
                                    {showDate && (
                                        <div className={styles.dateDivider}>
                                            <span>{formatDate(msg.created_at)}</span>
                                        </div>
                                    )}
                                    <div className={`${styles.msgRow} ${isMine ? styles.msgRowMine : styles.msgRowOther}`}>
                                        {!isMine && (
                                            <span className={styles.msgAvatar}>
                                                {msg.sender?.avatar || '👤'}
                                            </span>
                                        )}
                                        <div className={styles.msgBubbleWrap}>
                                            <div className={`${styles.msgBubble} ${isMine ? styles.msgBubbleMine : styles.msgBubbleOther}`}>
                                                {msg.content}
                                            </div>
                                            <span className={`${styles.msgTime} ${isMine ? styles.msgTimeMine : ''}`}>
                                                {formatTime(msg.created_at)}
                                                {isMine && (
                                                    <span className={styles.readStatus}>
                                                        {msg.is_read ? ' ✓✓' : ' ✓'}
                                                    </span>
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </>
                )}
                <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className={styles.inputArea}>
                <textarea
                    className={styles.inputBox}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="メッセージを入力... (Enterで送信、Shift+Enterで改行)"
                    rows={1}
                    disabled={sending}
                />
                <button
                    className={styles.sendBtn}
                    onClick={handleSend}
                    disabled={!input.trim() || sending}
                    aria-label="送信"
                >
                    {sending ? '⌛' : '➤'}
                </button>
            </div>
        </div>
    );
}

function isSameDay(a: string, b: string) {
    const da = new Date(a);
    const db = new Date(b);
    return da.toDateString() === db.toDateString();
}

function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);
    if (diffDays === 0) return '今日';
    if (diffDays === 1) return '昨日';
    return date.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' });
}

function formatTime(dateStr: string): string {
    return new Date(dateStr).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
}
