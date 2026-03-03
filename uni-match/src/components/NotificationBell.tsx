'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { getNotifications, markNotificationsRead, type DBNotification } from '@/lib/supabase/queries';
import styles from './NotificationBell.module.css';

export default function NotificationBell() {
    const [notifications, setNotifications] = useState<DBNotification[]>([]);
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    const unreadCount = notifications.filter((n) => !n.is_read).length;

    useEffect(() => {
        getNotifications().then(setNotifications);

        // ポーリングで30秒ごとに更新
        const interval = setInterval(() => {
            getNotifications().then(setNotifications);
        }, 30000);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleOpen = async () => {
        setOpen(!open);
        if (!open && unreadCount > 0) {
            await markNotificationsRead();
            setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'application_received': return '📩';
            case 'application_accepted': return '✅';
            case 'application_rejected': return '❌';
            case 'new_message': return '💬';
            default: return '🔔';
        }
    };

    const timeAgo = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'たった今';
        if (mins < 60) return `${mins}分前`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours}時間前`;
        const days = Math.floor(hours / 24);
        return `${days}日前`;
    };

    return (
        <div className={styles.bellContainer} ref={ref}>
            <button className={styles.bellBtn} onClick={handleOpen} aria-label="通知">
                🔔
                {unreadCount > 0 && (
                    <span className={styles.badge}>{unreadCount > 9 ? '9+' : unreadCount}</span>
                )}
            </button>

            {open && (
                <div className={styles.dropdown}>
                    <div className={styles.dropdownHeader}>
                        <h4 className={styles.dropdownTitle}>通知</h4>
                        {notifications.length > 0 && (
                            <span className={styles.dropdownCount}>{notifications.length}件</span>
                        )}
                    </div>

                    <div className={styles.dropdownList}>
                        {notifications.length === 0 ? (
                            <div className={styles.emptyState}>
                                <span>🔕</span>
                                <p>通知はありません</p>
                            </div>
                        ) : (
                            notifications.map((n) => (
                                <Link
                                    key={n.id}
                                    href={n.link}
                                    className={`${styles.notifItem} ${!n.is_read ? styles.notifUnread : ''}`}
                                    onClick={() => setOpen(false)}
                                >
                                    <span className={styles.notifIcon}>{getIcon(n.type)}</span>
                                    <div className={styles.notifContent}>
                                        <span className={styles.notifTitle}>{n.title}</span>
                                        <span className={styles.notifMessage}>{n.message}</span>
                                        <span className={styles.notifTime}>{timeAgo(n.created_at)}</span>
                                    </div>
                                </Link>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
