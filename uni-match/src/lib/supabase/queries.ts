import { createClient } from '@/lib/supabase/client';
import type { SkillCategory } from '@/lib/mockData';

// ============================================================
// Types (DB形式)
// ============================================================
export interface DBProfile {
    id: string;
    name: string;
    university: string;
    faculty: string;
    year: number;
    bio: string;
    avatar: string;
    created_at: string;
    updated_at: string;
    skills?: DBSkill[];
}

export interface DBSkill {
    id: string;
    name: string;
    category: SkillCategory;
}

export interface DBPost {
    id: string;
    title: string;
    description: string;
    category: string;
    max_members: number;
    current_members: number;
    status: 'recruiting' | 'closed';
    author_id: string;
    created_at: string;
    updated_at: string;
    author?: DBProfile;
    required_skills?: DBSkill[];
    tags?: string[];
    applications_count?: number;
}

export interface DBApplication {
    id: string;
    post_id: string;
    applicant_id: string;
    message: string;
    status: 'pending' | 'accepted' | 'rejected';
    created_at: string;
    post?: DBPost;
    applicant?: DBProfile;
}

export interface DBMessage {
    id: string;
    post_id: string;
    sender_id: string;
    content: string;
    created_at: string;
    sender?: DBProfile;
}

export interface DBPostComment {
    id: string;
    post_id: string;
    author_id: string;
    parent_id: string | null;
    content: string;
    created_at: string;
    updated_at: string;
    author?: DBProfile;
}

// ============================================================
// Posts
// ============================================================

export async function getPosts(options?: {
    search?: string;
    category?: string;
    skillCategory?: SkillCategory;
    sortBy?: 'newest' | 'popular';
}) {
    const supabase = createClient();

    let query = supabase
        .from('posts')
        .select(`
      *,
      author:profiles!posts_author_id_fkey(*),
      required_skills:post_required_skills(skill:skills(*)),
      tags:post_tags(tag),
      applications_count:applications(count)
    `)
        .eq('status', 'recruiting');

    if (options?.search) {
        query = query.or(`title.ilike.%${options.search}%,description.ilike.%${options.search}%`);
    }

    if (options?.category && options.category !== 'all') {
        query = query.eq('category', options.category);
    }

    if (options?.sortBy === 'popular') {
        query = query.order('created_at', { ascending: false });
    } else {
        query = query.order('created_at', { ascending: false });
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching posts:', error);
        return [];
    }

    // データを整形
    return (data || []).map((post) => ({
        ...post,
        required_skills: post.required_skills?.map((rs: { skill: DBSkill }) => rs.skill) || [],
        tags: post.tags?.map((t: { tag: string }) => t.tag) || [],
        applications_count: post.applications_count?.[0]?.count || 0,
    }));
}

export async function getPostById(id: string) {
    const supabase = createClient();

    const { data, error } = await supabase
        .from('posts')
        .select(`
      *,
      author:profiles!posts_author_id_fkey(
        *,
        skills:user_skills(skill:skills(*))
      ),
      required_skills:post_required_skills(skill:skills(*)),
      tags:post_tags(tag),
      applications_count:applications(count)
    `)
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error fetching post:', error);
        return null;
    }

    return {
        ...data,
        author: {
            ...data.author,
            skills: data.author?.skills?.map((us: { skill: DBSkill }) => us.skill) || [],
        },
        required_skills: data.required_skills?.map((rs: { skill: DBSkill }) => rs.skill) || [],
        tags: data.tags?.map((t: { tag: string }) => t.tag) || [],
        applications_count: data.applications_count?.[0]?.count || 0,
    };
}

export async function createPost(post: {
    title: string;
    description: string;
    category: string;
    max_members: number;
    skill_ids: string[];
    tags: string[];
}) {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // 投稿を作成
    const { data: newPost, error: postError } = await supabase
        .from('posts')
        .insert({
            title: post.title,
            description: post.description,
            category: post.category,
            max_members: post.max_members,
            author_id: user.id,
        })
        .select()
        .single();

    if (postError) throw postError;

    // スキルを紐づけ
    if (post.skill_ids.length > 0) {
        const { error: skillError } = await supabase
            .from('post_required_skills')
            .insert(
                post.skill_ids.map((skill_id) => ({
                    post_id: newPost.id,
                    skill_id,
                }))
            );
        if (skillError) console.error('Error adding skills:', skillError);
    }

    // タグを追加
    if (post.tags.length > 0) {
        const { error: tagError } = await supabase
            .from('post_tags')
            .insert(
                post.tags.map((tag) => ({
                    post_id: newPost.id,
                    tag,
                }))
            );
        if (tagError) console.error('Error adding tags:', tagError);
    }

    return newPost;
}

