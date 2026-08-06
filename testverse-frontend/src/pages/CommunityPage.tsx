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
                <div className="text-[#666666]">Loading community posts...</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Community</h1>
                    <p className="text-[#666666] text-sm">Connect, share, and learn with fellow testers</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-[#ff6b00] hover:bg-[#cc5500] text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                >
                    <Plus size={18} />
                    New Post
                </button>
            </div>

            {/* Search */}
            <div className="flex items-center gap-3">
                <div className="flex-1 relative">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666666]" />
                    <input
                        type="text"
                        placeholder="Search posts..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg pl-10 pr-4 py-2 text-white placeholder-[#666666] focus:outline-none focus:border-[#ff6b00]"
                    />
                </div>
            </div>

            {/* Posts */}
            {filteredPosts.length === 0 ? (
                <div className="text-center py-16 bg-[#111111] border border-[#1a1a1a] rounded-xl">
                    <MessageSquare size={48} className="mx-auto mb-3 text-[#444444]" />
                    <p className="text-lg text-white">No posts yet</p>
                    <p className="text-sm text-[#666666]">Be the first to share something with the community!</p>
                    <button
                        onClick={() => setShowModal(true)}
                        className="mt-4 bg-[#ff6b00] hover:bg-[#cc5500] text-white px-4 py-2 rounded-lg transition-colors inline-flex items-center gap-2"
                    >
                        <Plus size={18} />
                        Create Post
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredPosts.map((post) => (
                        <div key={post.id} className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-5 hover:border-[#ff6b00] transition-all">
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-full bg-[#1a1a1a] flex items-center justify-center text-[#ff6b00] flex-shrink-0">
                                    <User size={18} />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-white font-medium">{post.title}</h3>
                                        <span className="text-xs text-[#666666]">
                      • {new Date(post.createdAt).toLocaleDateString()}
                    </span>
                                    </div>
                                    <p className="text-sm text-[#b0b0b0] mt-1">{post.content}</p>
                                    {post.tags && post.tags.length > 0 && (
                                        <div className="flex gap-2 mt-2 flex-wrap">
                                            {post.tags.map((tag, index) => (
                                                <span key={index} className="text-xs px-2 py-0.5 rounded-full bg-[#ff6b00]/10 text-[#ff6b00]">
                          #{tag}
                        </span>
                                            ))}
                                        </div>
                                    )}
                                    <div className="flex items-center gap-4 mt-3">
                                        <button
                                            onClick={() => handleLikePost(post.id)}
                                            className="flex items-center gap-1 text-sm text-[#666666] hover:text-[#ff6b00] transition-colors"
                                        >
                                            <ThumbsUp size={16} />
                                            {post.likesCount || 0}
                                        </button>
                                        <button className="flex items-center gap-1 text-sm text-[#666666] hover:text-white transition-colors">
                                            <MessageSquare size={16} />
                                            {post.commentsCount || 0}
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
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                    <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6 max-w-md w-full">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-white">Create New Post</h2>
                            <button onClick={() => setShowModal(false)} className="text-[#666666] hover:text-white">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleCreatePost} className="space-y-4">
                            <div>
                                <label className="block text-sm text-[#666666] mb-1">Title</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg px-4 py-2 text-white placeholder-[#666666] focus:outline-none focus:border-[#ff6b00]"
                                    placeholder="Post title"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-[#666666] mb-1">Content</label>
                                <textarea
                                    value={formData.content}
                                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                    rows={4}
                                    className="w-full bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg px-4 py-2 text-white placeholder-[#666666] focus:outline-none focus:border-[#ff6b00]"
                                    placeholder="What's on your mind?"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-[#666666] mb-1">Tags (comma separated)</label>
                                <input
                                    type="text"
                                    value={formData.tags}
                                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                                    className="w-full bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg px-4 py-2 text-white placeholder-[#666666] focus:outline-none focus:border-[#ff6b00]"
                                    placeholder="testing, automation, bug, etc."
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full bg-[#ff6b00] hover:bg-[#cc5500] text-white px-4 py-2 rounded-lg transition-colors"
                            >
                                Create Post
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CommunityPage;