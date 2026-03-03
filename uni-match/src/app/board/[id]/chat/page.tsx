'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { getMessages, sendMessage, getPostById } from '@/lib/supabase/queries';
import { createClient } from '@/lib/supabase/client';
import styles from './page.module.css';

interface Message {
    id: string;
    post_id: string;
    sender_id: string;
    content: string;
    created_at: string;
    sender?: {
        id: string;
        name: string;
        avatar: string;
    };
}

interface PostInfo {
    id: string;
    title: string;
    category: string;
    author: { id: string; name: string };
}

export default function ChatPage() {
    const params = useParams();
    const router = useRouter();
    const postId = params.id as string;

    const [messages, setMessages] = useState<Message[]>([]);
    const [postInfo, setPostInfo] = useState<PostInfo | null>(null);
    const [newMessage, setNewMessage] = useState('');
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const scrollToBottom = useCallback((smooth = true) => {
        messagesEndRef.current?.scrollIntoView({
            behavior: smooth ? 'smooth' : 'instant',
        });
    }, []);

    // 初期データ取得 & 認証チェック
    useEffect(() => {
        const init = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                router.push('/login');
                return;
            }

            setCurrentUserId(user.id);

            const [postData, messagesData] = await Promise.all([
                getPostById(postId),
                getMessages(postId),
            ]);

            if (!postData) {
                router.push('/board');
                return;
            }

            setPostInfo(postData as unknown as PostInfo);
            setMessages(messagesData as Message[]);
            setLoading(false);
        };

        init();
    }, [postId, router]);

    // 初期ロード後にスクロール
    useEffect(() => {
        if (!loading && messages.length > 0) {
            scrollToBottom(false);
        }
    }, [loading, scrollToBottom, messages.length]);

    // Supabase Realtime サブスクリプション
    useEffect(() => {
        if (loading) return;

        const supabase = createClient();

        const channel = supabase
            .channel(`chat:${postId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `post_id=eq.${postId}`,
                },
                async (payload) => {
                    // 送信者情報を取得
                    const { data: sender } = await supabase
                        .from('profiles')
                        .select('id, name, avatar')
                        .eq('id', payload.new.sender_id)
                        .single();

                    const newMsg: Message = {
                        ...payload.new as Message,
                        sender: sender || undefined,
                    };

                    setMessages((prev) => {
                        // 重複チェック
                        if (prev.some((m) => m.id === newMsg.id)) return prev;
                        return [...prev, newMsg];
                    });

                    // 少し遅延させてスクロール
                    setTimeout(() => scrollToBottom(), 100);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [postId, loading, scrollToBottom]);

    const handleSend = async () => {
        const content = newMessage.trim();
        if (!content || sending) return;

        setSending(true);
        try {
            await sendMessage(postId, content);
            setNewMessage('');

            // テキストエリアの高さをリセット
            if (textareaRef.current) {
                textareaRef.current.style.height = 'auto';
            }
        } catch (err) {
            console.error('Send message error:', err);
            alert('メッセージの送信に失敗しました。');
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

    const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setNewMessage(e.target.value);
        // 自動リサイズ
        const textarea = e.target;
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    };

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
    };

    const formatDateSeparator = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const shouldShowDateSeparator = (current: Message, previous?: Message) => {
        if (!previous) return true;
        const currentDate = new Date(current.created_at).toDateString();
        const previousDate = new Date(previous.created_at).toDateString();
        return currentDate !== previousDate;
    };

    if (loading) {
        return (
            <div className={styles.chatPage}>
                <div className={styles.loadingState}>
                    <span className={styles.loadingIcon}>💬</span>
                    <p>チャットを読み込み中...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.chatPage}>
            {/* ヘッダー */}
            <div className={styles.chatHeader}>
                <Link href={`/board/${postId}`} className={styles.backBtn}>
                    ←
                </Link>
                <div className={styles.headerInfo}>
                    <h1 className={styles.headerTitle}>{postInfo?.title}</h1>
                    <span className={styles.headerCategory}>{postInfo?.category}</span>
                </div>
                <div className={styles.headerOnline}>
                    <span className={styles.onlineDot} />
                    リアルタイム
                </div>
            </div>

            {/* メッセージエリア */}
            <div className={styles.messagesContainer} ref={messagesContainerRef}>
                {messages.length === 0 ? (
                    <div className={styles.emptyChat}>
                        <span className={styles.emptyChatIcon}>🚀</span>
                        <h3>チャットを始めましょう！</h3>
                        <p>チームメンバーにメッセージを送信して、プロジェクトの議論を開始しましょう。</p>
                    </div>
                ) : (
                    messages.map((msg, index) => {
                        const isOwn = msg.sender_id === currentUserId;
                        const showDate = shouldShowDateSeparator(msg, messages[index - 1]);
                        const showAvatar =
                            !isOwn &&
                            (index === 0 ||
                                messages[index - 1]?.sender_id !== msg.sender_id ||
                                showDate);

                        return (
                            <div key={msg.id}>
                                {showDate && (
                                    <div className={styles.dateSeparator}>
                                        <span>{formatDateSeparator(msg.created_at)}</span>
                                    </div>
                                )}
                                <div
                                    className={`${styles.messageRow} ${isOwn ? styles.messageRowOwn : styles.messageRowOther}`}
                                >
                                    {!isOwn && (
                                        <div className={styles.avatarColumn}>
                                            {showAvatar ? (
                                                <Link
                                                    href={`/profile/${msg.sender?.id}`}
                                                    className={styles.messageAvatar}
                                                    title={msg.sender?.name}
                                                >
                                                    {msg.sender?.avatar || '🧑‍💻'}
                                                </Link>
                                            ) : (
                                                <div className={styles.avatarSpacer} />
                                            )}
                                        </div>
                                    )}
                                    <div className={`${styles.messageBubbleWrap} ${isOwn ? styles.bubbleWrapOwn : styles.bubbleWrapOther}`}>
                                        {showAvatar && !isOwn && (
                                            <span className={styles.senderName}>{msg.sender?.name}</span>
                                        )}
                                        <div className={`${styles.messageBubble} ${isOwn ? styles.bubbleOwn : styles.bubbleOther}`}>
                                            <p className={styles.messageText}>{msg.content}</p>
                                        </div>
                                        <span className={`${styles.messageTime} ${isOwn ? styles.timeOwn : styles.timeOther}`}>
                                            {formatTime(msg.created_at)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* 入力エリア */}
            <div className={styles.inputArea}>
                <div className={styles.inputWrapper}>
                    <textarea
                        ref={textareaRef}
                        className={styles.messageInput}
                        placeholder="メッセージを入力..."
                        value={newMessage}
                        onChange={handleTextareaInput}
                        onKeyDown={handleKeyDown}
                        rows={1}
                        disabled={sending}
                    />
                    <button
                        className={styles.sendBtn}
                        onClick={handleSend}
                        disabled={!newMessage.trim() || sending}
                        title="送信"
                    >
                        {sending ? (
                            <span className={styles.sendingSpinner}>⏳</span>
                        ) : (
                            <span>🚀</span>
                        )}
                    </button>
                </div>
                <p className={styles.inputHint}>Enter で送信 · Shift + Enter で改行</p>
            </div>
        </div>
    );
}
