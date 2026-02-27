'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { DBProfile } from '@/lib/supabase/queries';
import styles from './Header.module.css';

export default function Header() {
    const pathname = usePathname();
    const router = useRouter();
    const [profile, setProfile] = useState<DBProfile | null>(null);
    const [loading, setLoading] = useState(true);

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

    const isLanding = pathname === '/';

    const handleLogout = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        setProfile(null);
        router.push('/');
        router.refresh();
    };

    const navLinks = [
        { href: '/board', label: '掲示板' },
        { href: '/board/new', label: '投稿する' },
        { href: '/mypage', label: 'マイページ' },
    ];

    return (
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

            <button className={styles.mobileMenuBtn} aria-label="メニュー">
                <span />
                <span />
                <span />
            </button>
        </header>
    );
}
