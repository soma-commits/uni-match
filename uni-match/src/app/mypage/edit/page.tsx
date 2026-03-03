'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { getProfile, getAllSkills, updateProfile, updateUserSkills, type DBSkill } from '@/lib/supabase/queries';
import styles from './page.module.css';

const AVATARS = ['🧑‍💻', '👩‍💻', '🧑‍🎓', '👩‍🎓', '🧑‍💼', '👩‍💼', '🧑‍🔬', '👩‍🔬', '🧑‍🎨', '👩‍🎨', '🦊', '🐱', '🐶', '🐼', '🦁', '🐯'];

interface ProfileForm {
    name: string;
    university: string;
    faculty: string;
    year: number;
    bio: string;
    avatar: string;
}

export default function EditProfilePage() {
    const router = useRouter();
    const [form, setForm] = useState<ProfileForm>({
        name: '', university: '', faculty: '', year: 1, bio: '', avatar: '🧑‍💻',
    });
    const [allSkills, setAllSkills] = useState<DBSkill[]>([]);
    const [selectedSkillIds, setSelectedSkillIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        const init = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                router.push('/login');
                return;
            }

            const [profileData, skillsData] = await Promise.all([
                getProfile(user.id),
                getAllSkills(),
            ]);

            if (profileData) {
                setForm({
                    name: profileData.name || '',
                    university: profileData.university || '',
                    faculty: profileData.faculty || '',
                    year: profileData.year || 1,
                    bio: profileData.bio || '',
                    avatar: profileData.avatar || '🧑‍💻',
                });
                setSelectedSkillIds(profileData.skills?.map((s: DBSkill) => s.id) || []);
            }

            setAllSkills(skillsData);
            setLoading(false);
        };

        init();
    }, [router]);

    const handleChange = (field: keyof ProfileForm, value: string | number) => {
        setForm((prev) => ({ ...prev, [field]: value }));
        setSuccess(false);
    };

    const toggleSkill = (skillId: string) => {
        setSelectedSkillIds((prev) =>
            prev.includes(skillId)
                ? prev.filter((id) => id !== skillId)
                : [...prev, skillId]
        );
        setSuccess(false);
    };

    const handleSave = async () => {
        setSaving(true);
        setSuccess(false);
        try {
            await Promise.all([
                updateProfile(form),
                updateUserSkills(selectedSkillIds),
            ]);
            setSuccess(true);
        } catch (err) {
            console.error('Save error:', err);
            alert('保存に失敗しました。');
        } finally {
            setSaving(false);
        }
    };

    // スキルをカテゴリごとにグループ化
    const skillsByCategory = allSkills.reduce<Record<string, DBSkill[]>>((acc, skill) => {
        if (!acc[skill.category]) acc[skill.category] = [];
        acc[skill.category].push(skill);
        return acc;
    }, {});

    const categoryLabels: Record<string, string> = {
        tech: '💻 テクノロジー',
        business: '📊 ビジネス',
        design: '🎨 デザイン',
        marketing: '📢 マーケティング',
        other: '🔧 その他',
    };

    if (loading) {
        return (
            <div className={styles.page}>
                <div className={styles.loadingState}>
                    <span className={styles.loadingIcon}>✏️</span>
                    <p>プロフィールを読み込み中...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.page}>
            <div className={styles.pageHeader}>
                <h1 className={styles.pageTitle}>✏️ プロフィール編集</h1>
                <p className={styles.pageSubtitle}>あなたの情報を更新してチームにアピールしましょう</p>
            </div>

            <div className={styles.formGrid}>
                {/* Avatar Selection */}
                <div className={`${styles.section} glass-card`}>
                    <h2 className={styles.sectionTitle}>アバター</h2>
                    <div className={styles.avatarGrid}>
                        {AVATARS.map((emoji) => (
                            <button
                                key={emoji}
                                className={`${styles.avatarOption} ${form.avatar === emoji ? styles.avatarSelected : ''}`}
                                onClick={() => handleChange('avatar', emoji)}
                            >
                                {emoji}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Basic Info */}
                <div className={`${styles.section} glass-card`}>
                    <h2 className={styles.sectionTitle}>基本情報</h2>

                    <div className={styles.fieldGroup}>
                        <label className="form-label" htmlFor="name">名前 *</label>
                        <input
                            id="name"
                            type="text"
                            className="form-input"
                            value={form.name}
                            onChange={(e) => handleChange('name', e.target.value)}
                            placeholder="山田 太郎"
                        />
                    </div>

                    <div className={styles.fieldRow}>
                        <div className={styles.fieldGroup}>
                            <label className="form-label" htmlFor="university">大学</label>
                            <input
                                id="university"
                                type="text"
                                className="form-input"
                                value={form.university}
                                onChange={(e) => handleChange('university', e.target.value)}
                                placeholder="東京大学"
                            />
                        </div>
                        <div className={styles.fieldGroup}>
                            <label className="form-label" htmlFor="faculty">学部</label>
                            <input
                                id="faculty"
                                type="text"
                                className="form-input"
                                value={form.faculty}
                                onChange={(e) => handleChange('faculty', e.target.value)}
                                placeholder="工学部"
                            />
                        </div>
                    </div>

                    <div className={styles.fieldGroup}>
                        <label className="form-label" htmlFor="year">学年</label>
                        <select
                            id="year"
                            className="form-input"
                            value={form.year}
                            onChange={(e) => handleChange('year', Number(e.target.value))}
                        >
                            {[1, 2, 3, 4, 5, 6].map((y) => (
                                <option key={y} value={y}>{y}年</option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.fieldGroup}>
                        <label className="form-label" htmlFor="bio">自己紹介</label>
                        <textarea
                            id="bio"
                            className="form-input"
                            value={form.bio}
                            onChange={(e) => handleChange('bio', e.target.value)}
                            placeholder="あなたの経験やスキル、興味のある分野について書いてください"
                            rows={4}
                            style={{ resize: 'vertical' }}
                        />
                    </div>
                </div>

                {/* Skills */}
                <div className={`${styles.section} glass-card`}>
                    <h2 className={styles.sectionTitle}>スキル</h2>
                    <p className={styles.sectionDesc}>持っているスキルを選択してください</p>

                    {Object.entries(skillsByCategory).map(([category, skills]) => (
                        <div key={category} className={styles.skillCategory}>
                            <h3 className={styles.skillCategoryTitle}>
                                {categoryLabels[category] || category}
                            </h3>
                            <div className={styles.skillsGrid}>
                                {skills.map((skill) => (
                                    <button
                                        key={skill.id}
                                        className={`${styles.skillChip} ${selectedSkillIds.includes(skill.id) ? styles.skillChipSelected : ''}`}
                                        onClick={() => toggleSkill(skill.id)}
                                        data-category={skill.category}
                                    >
                                        {skill.name}
                                        {selectedSkillIds.includes(skill.id) && <span className={styles.checkMark}>✓</span>}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Save Bar */}
            <div className={styles.saveBar}>
                <button
                    className="btn btn-secondary"
                    onClick={() => router.push('/mypage')}
                    disabled={saving}
                >
                    キャンセル
                </button>
                {success && <span className={styles.successMsg}>✅ 保存しました！</span>}
                <button
                    className="btn btn-primary"
                    onClick={handleSave}
                    disabled={saving || !form.name.trim()}
                >
                    {saving ? '保存中...' : '💾 保存する'}
                </button>
            </div>
        </div>
    );
}
