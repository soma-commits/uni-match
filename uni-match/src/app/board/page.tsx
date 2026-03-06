'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { getPosts, getAllSkills, type DBPost, type DBSkill } from '@/lib/supabase/queries';
import { SKILL_CATEGORIES, type SkillCategory } from '@/lib/mockData';
import styles from './page.module.css';

export default function BoardPage() {
    const [posts, setPosts] = useState<DBPost[]>([]);
    const [skills, setSkills] = useState<DBSkill[]>([]);
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [skillFilter, setSkillFilter] = useState<SkillCategory | 'all'>('all');
    const [sortBy, setSortBy] = useState('newest');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            const [postsData, skillsData] = await Promise.all([
                getPosts(),
                getAllSkills(),
            ]);
            setPosts(postsData as DBPost[]);
            setSkills(skillsData);
            setLoading(false);
        };
        fetchData();
    }, []);

    const filteredPosts = useMemo(() => {
        let result = [...posts];

        if (search) {
            const q = search.toLowerCase();
            result = result.filter(
                (p) =>
                    p.title.toLowerCase().includes(q) ||
                    p.description.toLowerCase().includes(q) ||
                    ((p.tags || []) as string[]).some((t: string) => t.toLowerCase().includes(q))
            );
        }

        if (categoryFilter !== 'all') {
            result = result.filter((p) => p.category === categoryFilter);
        }

        if (skillFilter !== 'all') {
            result = result.filter((p) =>
                ((p.required_skills || []) as DBSkill[]).some((s: DBSkill) => s.category === skillFilter)
            );
        }

        if (sortBy === 'popular') {
            result.sort((a, b) => (b.applications_count || 0) - (a.applications_count || 0));
        }

        return result;
    }, [posts, search, categoryFilter, skillFilter, sortBy]);

    const uniqueCategories = useMemo(() => {
        return Array.from(new Set(posts.map((p) => p.category)));
    }, [posts]);

    return (
        <div className={styles.boardPage}>
            <div className={styles.pageHeader}>
                <div>
                    <h1 className={styles.pageTitle}>🚀 プロジェクト掲示板</h1>
                    <p className={styles.pageSubtitle}>仲間を募集中のプロジェクト一覧</p>
                </div>
                <Link href="/board/new" className="btn btn-primary">
                    ＋ 新規投稿
                </Link>
            </div>

            {/* Filters */}
            <div className={styles.filters}>
                <div className={styles.searchWrapper}>
                    <span className={styles.searchIcon}>🔍</span>
                    <input
                        type="text"
                        className={styles.searchInput}
                        placeholder="キーワードで検索..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <select
                    className={styles.filterSelect}
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                >
                    <option value="all">全カテゴリ</option>
                    {uniqueCategories.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                    ))}
                </select>
                <select
                    className={styles.filterSelect}
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                >
                    <option value="newest">新着順</option>
                    <option value="popular">人気順</option>
                </select>
            </div>

            {/* Skill Category Filters */}
            <div className={styles.skillFilters}>
                <button
                    className={`${styles.skillFilterBtn} ${skillFilter === 'all' ? styles.skillFilterBtnActive : ''}`}
                    onClick={() => setSkillFilter('all')}
                >
                    すべて
                </button>
                {(Object.keys(SKILL_CATEGORIES) as SkillCategory[]).map((key) => (
                    <button
                        key={key}
                        className={`${styles.skillFilterBtn} ${skillFilter === key ? styles.skillFilterBtnActive : ''}`}
                        onClick={() => setSkillFilter(key)}
                    >
                        {SKILL_CATEGORIES[key]}
                    </button>
                ))}
            </div>

            {/* Post Grid */}
            <div className={styles.postGrid}>
                {loading ? (
                    <div className={styles.emptyState}>
                        <span className={styles.emptyIcon}>⏳</span>
                        <p>読み込み中...</p>
                    </div>
                ) : filteredPosts.length === 0 ? (
                    <div className={styles.emptyState}>
                        <span className={styles.emptyIcon}>📭</span>
                        <p>条件に一致する投稿が見つかりませんでした</p>
                    </div>
                ) : (
                    filteredPosts.map((post, index) => (
                        <Link
                            href={`/board/${post.id}`}
                            key={post.id}
                            className={`${styles.postCard} glass-card`}
                            style={{ animationDelay: `${index * 0.05}s` }}
                        >
                            <div className={styles.postCardHeader}>
                                <span className={styles.postCategory}>{post.category}</span>
                                <span className={styles.postDate}>{new Date(post.created_at).toLocaleDateString('ja-JP')}</span>
                            </div>
                            <h3 className={styles.postTitle}>{post.title}</h3>
                            <p className={styles.postDescription}>{post.description}</p>
                            <div className={styles.postSkills}>
                                {((post.required_skills || []) as DBSkill[]).map((skill: DBSkill) => (
                                    <span
                                        key={skill.id}
                                        className="skill-tag"
                                        data-category={skill.category}
                                    >
                                        {skill.name === 'その他' && post.other_skill_detail
                                            ? post.other_skill_detail
                                            : skill.name}
                                    </span>
                                ))}
                            </div>
                            <div className={styles.postFooter}>
                                <div className={styles.postAuthor}>
                                    <span className={styles.postAuthorAvatar}>{post.author?.avatar}</span>
                                    <span className={styles.postAuthorName}>{post.author?.name}</span>
                                </div>
                                <div className={styles.postMeta}>
                                    <span className={styles.memberBadge}>
                                        👥 {post.current_members}/{post.max_members}
                                    </span>
                                    <span>💬 {post.applications_count || 0}</span>
                                </div>
                            </div>
                        </Link>
                    ))
                )}
            </div>
        </div>
    );
}