export async function updatePostStatus(postId: string, status: 'recruiting' | 'closed') {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
        .from('posts')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', postId)
        .eq('author_id', user.id);

    if (error) throw error;
}

export async function updatePost(postId: string, post: {
    title: string;
    description: string;
    category: string;
    max_members: number;
    skill_ids: string[];
    tags: string[];
}) {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // 投稿本体を更新
    const { error: postError } = await supabase
        .from('posts')
        .update({
            title: post.title,
            description: post.description,
            category: post.category,
            max_members: post.max_members,
            updated_at: new Date().toISOString(),
        })
        .eq('id', postId)
        .eq('author_id', user.id);

    if (postError) throw postError;

    // 既存スキルを削除して再挿入
    await supabase.from('post_required_skills').delete().eq('post_id', postId);
    if (post.skill_ids.length > 0) {
        await supabase
            .from('post_required_skills')
            .insert(post.skill_ids.map((skill_id) => ({ post_id: postId, skill_id })));
    }

    // 既存タグを削除して再挿入
    await supabase.from('post_tags').delete().eq('post_id', postId);
    if (post.tags.length > 0) {
        await supabase
            .from('post_tags')
            .insert(post.tags.map((tag) => ({ post_id: postId, tag })));
    }
}

export async function deletePost(postId: string) {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // 関連データを削除（RLSエラーは無視して続行）
    const tables = ['messages', 'applications', 'post_required_skills', 'post_tags'];
    for (const table of tables) {
        try {
            await supabase.from(table).delete().eq('post_id', postId);
        } catch (e) {
            console.warn(`Failed to delete from ${table}:`, e);
        }
    }

    const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId)
        .eq('author_id', user.id);

    if (error) throw error;
}

// ============================================================
// Notifications
// ============================================================

export interface DBNotification {
    id: string;
    user_id: string;
    type: 'application_received' | 'application_accepted' | 'application_rejected' | 'new_message';
    title: string;
    message: string;
    link: string;
    is_read: boolean;
    created_at: string;
}

export async function getNotifications() {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

    if (error) {
        console.error('Notifications table may not exist:', error);
        return [];
    }

    return data as DBNotification[];
}

export async function createNotification(notification: {
    user_id: string;
    type: string;
    title: string;
    message: string;
    link: string;
}) {
    const supabase = createClient();

    const { error } = await supabase
        .from('notifications')
        .insert({
            ...notification,
            is_read: false,
        });

    if (error) {
        console.error('Failed to create notification:', error);
    }
}

export async function markNotificationsRead() {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);
}

// ============================================================
// Profiles
// ============================================================

export async function getProfile(id: string) {
    const supabase = createClient();

    const { data, error } = await supabase
        .from('profiles')
        .select(`
      *,
      skills:user_skills(skill:skills(*))
    `)
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error fetching profile:', error);
        return null;
    }

    return {
        ...data,
        skills: data.skills?.map((us: { skill: DBSkill }) => us.skill) || [],
    };
}

export async function updateProfile(profile: {
    name?: string;
    university?: string;
    faculty?: string;
    year?: number;
    bio?: string;
    avatar?: string;
}) {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
        .from('profiles')
        .update({ ...profile, updated_at: new Date().toISOString() })
        .eq('id', user.id);

    if (error) throw error;
}

export async function updateUserSkills(skill_ids: string[]) {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // 既存のスキルを削除
    await supabase.from('user_skills').delete().eq('user_id', user.id);

    // 新しいスキルを追加
    if (skill_ids.length > 0) {
        const { error } = await supabase
            .from('user_skills')
            .insert(skill_ids.map((skill_id) => ({ user_id: user.id, skill_id })));
        if (error) throw error;
    }
}

// ============================================================
// Skills
// ============================================================

export async function getAllSkills() {
    const supabase = createClient();

    const { data, error } = await supabase
        .from('skills')
        .select('*')
        .order('category');

    if (error) {
        console.error('Error fetching skills:', error);
        return [];
    }

    return data as DBSkill[];
}

// ============================================================
// Applications
// ============================================================

