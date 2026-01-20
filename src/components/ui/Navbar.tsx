"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, User, LogOut, History, Sparkles } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";

export function Navbar() {
    const { user, isAuthenticated, logout, isLoading } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 glass">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    {/* Logo */}
                    <div className="flex items-center">
                        <Link href="/" className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-primary-500 to-secondary-500 flex items-center justify-center">
                                <Sparkles className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xl font-bold gradient-text">ScrapeDgit</span>
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-6">
                        <Link
                            href="/chat"
                            className="text-gray-600 dark:text-gray-300 hover:text-primary-500 transition-colors font-medium"
                        >
                            Search
                        </Link>
                        {!isLoading && isAuthenticated && user ? (
                            <>
                                <Link
                                    href="/history"
                                    className="text-gray-600 dark:text-gray-300 hover:text-primary-500 transition-colors font-medium"
                                >
                                    History
                                </Link>
                                <div className="relative group">
                                    <button className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-primary-500 transition-colors">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 flex items-center justify-center">
                                            <User className="w-4 h-4 text-white" />
                                        </div>
                                        <span className="font-medium">{user.name || "User"}</span>
                                    </button>
                                    <div className="absolute right-0 mt-2 w-48 card p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                                        <Link
                                            href="/history"
                                            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700 text-gray-700 dark:text-gray-300"
                                        >
                                            <History className="w-4 h-4" />
                                            <span>History</span>
                                        </Link>
                                        <button
                                            onClick={logout}
                                            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700 text-gray-700 dark:text-gray-300"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            <span>Logout</span>
                                        </button>
                                    </div>
                                </div>
                            </>
                        ) : !isLoading ? (
                            <>
                                <Link
                                    href="/auth/login"
                                    className="text-gray-600 dark:text-gray-300 hover:text-primary-500 transition-colors font-medium"
                                >
                                    Login
                                </Link>
                                <Link
                                    href="/auth/register"
                                    className="btn btn-primary"
                                >
                                    Get Started
                                </Link>
                            </>
                        ) : null}
                    </div>

                    {/* Mobile menu button */}
                    <div className="md:hidden flex items-center">
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700"
                        >
                            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Navigation */}
            {isMenuOpen && (
                <div className="md:hidden glass border-t border-gray-200 dark:border-dark-700">
                    <div className="px-4 py-4 space-y-2">
                        <Link
                            href="/chat"
                            className="block px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            Search
                        </Link>
                        {isAuthenticated && user ? (
                            <>
                                <Link
                                    href="/history"
                                    className="block px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    History
                                </Link>
                                <button
                                    onClick={() => {
                                        logout();
                                        setIsMenuOpen(false);
                                    }}
                                    className="block w-full text-left px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700"
                                >
                                    Logout
                                </button>
                            </>
                        ) : (
                            <>
                                <Link
                                    href="/auth/login"
                                    className="block px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    Login
                                </Link>
                                <Link
                                    href="/auth/register"
                                    className="block px-4 py-2 rounded-lg bg-primary-500 text-white text-center"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    Get Started
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
}

export default Navbar;
