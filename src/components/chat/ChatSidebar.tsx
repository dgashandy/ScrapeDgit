"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    MessageSquarePlus,
    History,
    Trash2,
    Menu,
    X,
    Sparkles,
    ChevronLeft,
} from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";

interface ChatSession {
    id: string;
    title: string;
    createdAt: string;
    messageCount?: number;
}

interface ChatSidebarProps {
    currentSessionId?: string;
    onNewChat: () => void;
    onSelectSession: (sessionId: string) => void;
    onDeleteSession?: (sessionId: string) => void;
}

export function ChatSidebar({
    currentSessionId,
    onNewChat,
    onSelectSession,
    onDeleteSession,
}: ChatSidebarProps) {
    const { accessToken, isAuthenticated, isLoading: authLoading } = useAuth();
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

    // Fetch chat sessions
    const fetchSessions = async () => {
        if (!isAuthenticated || !accessToken) return;

        setIsLoading(true);
        try {
            const response = await fetch("/api/chat/sessions", {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            const data = await response.json();
            if (data.success) {
                setSessions(data.data);
            }
        } catch (error) {
            console.error("Failed to fetch sessions:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSessions();
    }, [isAuthenticated, accessToken]);

    const handleDeleteClick = (sessionId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setDeleteConfirmId(sessionId);
    };

    const handleDeleteConfirm = async () => {
        if (!deleteConfirmId) return;

        setDeletingId(deleteConfirmId);
        try {
            const response = await fetch(`/api/chat/${deleteConfirmId}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            if (response.ok) {
                setSessions((prev) => prev.filter((s) => s.id !== deleteConfirmId));
                onDeleteSession?.(deleteConfirmId);
            }
        } catch (error) {
            console.error("Failed to delete session:", error);
        } finally {
            setDeletingId(null);
            setDeleteConfirmId(null);
        }
    };

    // Delete Confirmation Modal
    const DeleteModal = () => {
        if (!deleteConfirmId) return null;
        const session = sessions.find(s => s.id === deleteConfirmId);

        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]" onClick={() => setDeleteConfirmId(null)}>
                <div className="bg-dark-800 rounded-xl p-5 max-w-sm w-full mx-4 shadow-xl border border-dark-600" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                            <Trash2 className="w-5 h-5 text-red-400" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-white">Delete Chat</h3>
                            <p className="text-sm text-gray-400">This action cannot be undone</p>
                        </div>
                    </div>
                    <p className="text-gray-300 mb-4 text-sm">
                        Are you sure you want to delete &quot;{session?.title || 'this chat'}&quot;?
                    </p>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="flex-1 px-4 py-2 rounded-lg bg-dark-700 hover:bg-dark-600 text-white text-sm font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleDeleteConfirm}
                            disabled={deletingId === deleteConfirmId}
                            className="flex-1 px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-colors disabled:opacity-50"
                        >
                            {deletingId === deleteConfirmId ? 'Deleting...' : 'Delete'}
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    if (isCollapsed) {
        return (
            <div className="w-12 bg-dark-900 border-r border-dark-700 flex flex-col items-center py-4 gap-4">
                <button
                    onClick={() => setIsCollapsed(false)}
                    className="p-2 rounded-lg hover:bg-dark-700 text-gray-400 hover:text-white"
                >
                    <Menu className="w-5 h-5" />
                </button>
                <button
                    onClick={onNewChat}
                    className="p-2 rounded-lg bg-primary-500 hover:bg-primary-600 text-white"
                    title="New Chat"
                >
                    <MessageSquarePlus className="w-5 h-5" />
                </button>
            </div>
        );
    }

    return (
        <div className="w-64 bg-dark-900 border-r border-dark-700 flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b border-dark-700 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-r from-primary-500 to-secondary-500 flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-bold text-white">ScrapeDgit</span>
                </Link>
                <button
                    onClick={() => setIsCollapsed(true)}
                    className="p-1.5 rounded-lg hover:bg-dark-700 text-gray-400 hover:text-white"
                >
                    <ChevronLeft className="w-4 h-4" />
                </button>
            </div>

            {/* New Chat Button */}
            <div className="p-3">
                <button
                    onClick={onNewChat}
                    className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg bg-dark-800 hover:bg-dark-700 text-white border border-dark-600 hover:border-dark-500 transition-colors"
                >
                    <MessageSquarePlus className="w-4 h-4" />
                    <span>New Chat</span>
                </button>
            </div>

            {/* Chat History */}
            <div className="flex-1 overflow-y-auto px-3 pb-3">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 px-2">
                    Recent Chats
                </div>

                {authLoading ? (
                    <div className="space-y-2">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="animate-pulse h-10 bg-dark-800 rounded-lg" />
                        ))}
                    </div>
                ) : !isAuthenticated ? (
                    <div className="text-center py-8 text-gray-500 text-sm">
                        <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>Sign in to save</p>
                        <p>chat history</p>
                    </div>
                ) : isLoading ? (
                    <div className="space-y-2">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="animate-pulse h-10 bg-dark-800 rounded-lg" />
                        ))}
                    </div>
                ) : sessions.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 text-sm">
                        <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>No chats yet</p>
                    </div>
                ) : (
                    <div className="space-y-1">
                        {sessions.map((session) => (
                            <div
                                key={session.id}
                                onClick={() => onSelectSession(session.id)}
                                className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${currentSessionId === session.id
                                    ? "bg-dark-700 text-white"
                                    : "text-gray-400 hover:bg-dark-800 hover:text-white"
                                    }`}
                            >
                                <MessageSquarePlus className="w-4 h-4 flex-shrink-0" />
                                <span className="flex-1 truncate text-sm">
                                    {session.title || "New Chat"}
                                </span>
                                <button
                                    onClick={(e) => handleDeleteClick(session.id, e)}
                                    disabled={deletingId === session.id}
                                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/20 hover:text-red-400 transition-all"
                                >
                                    {deletingId === session.id ? (
                                        <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <Trash2 className="w-3 h-3" />
                                    )}
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <DeleteModal />
        </div>
    );
}
