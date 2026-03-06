'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { getPostComments, addPostComment, deletePostComment, createNotification, type DBPostComment, type DBProfile } from '@/lib/supabase/queries';
import styles from './ThreadedComments.module.css';

interface ThreadedCommentsProps {
    postId: string;
    postAuthorId: string;
}

// コメントをツリー構造に変換するための型
interface CommentNode extends DBPostComment {
    replies: CommentNode[];
}

export default function ThreadedComments({ postId, postAuthorId }: ThreadedCommentsProps) {
    const [comments, setComments] = useState<CommentNode[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [newComment, setNewComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [contextMenu, setContextMenu] = useState<{
        visible: boolean;
        x: number;
        y: number;
        commentId: string | null;
        canDelete: boolean;
    }>({ visible: false, x: 0, y: 0, commentId: null, canDelete: false });

    useEffect(() => {
        const handleClick = () => setContextMenu({ visible: false, x: 0, y: 0, commentId: null, canDelete: false });
        document.addEventListener('click', handleClick);
        return () => document.removeEventListener('click', handleClick);
    }, []);

    useEffect(() => {
        const init = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            setCurrentUser(user);
            await fetchComments();
        };
        init();
    }, [postId]);

    const fetchComments = async () => {
        try {
            const rawComments = await getPostComments(postId);
            setComments(buildCommentTree(rawComments));
        } catch (err) {
            console.error('Failed to fetch comments:', err);
        } finally {
            setLoading(false);
        }
    };

    // フラットな配列をツリー構造に変換
    const buildCommentTree = (comments: DBPostComment[]): CommentNode[] => {
        const commentMap = new Map<string, CommentNode>();
        const roots: CommentNode[] = [];

        comments.forEach(c => {
            commentMap.set(c.id, { ...c, replies: [] });
        });

        comments.forEach(c => {
            const node = commentMap.get(c.id)!;
            if (c.parent_id && commentMap.has(c.parent_id)) {
                commentMap.get(c.parent_id)!.replies.push(node);
            } else {
                roots.push(node);
            }
        });

        return roots;
    };

    const handleSubmit = async (parentId: string | null = null) => {
        if (!newComment.trim()) return;
        setSubmitting(true);
        try {
            const addedComment = await addPostComment(postId, newComment, parentId || undefined);

            // 通知の送信設定
            let notifyUserId = parentId ? null : postAuthorId; // デフォルトは投稿者

            // 返信の場合、返信先のユーザーを特定
            if (parentId) {
                // 返信先を探すヘルパー
                const findParentAuthor = (nodes: CommentNode[], pId: string): string | null => {
                    for (const n of nodes) {
                        if (n.id === pId) return n.author_id;
                        const found = findParentAuthor(n.replies, pId);
                        if (found) return found;
                    }
                    return null;
                };
                notifyUserId = findParentAuthor(comments, parentId);
            }

            // 自分以外のユーザーへのアクションなら通知を作成
            if (notifyUserId && notifyUserId !== currentUser?.id) {
                await createNotification({
                    user_id: notifyUserId,
                    type: parentId ? 'reply' : 'comment',
                    title: parentId ? 'あなたのコメントに返信がつきました' : 'あなたの投稿にコメントがつきました',
                    message: newComment.length > 50 ? newComment.substring(0, 50) + '...' : newComment,
                    link: `/board/${postId}#comments`
                });
            }

            setNewComment('');
            setReplyingTo(null);
            await fetchComments();
        } catch (err) {
            console.error('Failed to add comment:', err);
            alert('コメントの送信に失敗しました。');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (commentId: string) => {
        if (!confirm('コメントを削除しますか？返信もすべて削除されます。')) return;
        try {
            await deletePostComment(commentId);
            await fetchComments();
        } catch (err) {
            console.error('Failed to delete comment:', err);
            alert('削除に失敗しました。');
        }
    };

    // 再帰的にコメントを描画するコンポーネント
    const CommentThread = ({ node, level = 0 }: { node: CommentNode; level?: number }) => {
        const isAuthor = currentUser?.id === node.author_id;
        const isPostAuthor = currentUser?.id === postAuthorId;

        return (
            <div className={styles.commentNode} style={{ marginLeft: level > 0 ? '40px' : 0 }}>
                {level > 0 && <div className={styles.threadLine} />}

                <div
                    className={styles.commentContent}
                    onContextMenu={(e) => {
                        if (currentUser) {
                            e.preventDefault();
                            setContextMenu({
                                visible: true,
                                x: e.clientX,
                                y: e.clientY,
                                commentId: node.id,
                                canDelete: isAuthor || isPostAuthor
                            });
                        }
                    }}
                >
                    <div className={styles.commentHeader}>
                        <Link href={`/profile/${node.author?.id}`} className={styles.authorAvatar}>
                            {node.author?.avatar}
                        </Link>
                        <div className={styles.authorInfo}>
                            <Link href={`/profile/${node.author?.id}`} className={styles.authorName}>
                                {node.author?.name}
                                {node.author_id === postAuthorId && <span className={styles.opBadge}>OP</span>}
                            </Link>
                            <span className={styles.commentDate}>
                                {new Date(node.created_at).toLocaleString('ja-JP')}
                            </span>
                        </div>
                    </div>

                    <div className={styles.commentBody}>{node.content}</div>
                </div>

                {node.replies.length > 0 && (
                    <div className={styles.replies}>
                        {node.replies.map(reply => (
                            <CommentThread key={reply.id} node={reply} level={level + 1} />
                        ))}
                    </div>
                )}
            </div>
        );
    };

    if (loading) return <div className={styles.loading}>コメントを読み込み中...</div>;

    return (
        <div className={styles.container} id="comments">
            <h3 className={styles.title}>💬 コメントと質問 ({comments.reduce((acc, curr) => acc + 1 + countReplies(curr), 0)}件)</h3>

            <div className={styles.threadContainer}>
                {comments.length === 0 ? (
                    <p className={styles.noComments}>まだコメントはありません。最初のコメントを書き込みましょう！</p>
                ) : (
                    comments.map(node => (
                        <CommentThread key={node.id} node={node} />
                    ))
                )}
            </div>

            {/* Custom Context Menu */}
            {contextMenu.visible && contextMenu.commentId && (
                <div
                    className={styles.contextMenu}
                    style={{
                        top: contextMenu.y,
                        left: contextMenu.x,
                    }}
                >
                    <button
                        className={styles.contextMenuBtn}
                        onClick={() => {
                            setReplyingTo(contextMenu.commentId);
                            setTimeout(() => {
                                document.getElementById('fixed-comment-input')?.focus();
                            }, 0);
                        }}
                    >
                        ↳ 返信する
                    </button>
                    {contextMenu.canDelete && (
                        <button
                            className={`${styles.contextMenuBtn} ${styles.contextMenuBtnDanger}`}
                            onClick={() => handleDelete(contextMenu.commentId!)}
                        >
                            🗑 削除
                        </button>
                    )}
                </div>
            )}

            {/* Input Bar Fixed Bottom */}
            {currentUser ? (
                <div className={styles.fixedInputBar}>
                    <div className={styles.fixedInputContainer}>
                        {replyingTo && (
                            <div className={styles.replyingToIndicator}>
                                <span>返信モード</span>
                                <button className={styles.cancelReplyBtn} onClick={() => setReplyingTo(null)}>×</button>
                            </div>
                        )}
                        <div className={styles.inputInner}>
                            <textarea
                                id="fixed-comment-input"
                                className={`form-input ${styles.fixedTextarea}`}
                                rows={1}
                                placeholder={replyingTo !== null ? "返信を入力..." : "チャンネルにメッセージを送信..."}
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSubmit(replyingTo);
                                    }
                                }}
                            />
                            <button
                                className={styles.fixedSubmitBtn}
                                onClick={() => handleSubmit(replyingTo)}
                                disabled={submitting || !newComment.trim()}
                            >
                                {submitting ? '...' : '送信'}
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className={styles.fixedInputBar}>
                    <div className={styles.fixedInputContainer} style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: '12px' }}>
                        <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>コメントするにはログインが必要です</p>
                        <Link href="/login" className="btn btn-primary btn-sm" style={{ marginLeft: '1rem' }}>ログイン</Link>
                    </div>
                </div>
            )}
        </div>
    );
}

function countReplies(node: CommentNode): number {
    return node.replies.reduce((acc, curr) => acc + 1 + countReplies(curr), 0);
}
