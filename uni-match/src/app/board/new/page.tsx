'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getAllSkills, createPost, type DBSkill } from '@/lib/supabase/queries';
import { createClient } from '@/lib/supabase/client';
import { POST_CATEGORIES } from '@/lib/mockData';
import styles from './page.module.css';

export default function NewPostPage() {
    const router = useRouter();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [selectedSkillIds, setSelectedSkillIds] = useState<string[]>([]);
    const [maxMembers, setMaxMembers] = useState(4);
    const [tagInput, setTagInput] = useState('');
    const [tags, setTags] = useState<string[]>([]);
    const [submitted, setSubmitted] = useState(false);
    const [allSkills, setAllSkills] = useState<DBSkill[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [otherSkillDetail, setOtherSkillDetail] = useState('');

    const isOtherSelected = selectedSkillIds.some(
        (id) => allSkills.find((s) => s.id === id)?.name === 'その他'
    );

    useEffect(() => {
        getAllSkills().then(setAllSkills);
    }, []);

    const toggleSkill = (skillId: string) => {
        setSelectedSkillIds((prev) =>
            prev.includes(skillId)
                ? prev.filter((id) => id !== skillId)
                : [...prev, skillId]
        );
    };

    const addTag = () => {
        const trimmed = tagInput.trim();
        if (trimmed && !tags.includes(trimmed)) {
            setTags([...tags, trimmed]);
            setTagInput('');
        }
    };

    const removeTag = (tag: string) => {
        setTags(tags.filter((t) => t !== tag));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            router.push('/login');
            return;
        }

        try {
            await createPost({
                title,
                description,
                category,
                max_members: maxMembers,
                skill_ids: selectedSkillIds,
                tags,
                other_skill_detail: isOtherSelected ? otherSkillDetail.trim() : undefined,
            });
            setSubmitted(true);
        } catch (err) {
            setError('投稿に失敗しました。もう一度お試しください。');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className={styles.newPostPage}>
                <div className={`${styles.successMessage} glass-card`}>
                    <span className={styles.successIcon}>🎉</span>
                    <h2 className={styles.successTitle}>投稿が完了しました！</h2>
                    <p className={styles.successDesc}>掲示板で仲間からの応募を待ちましょう</p>
                    <Link href="/board" className="btn btn-primary">
                        掲示板を見る →
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.newPostPage}>
            <h1 className={styles.pageTitle}>📝 新規プロジェクトを投稿</h1>
            <p className={styles.pageSubtitle}>仲間を募集するプロジェクトの詳細を入力してください</p>

            {error && (
                <div style={{ color: 'var(--color-danger)', textAlign: 'center', marginBottom: '1rem' }}>
                    {error}
                </div>
            )}

            <form className={styles.form} onSubmit={handleSubmit}>
                <div className={`${styles.formCard} glass-card`}>
                    <div className="form-group">
                        <label className="form-label" htmlFor="post-title">プロジェクト名 *</label>
                        <input
                            id="post-title"
                            type="text"
                            className="form-input"
                            placeholder="例: AIを活用した学習管理アプリの開発メンバー募集"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                        />
                    </div>
                </div>

                <div className={`${styles.formCard} glass-card`}>
                    <div className="form-group">
                        <label className="form-label" htmlFor="post-desc">プロジェクトの詳細 *</label>
                        <textarea
                            id="post-desc"
                            className="form-textarea"
                            placeholder="プロジェクトの概要、目標、現在の進捗状況などを記入してください..."
                            rows={6}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            required
                        />
                    </div>
                </div>

                <div className={`${styles.formCard} glass-card`}>
                    <div className="form-group">
                        <label className="form-label" htmlFor="post-category">カテゴリ *</label>
                        <select
                            id="post-category"
                            className="form-select"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            required
                        >
                            <option value="">カテゴリを選択</option>
                            {POST_CATEGORIES.map((cat) => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className={`${styles.formCard} glass-card`}>
                    <div className="form-group">
                        <label className="form-label">求めるスキル *</label>
                        <div className={styles.skillSelector}>
                            {allSkills.map((skill) => (
                                <button
                                    key={skill.id}
                                    type="button"
                                    className={`${styles.skillOption} ${selectedSkillIds.includes(skill.id) ? styles.skillOptionSelected : ''
                                        }`}
                                    onClick={() => toggleSkill(skill.id)}
                                >
                                    {skill.name}
                                </button>
                            ))}
                        </div>
                        {isOtherSelected && (
                            <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--color-bg-tertiary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                                <label className="form-label" htmlFor="other-skill" style={{ marginBottom: '0.5rem', display: 'block' }}>
                                    その他のスキル名・詳細
                                </label>
                                <input
                                    id="other-skill"
                                    type="text"
                                    className="form-input"
                                    placeholder="例: Unity, C++, 動画編集 など"
                                    value={otherSkillDetail}
                                    onChange={(e) => setOtherSkillDetail(e.target.value)}
                                />
                            </div>
                        )}
                    </div>
                </div>

                <div className={`${styles.formCard} glass-card`}>
                    <div className="form-group">
                        <label className="form-label" htmlFor="max-members">募集人数</label>
                        <div className={styles.memberCountGroup}>
                            <input
                                id="max-members"
                                type="number"
                                className="form-input"
                                min={2}
                                max={10}
                                value={maxMembers}
                                onChange={(e) => setMaxMembers(Number(e.target.value))}
                            />
                            <span style={{ color: 'var(--color-text-muted)', alignSelf: 'center', fontSize: 'var(--font-size-sm)' }}>人</span>
                        </div>
                    </div>
                </div>

                <div className={`${styles.formCard} glass-card`}>
                    <div className="form-group">
                        <label className="form-label">タグ（任意）</label>
                        <div className={styles.tagInput}>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="タグを入力してEnter"
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                            />
                            <button type="button" className="btn btn-secondary" onClick={addTag}>追加</button>
                        </div>
                        {tags.length > 0 && (
                            <div className={styles.tags}>
                                {tags.map((tag) => (
                                    <span key={tag} className={styles.tag}>
                                        #{tag}
                                        <span className={styles.tagRemove} onClick={() => removeTag(tag)}>✕</span>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className={styles.formActions}>
                    <Link href="/board" className="btn btn-secondary">キャンセル</Link>
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? '投稿中...' : '投稿する →'}
                    </button>
                </div>
            </form>
        </div>
    );
}