export async function applyToPost(postId: string, message: string = '') {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
        .from('applications')
        .insert({
            post_id: postId,
            applicant_id: user.id,
            message,
        });

    if (error) throw error;
}

export async function getMyApplications() {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
        .from('applications')
        .select(`
      *,
      post:posts(
        *,
        author:profiles!posts_author_id_fkey(name, avatar),
        required_skills:post_required_skills(skill:skills(*))
      )
    `)
        .eq('applicant_id', user.id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching applications:', error);
        return [];
    }

    return (data || []).map((app) => ({
        ...app,
        post: app.post ? {
            ...app.post,
            required_skills: app.post.required_skills?.map((rs: { skill: DBSkill }) => rs.skill) || [],
        } : null,
    }));
}

export async function getPostApplications(postId: string) {
    const supabase = createClient();

    const { data, error } = await supabase
        .from('applications')
        .select(`
      *,
      applicant:profiles!applications_applicant_id_fkey(
        *,
        skills:user_skills(skill:skills(*))
      )
    `)
        .eq('post_id', postId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching applications:', error);
        return [];
    }

    return (data || []).map((app) => ({
        ...app,
        applicant: app.applicant ? {
            ...app.applicant,
            skills: app.applicant.skills?.map((us: { skill: DBSkill }) => us.skill) || [],
        } : null,
    }));
}

export async function updateApplicationStatus(
    applicationId: string,
    status: 'accepted' | 'rejected'
) {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // ステータスを更新
    const { data: updatedApp, error } = await supabase
        .from('applications')
        .update({ status })
        .eq('id', applicationId)
        .select('post_id')
        .single();

    if (error) throw error;

    // 承認時は current_members をインクリメント
    if (status === 'accepted' && updatedApp) {
        const { data: post } = await supabase
            .from('posts')
            .select('current_members')
            .eq('id', updatedApp.post_id)
            .single();

        if (post) {
            await supabase
                .from('posts')
                .update({ current_members: post.current_members + 1 })
                .eq('id', updatedApp.post_id);
        }
    }
}

// ============================================================
// Messages (Realtime Chat)
// ============================================================

export async function getMessages(postId: string) {
    const supabase = createClient();

    const { data, error } = await supabase
        .from('messages')
        .select(`
      *,
      sender:profiles!messages_sender_id_fkey(id, name, avatar)
    `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Error fetching messages:', error);
        return [];
    }

    return data || [];
}

export async function sendMessage(postId: string, content: string) {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
        .from('messages')
        .insert({
            post_id: postId,
            sender_id: user.id,
            content,
        });

    if (error) throw error;
}

// ============================================================
// Auth helpers
// ============================================================

export async function getCurrentSession() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    const profile = await getProfile(user.id);
    return { user, profile };
}

export async function getUserPostsCount(userId: string) {
    const supabase = createClient();
    const { count } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('author_id', userId);
    return count || 0;
}

export async function getUserPosts(userId: string) {
    const supabase = createClient();

    const { data, error } = await supabase
        .from('posts')
        .select(`
      *,
      required_skills:post_required_skills(skill:skills(*)),
      tags:post_tags(tag),
      applications_count:applications(count)
    `)
        .eq('author_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching user posts:', error);
        return [];
    }

    return (data || []).map((post) => ({
        ...post,
        required_skills: post.required_skills?.map((rs: { skill: DBSkill }) => rs.skill) || [],
        tags: post.tags?.map((t: { tag: string }) => t.tag) || [],
        applications_count: post.applications_count?.[0]?.count || 0,
    }));
}

// ============================================================
// Post Comments (Threads)
// ============================================================

export async function getPostComments(postId: string) {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('post_comments')
        .select(`
            *,
            author:profiles!post_comments_author_id_fkey(*)
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

    if (error) throw error;
    return data as DBPostComment[];
}

export async function addPostComment(postId: string, content: string, parentId?: string) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
        .from('post_comments')
        .insert([
            {
                post_id: postId,
                author_id: user.id,
                content,
                parent_id: parentId || null,
            },
        ])
        .select(`
            *,
            author:profiles!post_comments_author_id_fkey(*)
        `)
        .single();

    if (error) throw error;
    return data as DBPostComment;
}

export async function deletePostComment(commentId: string) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
        .from('post_comments')
        .delete()
        .eq('id', commentId);

    if (error) throw error;
}
