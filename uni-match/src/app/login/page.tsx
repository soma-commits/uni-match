'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import styles from './page.module.css';

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    const authError = searchParams.get('error');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const studentDomains = ['.ac.jp', '.edu', 'keio.jp', 'waseda.jp'];
        const isStudentEmail = studentDomains.some((domain) => email.endsWith(domain));

        if (!isStudentEmail) {
            setError('学生用メールアドレス（.ac.jp等）を使用してください');
            setLoading(false);
            return;
        }

        const supabase = createClient();

        const { error: signInError } = await supabase.auth.signInWithOtp({
            email,
            options: {
                emailRedirectTo: `${window.location.origin}/auth/callback`,
            },
        });

        if (signInError) {
            setError('ログインに失敗しました。もう一度お試しください。');
            setLoading(false);
            return;
        }

        setSuccess(true);
        setLoading(false);
    };

    const handleDemoLogin = async () => {
        setLoading(true);
        setError('');

        const supabase = createClient();

        const { error: signInError } = await supabase.auth.signInWithPassword({
            email: 'demo@g.ecc.u-tokyo.ac.jp',
            password: 'demo123456',
        });

        if (signInError) {
            const { error: signUpError } = await supabase.auth.signUp({
                email: 'demo@g.ecc.u-tokyo.ac.jp',
                password: 'demo123456',
                options: {
                    data: { name: 'デモユーザー' },
                },
            });

            if (signUpError) {
                setError('デモログインに失敗しました: ' + signUpError.message);
                setLoading(false);
                return;
            }
        }

        setLoading(false);
        router.push('/board');
        router.refresh();
    };

    if (success) {
        return (
            <div className={styles.loginPage}>
                <div className={`${styles.loginCard} glass-card`}>
                    <h1 className={styles.loginTitle}>📧 メールを確認してください</h1>
                    <p className={styles.loginSubtitle}>
                        <strong>{email}</strong> にログインリンクを送信しました。<br />
                        メール内のリンクをクリックしてログインしてください。
                    </p>
                    <button
                        className="btn btn-secondary"
                        onClick={() => { setSuccess(false); setEmail(''); }}
                        style={{ marginTop: '1rem', width: '100%' }}
                    >
                        別のメールアドレスで試す
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.loginPage}>
            <div className={`${styles.loginCard} glass-card`}>
                <h1 className={styles.loginTitle}>🎓 ログイン</h1>
                <p className={styles.loginSubtitle}>学生メールアドレスで認証してください</p>

                {authError && (
                    <p className={styles.errorMsg} style={{ textAlign: 'center', marginBottom: '1rem' }}>
                        認証に失敗しました。もう一度お試しください。
                    </p>
                )}

                <form className={styles.form} onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label" htmlFor="email">メールアドレス</label>
                        <input
                            id="email"
                            type="email"
                            className="form-input"
                            placeholder="taro@g.ecc.u-tokyo.ac.jp"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            disabled={loading}
                        />
                        <span className={styles.hint}>大学発行のメールアドレス（.ac.jp等）をご使用ください</span>
                        {error && <span className={styles.errorMsg}>{error}</span>}
                    </div>

                    <button
                        type="submit"
                        className={`btn btn-primary ${styles.submitBtn}`}
                        disabled={loading}
                    >
                        {loading ? '送信中...' : 'マジックリンクを送信 →'}
                    </button>
                </form>

                <div className={styles.divider}>または</div>

                <div className={styles.demoSection}>
                    <p className={styles.demoTitle}>デモユーザーでお試し</p>
                    <button
                        className={styles.demoUserBtn}
                        onClick={handleDemoLogin}
                        disabled={loading}
                    >
                        <span className={styles.demoAvatar}>🧑‍💻</span>
                        <div className={styles.demoInfo}>
                            <span className={styles.demoName}>デモユーザー</span>
                            <span className={styles.demoUni}>ワンクリックですぐにログイン</span>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className={styles.loginPage}>
                <div className={`${styles.loginCard} glass-card`}>
                    <p style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>読み込み中...</p>
                </div>
            </div>
        }>
            <LoginForm />
        </Suspense>
    );
}
