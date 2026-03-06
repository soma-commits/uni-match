'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { DBProfile } from '@/lib/supabase/queries';
import { getTotalUnreadDMCount } from '@/lib/supabase/queries';
import NotificationBell from './NotificationBell';
import styles from './Header.module.css';

export default function Header() {
    const pathname = usePathname();
    const router = useRouter();
    const [profile, setProfile] = useState<DBProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [unreadDMCount, setUnreadDMCount] = useState(0);

    useEffect(() => {
        const supabase = createClient();

        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();
                setProfile(data);
            }
            setLoading(false);
        };

        fetchUser();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
                supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .single()
                    .then(({ data }) => setProfile(data));
            } else {
                setProfile(null);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    // 未読DM数のポーリング（ログイン中のみ）
    useEffect(() => {
        if (!profile) return;
        const fetchUnread = async () => {
            const count = await getTotalUnreadDMCount();
            setUnreadDMCount(count);
        };
        fetchUnread();
        const interval = setInterval(fetchUnread, 30000);
        return () => clearInterval(interval);
    }, [profile]);

    // ページ遷移時にモバイルメニューを閉じる
    useEffect(() => {
        setMobileMenuOpen(false);
    }, [pathname]);

    const isLanding = pathname === '/';

    const handleLogout = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        setProfile(null);
        setMobileMenuOpen(false);
        router.push('/');
        router.refresh();
    };

    const navLinks = [
        { href: '/board', label: '掲示板', icon: '📋' },
        { href: '/board/new', label: '投稿する', icon: '✏️' },
        { href: '/mypage', label: 'マイページ', icon: '👤' },
    ];

    return (
        <>
            <header className={styles.header} style={isLanding ? { background: 'transparent', borderBottom: 'none' } : {}}>
                <Link href="/" className={styles.logo}>
                    <span className={styles.logoIcon}>🚀</span>
                    UniMatch
                </Link>

                <nav className={styles.nav}>
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`${styles.navLink} ${pathname === link.href ? styles.navLinkActive : ''}`}
                        >
                            {link.label}
                        </Link>
                    ))}
                </nav>

                <div className={styles.userMenu}>
                    {loading ? (
                        <div style={{ width: 36, height: 36 }} />
                    ) : profile ? (
                        <>
                            <NotificationBell />
                            <Link href="/dm" className={styles.dmLink} title="DM">
                                💬
                                {unreadDMCount > 0 && (
                                    <span className={styles.dmBadge}>{unreadDMCount}</span>
                                )}
                            </Link>
                            <Link href="/mypage" className={styles.avatar} title={profile.name}>
                                {profile.avatar}
                            </Link>
                            <span className={styles.userName}>{profile.name}</span>
                            <button className="btn btn-ghost" onClick={handleLogout} style={{ fontSize: '0.8rem' }}>
                                ログアウト
                            </button>
                        </>
                    ) : (
                        <Link href="/login" className="btn btn-primary" style={{ padding: '0.5rem 1.25rem' }}>
                            ログイン
                        </Link>
                    )}
                </div>

                <button
                    className={`${styles.mobileMenuBtn} ${mobileMenuOpen ? styles.mobileMenuBtnOpen : ''}`}
                    aria-label="メニュー"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                    <span />
                    <span />
                    <span />
                </button>
            </header>

            {/* Mobile Menu Overlay */}
            {mobileMenuOpen && (
                <div className={styles.mobileOverlay} onClick={() => setMobileMenuOpen(false)} />
            )}
            <div className={`${styles.mobileMenu} ${mobileMenuOpen ? styles.mobileMenuOpen : ''}`}>
                <nav className={styles.mobileNav}>
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`${styles.mobileNavLink} ${pathname === link.href ? styles.mobileNavLinkActive : ''}`}
                        >
                            <span className={styles.mobileNavIcon}>{link.icon}</span>
                            {link.label}
                        </Link>
                    ))}
                    {profile && (
                        <Link
                            href="/dm"
                            className={`${styles.mobileNavLink} ${pathname.startsWith('/dm') ? styles.mobileNavLinkActive : ''}`}
                        >
                            <span className={styles.mobileNavIcon}>💬</span>
                            DM
                            {unreadDMCount > 0 && (
                                <span className={styles.mobileDmBadge}>{unreadDMCount}</span>
                            )}
                        </Link>
                    )}
                </nav>

                <div className={styles.mobileMenuFooter}>
                    {profile ? (
                        <>
                            <Link href="/mypage" className={styles.mobileUserInfo}>
                                <span className={styles.mobileUserAvatar}>{profile.avatar}</span>
                                <div>
                                    <span className={styles.mobileUserName}>{profile.name}</span>
                                    <span className={styles.mobileUserUni}>{profile.university}</span>
                                </div>
                            </Link>
                            <button className={styles.mobileLogoutBtn} onClick={handleLogout}>
                                ログアウト
                            </button>
                        </>
                    ) : (
                        <Link href="/login" className="btn btn-primary" style={{ width: '100%', textAlign: 'center' }}>
                            ログイン
                        </Link>
                    )}
                </div>
            </div>
        </>
    );
}
