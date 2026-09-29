import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Plus, Search, Users, MessageSquare, Heart, Share2, User, X, ThumbsUp } from 'lucide-react';

interface Post {
    id: number;
    title: string;
    content: string;
    authorId: number;
    authorName?: string;
    tags?: string[];
    likesCount: number;
    commentsCount: number;
    createdAt: string;
}

const CommunityPage: React.FC = () => {
    const { user, token } = useAuth();
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const [formData, setFormData] = useState({
        title: '',
        content: '',
        tags: '',
    });

    useEffect(() => {
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        try {
            const response = await fetch('http://localhost:8080/api/posts', {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (response.ok) {
                const data = await response.json();
                setPosts(data);
            }
        } catch (error) {
            console.error('Error fetching posts:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreatePost = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await fetch('http://localhost:8080/api/posts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    ...formData,
                    tags: formData.tags.split(',').map(t => t.trim()),
                    authorId: user?.id,
                }),
            });

            if (response.ok) {
                const newPost = await response.json();
                setPosts([newPost, ...posts]);
                setShowModal(false);
                setFormData({ title: '', content: '', tags: '' });
            }
        } catch (error) {
            console.error('Error creating post:', error);
        }
    };

    const handleLikePost = async (postId: number) => {
        try {
            const response = await fetch(`http://localhost:8080/api/posts/${postId}/like`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (response.ok) {
                setPosts(posts.map(p =>
                    p.id === postId ? { ...p, likesCount: p.likesCount + 1 } : p
                ));
            }
        } catch (error) {
            console.error('Error liking post:', error);
        }
    };

    const filteredPosts = posts.filter(p =>
        p.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.content?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-slate-500 flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-[#0062E0] border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm font-medium">Loading community posts...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[#0F172A]">Community</h1>
                    <p className="text-slate-500 text-sm">Connect, share, and learn with fellow testers</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-[#0062E0] hover:bg-[#0050B8] text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all font-medium text-sm shadow-sm hover:shadow"
                >
                    <Plus size={18} />
                    New Post
                </button>
            </div>

            {/* Search */}
            <div className="flex items-center gap-3">
                <div className="flex-1 relative">
                    <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search posts..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white border border-[#CBD5E1] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-[#0062E0] focus:ring-2 focus:ring-[#0062E0]/20 transition-all"
                    />
                </div>
            </div>

            {/* Posts */}
            {filteredPosts.length === 0 ? (
                <div className="text-center py-16 bg-white border border-[#E2E8F0] rounded-2xl shadow-xs">
                    <MessageSquare size={48} className="mx-auto mb-3 text-slate-300" />
                    <p className="text-lg font-bold text-[#0F172A]">No posts yet</p>
                    <p className="text-sm text-slate-500">Be the first to share something with the community!</p>
                    <button
                        onClick={() => setShowModal(true)}
                        className="mt-4 bg-[#0062E0] hover:bg-[#0050B8] text-white px-4 py-2 rounded-lg transition-all inline-flex items-center gap-2 text-sm font-medium shadow-sm hover:shadow"
                    >
                        <Plus size={18} />
                        Create Post
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredPosts.map((post) => (
                        <div key={post.id} className="bg-white border border-[#E2E8F0] rounded-2xl p-5 hover:border-slate-300 shadow-xs hover:shadow-sm transition-all">
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center text-[#0062E0] font-bold flex-shrink-0">
                                    <User size={18} />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-[#0F172A] font-semibold">{post.title}</h3>
                                        <span className="text-xs text-slate-400">
                                            • {new Date(post.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-600 mt-1 leading-relaxed">{post.content}</p>
                                    {post.tags && post.tags.length > 0 && (
                                        <div className="flex gap-2 mt-2.5 flex-wrap">
                                            {post.tags.map((tag, index) => (
                                                <span key={index} className="text-xs px-2.5 py-0.5 rounded-full bg-[#EFF6FF] text-[#0062E0] border border-[#BFDBFE] font-medium">
                                                    #{tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                    <div className="flex items-center gap-4 mt-3 pt-2 border-t border-[#F1F5F9]">
                                        <button
                                            onClick={() => handleLikePost(post.id)}
                                            className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-[#0062E0] transition-colors"
                                        >
                                            <ThumbsUp size={15} />
                                            <span>{post.likesCount || 0}</span>
                                        </button>
                                        <button className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-[#0062E0] transition-colors">
                                            <MessageSquare size={15} />
                                            <span>{post.commentsCount || 0}</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Post Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 max-w-md w-full shadow-2xl">
                        <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#F1F5F9]">
                            <h2 className="text-lg font-bold text-[#0F172A]">Create New Post</h2>
                            <button onClick={() => setShowModal(false)} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
                                <X size={18} />
                            </button>
                        </div>
                        <form onSubmit={handleCreatePost} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full bg-white border border-[#CBD5E1] rounded-lg px-4 py-2.5 text-sm text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-[#0062E0] focus:ring-2 focus:ring-[#0062E0]/20 transition-all"
                                    placeholder="Post title"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Content</label>
                                <textarea
                                    value={formData.content}
                                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                    rows={4}
                                    className="w-full bg-white border border-[#CBD5E1] rounded-lg px-4 py-2.5 text-sm text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-[#0062E0] focus:ring-2 focus:ring-[#0062E0]/20 transition-all"
                                    placeholder="What's on your mind?"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Tags (comma separated)</label>
                                <input
                                    type="text"
                                    value={formData.tags}
                                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                                    className="w-full bg-white border border-[#CBD5E1] rounded-lg px-4 py-2.5 text-sm text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-[#0062E0] focus:ring-2 focus:ring-[#0062E0]/20 transition-all"
                                    placeholder="testing, automation, bug, etc."
                                />
                            </div>
                            <div className="pt-2">
                                <button
                                    type="submit"
                                    className="w-full bg-[#0062E0] hover:bg-[#0050B8] text-white px-4 py-2.5 rounded-lg transition-all font-medium text-sm shadow-sm hover:shadow"
                                >
                                    Create Post
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CommunityPage;