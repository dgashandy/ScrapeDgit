"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import {
    Send,
    Search,
    MapPin,
    Download,
    ExternalLink,
    Star,
    Sparkles,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    FileSpreadsheet,
    FileText,
    Filter,
    X,
    Check,
    Edit3,
    Menu
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { LoadingDots } from "@/components/ui/LoadingSpinner";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { ScoredProduct, ParsedQuery } from "@/lib/types";
import { useAuth } from "@/lib/auth/AuthContext";

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    products?: ScoredProduct[];
    accumulatedQuery?: ParsedQuery;
    quickReplies?: string[];
    responseType?: "greeting" | "clarification" | "confirmation" | "results" | "no_results";
    isLoading?: boolean;
}

// Helper function to format budget range with smart units
function formatBudgetRange(minPrice?: number | null, maxPrice?: number | null): string {
    const formatPrice = (price: number): string => {
        if (price >= 1000000) {
            return `${(price / 1000000).toFixed(price % 1000000 === 0 ? 0 : 1)}M`;
        } else if (price >= 1000) {
            return `${(price / 1000).toFixed(0)}K`;
        }
        return price.toString();
    };

    const min = minPrice ? formatPrice(minPrice) : "0";
    const max = maxPrice ? formatPrice(maxPrice) : "∞";
    return `${min} - ${max} IDR`;
}

