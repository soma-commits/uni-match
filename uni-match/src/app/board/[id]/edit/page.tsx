'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { getAllSkills, getPostById, updatePost, type DBSkill } from '@/lib/supabase/queries';
import { createClient } from '@/lib/supabase/client';
import { POST_CATEGORIES } from '@/lib/mockData';
import styles from '../../new/page.module.css';

export default function EditPostPage() {
    const router = useRouter();
    const params = useParams();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [selectedSkillIds, setSelectedSkillIds] = useState<string[]>([]);
    const [maxMembers, setMaxMembers] = useState(4);
    const [tagInput, setTagInput] = useState('');
    const [tags, setTags] = useState<string[]>([]);
    const [allSkills, setAllSkills] = useState<DBSkill[]>([]);
    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const init = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                router.push('/login');
                return;
            }

            const [postData, skillsData] = await Promise.all([
                getPostById(params.id as string),
                getAllSkills(),
            ]);

            if (!postData || postData.author?.id !== user.id) {
                router.push('/board');
                return;
            }

            setTitle(postData.title);
            setDescription(postData.description);
            setCategory(postData.category);
            setMaxMembers(postData.max_members);
            setSelectedSkillIds(postData.required_skills?.map((s: DBSkill) => s.id) || []);
            setTags(postData.tags || []);
            setAllSkills(skillsData);
            setPageLoading(false);
        };

        init();
    }, [params.id, router]);

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

        try {
            await updatePost(params.id as string, {
                title,
                description,
                category,
                max_members: maxMembers,
                skill_ids: selectedSkillIds,
                tags,
            });
            router.push(`/board/${params.id}`);
        } catch (err) {
            setError('更新に失敗しました。もう一度お試しください。');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (pageLoading) {
        return (
            <div className={styles.newPostPage}>
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
                    <p>読み込み中...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.newPostPage}>
            <h1 className={styles.pageTitle}>✏️ プロジェクトを編集</h1>
            <p className={styles.pageSubtitle}>プロジェクトの内容を更新できます</p>

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
                                    className={`${styles.skillOption} ${selectedSkillIds.includes(skill.id) ? styles.skillOptionSelected : ''}`}
                                    onClick={() => toggleSkill(skill.id)}
                                >
                                    {skill.name}
                                </button>
                            ))}
                        </div>
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
                    <Link href={`/board/${params.id}`} className="btn btn-secondary">キャンセル</Link>
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? '更新中...' : '💾 更新する'}
                    </button>
                </div>
            </form>
        </div>
    );
}