export default function ChatPage() {
    const router = useRouter();
    const params = useParams();
    const sessionIdFromUrl = params?.sessionId?.[0] as string | undefined;

    const { user, accessToken, isAuthenticated } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [location, setLocation] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [sessionId, setSessionId] = useState<string | null>(sessionIdFromUrl || null);
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [showFiltersModal, setShowFiltersModal] = useState(false);
    const [showMobileSidebar, setShowMobileSidebar] = useState(false);
    const [productPage, setProductPage] = useState<Record<string, number>>({});
    const [currentQuery, setCurrentQuery] = useState<ParsedQuery | null>(null);
    const [sidebarKey, setSidebarKey] = useState(0); // For refreshing sidebar
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const PRODUCTS_PER_PAGE = 10;

    // Load session from URL
    useEffect(() => {
        if (sessionIdFromUrl && accessToken) {
            loadSession(sessionIdFromUrl);
        }
    }, [sessionIdFromUrl, accessToken]);

    // Set location from user profile
    useEffect(() => {
        if (user?.location && !location) {
            setLocation(user.location);
        }
    }, [user, location]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Load existing session
    const loadSession = async (sid: string) => {
        if (!accessToken) return;

        setIsLoading(true);
        try {
            const response = await fetch(`/api/chat/${sid}`, {
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            const data = await response.json();

            if (data.success) {
                setSessionId(sid);
                setCurrentQuery(data.data.accumulatedQuery);

                // Convert messages to our format
                const loadedMessages: Message[] = data.data.messages.map((msg: { id: string; role: string; content: string; parsedQuery?: ParsedQuery }) => ({
                    id: msg.id,
                    role: msg.role as "user" | "assistant",
                    content: msg.content,
                    accumulatedQuery: msg.parsedQuery,
                }));

                // Add products to last assistant message if available
                if (data.data.results?.length > 0 && loadedMessages.length > 0) {
                    const lastAssistant = [...loadedMessages].reverse().find(m => m.role === "assistant");
                    if (lastAssistant) {
                        lastAssistant.products = data.data.results;
                    }
                }

                setMessages(loadedMessages);
            }
        } catch (error) {
            console.error("Failed to load session:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleNewChat = () => {
        setMessages([]);
        setSessionId(null);
        setCurrentQuery(null);
        setShowMobileSidebar(false);
        router.push("/chat");
    };

    const handleSelectSession = (sid: string) => {
        setShowMobileSidebar(false);
        router.push(`/chat/${sid}`);
    };

    const handleDeleteSession = (deletedId: string) => {
        if (sessionId === deletedId) {
            handleNewChat();
        }
    };

    const sendMessage = async (
        messageText: string,
        options: { confirmSearch?: boolean; modifySearch?: boolean } = {}
    ) => {
        if (!messageText.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: "user",
            content: messageText,
        };

        const loadingMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: "",
            isLoading: true,
        };

        setMessages((prev) => [...prev, userMessage, loadingMessage]);
        setInput("");
        setIsLoading(true);

        try {
            const headers: Record<string, string> = {
                "Content-Type": "application/json",
            };

            if (accessToken) {
                headers["Authorization"] = `Bearer ${accessToken}`;
            }

            const response = await fetch("/api/chat", {
                method: "POST",
                headers,
                body: JSON.stringify({
                    message: messageText,
                    sessionId,
                    userLocation: location || undefined,
                    confirmSearch: options.confirmSearch,
                    modifySearch: options.modifySearch,
                }),
            });

            const data = await response.json();

            setMessages((prev) => {
                const newMessages = prev.filter((m) => !m.isLoading);

                if (data.success) {
                    // Update session ID and URL without triggering navigation
                    if (data.sessionId && data.sessionId !== sessionId) {
                        setSessionId(data.sessionId);
                        if (isAuthenticated) {
                            // Use history.replaceState to update URL without refresh
                            window.history.replaceState(null, '', `/chat/${data.sessionId}`);
                            setSidebarKey(k => k + 1); // Refresh sidebar
                        }
                    }
                    if (data.data.accumulatedQuery) setCurrentQuery(data.data.accumulatedQuery);

                    const assistantMessage: Message = {
                        id: (Date.now() + 2).toString(),
                        role: "assistant",
                        content: data.data.type === "results"
                            ? `Found ${data.data.products?.length || 0} products for "${data.data.accumulatedQuery?.keyword || 'your search'}"`
                            : data.data.message,
                        products: data.data.products,
                        accumulatedQuery: data.data.accumulatedQuery,
                        quickReplies: data.data.quickReplies,
                        responseType: data.data.type,
                    };

                    return [...newMessages, assistantMessage];
                } else {
                    return [...newMessages, {
                        id: (Date.now() + 2).toString(),
                        role: "assistant",
                        content: data.error || "Something went wrong. Please try again.",
                    }];
                }
            });
        } catch (error) {
            setMessages((prev) => {
                const newMessages = prev.filter((m) => !m.isLoading);
                return [...newMessages, {
                    id: (Date.now() + 2).toString(),
                    role: "assistant",
                    content: "Failed to process your request. Please try again.",
                }];
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await sendMessage(input);
    };

    const handleQuickReply = async (reply: string) => {
        if (reply === "Yes, search now") {
            await sendMessage(reply, { confirmSearch: true });
        } else if (reply === "I want to modify") {
            await sendMessage(reply, { modifySearch: true });
        } else {
            await sendMessage(reply);
        }
    };

    const handleExport = async (format: "xlsx" | "csv") => {
        const lastMessageWithProducts = [...messages].reverse().find((m) => m.products?.length);
        if (!lastMessageWithProducts?.products) return;

        try {
            const response = await fetch("/api/export", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    products: lastMessageWithProducts.products,
                    format,
                }),
            });

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `scrapedgit-results.${format}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Export failed:", error);
        }

        setShowExportMenu(false);
    };

    const hasProducts = messages.some((m) => m.products?.length);

    // Filters Modal Component
    const FiltersModal = () => {
        if (!showFiltersModal || !currentQuery) return null;

        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowFiltersModal(false)}>
                <div className="bg-white dark:bg-dark-800 rounded-2xl p-6 max-w-md w-full mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            <Filter className="w-5 h-5" />
                            Current Search Filters
                        </h3>
                        <button onClick={() => setShowFiltersModal(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg">
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>

                    <div className="space-y-3">
                        <FilterItem label="Product" value={currentQuery.keyword} />
                        <FilterItem label="Brand" value={currentQuery.preferredBrand} />
                        <FilterItem
                            label="Budget"
                            value={currentQuery.minPrice || currentQuery.maxPrice
                                ? formatBudgetRange(currentQuery.minPrice, currentQuery.maxPrice)
                                : null
                            }
                        />
                        <FilterItem label="Category" value={currentQuery.category} />
                        <FilterItem label="Min Rating" value={currentQuery.minRating?.toString()} />
                        <FilterItem label="Location" value={currentQuery.userLocation} />
                        {currentQuery.specConstraints && currentQuery.specConstraints.length > 0 && (
                            <div className="py-2 border-b border-gray-100 dark:border-dark-700">
                                <span className="text-sm text-gray-500 dark:text-gray-400">Specifications:</span>
                                <div className="flex flex-wrap gap-2 mt-1">
                                    {currentQuery.specConstraints.map((spec, i) => (
                                        <span key={i} className="px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-xs rounded-full">
                                            {spec}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="mt-6 flex gap-2">
                        <Button variant="secondary" className="flex-1" onClick={() => setShowFiltersModal(false)}>
                            Close
                        </Button>
                        <Button className="flex-1" onClick={() => { setShowFiltersModal(false); handleQuickReply("I want to modify"); }}>
                            <Edit3 className="w-4 h-4 mr-1" /> Modify
                        </Button>
                    </div>
                </div>
            </div>
        );
    };

    const FilterItem = ({ label, value }: { label: string; value: string | null | undefined }) => (
        <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-dark-700">
            <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
                {value || <span className="text-gray-400">Not set</span>}
            </span>
        </div>
    );

    return (
        <div className="h-screen flex bg-gray-50 dark:bg-dark-950">
            {/* Mobile sidebar overlay */}
            {showMobileSidebar && (
                <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setShowMobileSidebar(false)} />
            )}

            {/* Sidebar - hidden on mobile unless toggled */}
            <div className={`fixed md:relative z-50 h-full transition-transform duration-300 ${showMobileSidebar ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
                <ChatSidebar
                    key={sidebarKey}
                    currentSessionId={sessionId || undefined}
                    onNewChat={handleNewChat}
                    onSelectSession={handleSelectSession}
                    onDeleteSession={handleDeleteSession}
                />
            </div>

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-full overflow-hidden">
                {/* Mobile Header */}
                <div className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-900">
                    <button
                        onClick={() => setShowMobileSidebar(true)}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700"
                    >
                        <Menu className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-gradient-to-r from-primary-500 to-secondary-500 flex items-center justify-center">
                            <Sparkles className="w-3 h-3 text-white" />
                        </div>
                        <span className="font-semibold">ScrapeDgit</span>
                    </div>
                </div>

                <FiltersModal />

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
                    {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center py-20">
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-r from-primary-500 to-secondary-500 flex items-center justify-center mb-6 animate-float">
                                <Sparkles className="w-10 h-10 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                What are you looking for?
                            </h2>
                            <p className="text-gray-500 dark:text-gray-400 max-w-md mb-8">
                                I&apos;ll help you find the best products. You can describe what you need, or just say hi!
                            </p>
                            <div className="flex flex-wrap gap-3 justify-center">
                                {[
                                    "Hi, help me find something",
                                    "Gaming laptop under 15 juta",
                                    "Phone recommendations",
                                    "Wireless earbuds",
                                ].map((suggestion) => (
                                    <button
                                        key={suggestion}
                                        onClick={() => sendMessage(suggestion)}
                                        className="px-4 py-2 rounded-full bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 text-sm text-gray-700 dark:text-gray-300 hover:border-primary-500 hover:text-primary-500 transition-colors"
                                    >
                                        {suggestion}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="max-w-4xl mx-auto space-y-6">
                            {messages.map((message) => (
                                <div
                                    key={message.id}
                                    className={`chat-message flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                                >
                                    <div
                                        className={`${message.products && message.products.length > 0 ? 'w-full' : 'max-w-[85%]'} ${message.role === "user"
                                            ? "bg-primary-500 text-white rounded-2xl rounded-br-md px-4 py-3"
                                            : "bg-white dark:bg-dark-800 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm"
                                            }`}
                                    >
                                        {message.isLoading ? (
                                            <div className="flex items-center gap-2">
                                                <LoadingDots />
                                                <span className="text-gray-500">Processing your request...</span>
                                            </div>
                                        ) : (
                                            <>
                                                <p className={message.role === "user" ? "" : "text-gray-700 dark:text-gray-300"}>
                                                    {message.content}
                                                </p>

                                                {/* Quick Reply Bubbles */}
                                                {message.role === "assistant" && message.quickReplies && message.quickReplies.length > 0 && !message.products && (
                                                    <div className="flex flex-wrap gap-2 mt-3">
                                                        {message.quickReplies.map((reply) => (
                                                            <button
                                                                key={reply}
                                                                onClick={() => handleQuickReply(reply)}
                                                                disabled={isLoading}
                                                                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors disabled:opacity-50
                                                                    ${reply === "Yes, search now" || reply === "No, please search"
                                                                        ? "bg-primary-500 text-white hover:bg-primary-600"
                                                                        : "bg-gray-100 dark:bg-dark-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-dark-600"
                                                                    }`}
                                                            >
                                                                {(reply === "Yes, search now" || reply === "No, please search") && <Check className="w-3 h-3 inline mr-1" />}
                                                                {reply === "I want to modify" && <Edit3 className="w-3 h-3 inline mr-1" />}
                                                                {reply}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Products Table */}
                                                {message.products && message.products.length > 0 && (
                                                    <div className="mt-4">
                                                        <div className="overflow-x-auto">
                                                            <table className="w-full text-sm">
                                                                <thead>
                                                                    <tr className="border-b border-gray-200 dark:border-dark-700">
                                                                        <th className="text-left py-2 px-2 font-medium text-gray-500">#</th>
                                                                        <th className="text-left py-2 px-2 font-medium text-gray-500">Product</th>
                                                                        <th className="text-left py-2 px-2 font-medium text-gray-500">Price</th>
                                                                        <th className="text-left py-2 px-2 font-medium text-gray-500">Rating</th>
                                                                        <th className="text-left py-2 px-2 font-medium text-gray-500">Sold</th>
                                                                        <th className="text-left py-2 px-2 font-medium text-gray-500">Score</th>
                                                                        <th className="text-left py-2 px-2 font-medium text-gray-500"></th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {message.products.slice(
                                                                        (productPage[message.id] || 0) * PRODUCTS_PER_PAGE,
                                                                        ((productPage[message.id] || 0) + 1) * PRODUCTS_PER_PAGE
                                                                    ).map((product, index) => (
                                                                        <tr key={index} className="border-b border-gray-100 dark:border-dark-700 hover:bg-gray-50 dark:hover:bg-dark-700/50">
                                                                            <td className="py-2 px-2 text-gray-500">{product.rank}</td>
                                                                            <td className="py-2 px-2">
                                                                                <div className="flex items-center gap-2">
                                                                                    {product.imageUrl && (
                                                                                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 dark:bg-dark-700 flex-shrink-0">
                                                                                            <Image
                                                                                                src={product.imageUrl}
                                                                                                alt={product.name}
                                                                                                width={40}
                                                                                                height={40}
                                                                                                className="object-cover w-full h-full"
                                                                                                unoptimized
                                                                                            />
                                                                                        </div>
                                                                                    )}
                                                                                    <div className="min-w-0">
                                                                                        <p className="font-medium text-gray-900 dark:text-white truncate max-w-[200px]">
                                                                                            {product.name}
                                                                                        </p>
                                                                                        <p className="text-xs text-gray-500 capitalize">{product.source}</p>
                                                                                    </div>
                                                                                </div>
                                                                            </td>
                                                                            <td className="py-2 px-2 font-medium text-gray-900 dark:text-white whitespace-nowrap">
                                                                                Rp {product.price.toLocaleString("id-ID")}
                                                                            </td>
                                                                            <td className="py-2 px-2">
                                                                                <div className="flex items-center gap-1">
                                                                                    <Star className="w-3 h-3 text-yellow-500 fill-current" />
                                                                                    <span className="text-gray-700 dark:text-gray-300">{product.rating.toFixed(1)}</span>
                                                                                </div>
                                                                            </td>
                                                                            <td className="py-2 px-2 text-gray-600 dark:text-gray-400">
                                                                                {product.soldCount.toLocaleString()}
                                                                            </td>
                                                                            <td className="py-2 px-2">
                                                                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300">
                                                                                    {product.finalScore.toFixed(1)}
                                                                                </span>
                                                                            </td>
                                                                            <td className="py-2 px-2">
                                                                                <a
                                                                                    href={product.productLink}
                                                                                    target="_blank"
                                                                                    rel="noopener noreferrer"
                                                                                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-600 inline-flex"
                                                                                >
                                                                                    <ExternalLink className="w-4 h-4 text-gray-500" />
                                                                                </a>
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                        {message.products.length > PRODUCTS_PER_PAGE && (
                                                            <div className="flex items-center justify-between mt-4 text-sm">
                                                                <span className="text-gray-500">
                                                                    Showing {((productPage[message.id] || 0) * PRODUCTS_PER_PAGE) + 1}-{Math.min(((productPage[message.id] || 0) + 1) * PRODUCTS_PER_PAGE, message.products.length)} of {message.products.length}
                                                                </span>
                                                                <div className="flex gap-2">
                                                                    <button
                                                                        onClick={() => setProductPage(prev => ({ ...prev, [message.id]: Math.max(0, (prev[message.id] || 0) - 1) }))}
                                                                        disabled={(productPage[message.id] || 0) === 0}
                                                                        className="p-1.5 rounded-lg bg-gray-100 dark:bg-dark-700 disabled:opacity-50 hover:bg-gray-200 dark:hover:bg-dark-600"
                                                                    >
                                                                        <ChevronLeft className="w-4 h-4" />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => setProductPage(prev => ({ ...prev, [message.id]: (prev[message.id] || 0) + 1 }))}
                                                                        disabled={((productPage[message.id] || 0) + 1) * PRODUCTS_PER_PAGE >= message.products.length}
                                                                        className="p-1.5 rounded-lg bg-gray-100 dark:bg-dark-700 disabled:opacity-50 hover:bg-gray-200 dark:hover:bg-dark-600"
                                                                    >
                                                                        <ChevronRight className="w-4 h-4" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="border-t border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-900 px-4 py-4">
                    <div className="max-w-4xl mx-auto">
                        {/* Location, Filters & Export */}
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Your city (e.g., Jakarta)"
                                        value={location}
                                        onChange={(e) => setLocation(e.target.value)}
                                        className="text-sm bg-transparent border-none focus:outline-none text-gray-600 dark:text-gray-400 placeholder-gray-400 w-40"
                                    />
                                </div>

                                {/* Show Filters Button */}
                                {currentQuery && currentQuery.keyword && (
                                    <button
                                        onClick={() => setShowFiltersModal(true)}
                                        className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 text-sm font-medium hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors"
                                    >
                                        <Filter className="w-3.5 h-3.5" />
                                        Filters
                                        <span className="ml-1 px-1.5 py-0.5 bg-primary-500 text-white text-xs rounded-full">
                                            {[
                                                currentQuery.keyword,
                                                currentQuery.preferredBrand,
                                                currentQuery.minPrice || currentQuery.maxPrice,
                                                currentQuery.specConstraints?.length
                                            ].filter(Boolean).length}
                                        </span>
                                    </button>
                                )}
                            </div>

                            {hasProducts && (
                                <div className="relative">
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => setShowExportMenu(!showExportMenu)}
                                        leftIcon={<Download className="w-4 h-4" />}
                                        rightIcon={<ChevronDown className="w-3 h-3" />}
                                    >
                                        Export
                                    </Button>
                                    {showExportMenu && (
                                        <div className="absolute right-0 bottom-full mb-2 bg-white dark:bg-dark-800 rounded-lg shadow-lg p-2 min-w-[140px] border border-gray-200 dark:border-dark-700">
                                            <button
                                                onClick={() => handleExport("xlsx")}
                                                className="flex items-center gap-2 w-full px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700 text-sm"
                                            >
                                                <FileSpreadsheet className="w-4 h-4 text-green-600" />
                                                Excel (.xlsx)
                                            </button>
                                            <button
                                                onClick={() => handleExport("csv")}
                                                className="flex items-center gap-2 w-full px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700 text-sm"
                                            >
                                                <FileText className="w-4 h-4 text-blue-600" />
                                                CSV (.csv)
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Input Form */}
                        <form onSubmit={handleSubmit} className="flex gap-3">
                            <div className="flex-1 relative">
                                <input
                                    type="text"
                                    placeholder="Describe what you're looking for..."
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 dark:border-dark-600 bg-gray-50 dark:bg-dark-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    disabled={isLoading}
                                />
                                <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            </div>
                            <Button
                                type="submit"
                                disabled={!input.trim() || isLoading}
                                isLoading={isLoading}
                                leftIcon={<Send className="w-4 h-4" />}
                            >
                                Send
                            </Button>
                        </form>

                        <p className="text-xs text-center text-gray-400 mt-3">
                            ScrapeDgit searches across Tokopedia, Shopee, Lazada & Blibli
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}
