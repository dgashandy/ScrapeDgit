import Link from "next/link";
import { Sparkles, Github, Twitter, Mail } from "lucide-react";

export function Footer() {
    return (
        <footer className="bg-dark-900 text-gray-400">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Brand */}
                    <div className="col-span-1 md:col-span-2">
                        <Link href="/" className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-primary-500 to-secondary-500 flex items-center justify-center">
                                <Sparkles className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xl font-bold text-white">ScrapeDgit</span>
                        </Link>
                        <p className="text-gray-500 max-w-sm">
                            AI-powered e-commerce search engine for Indonesian marketplaces.
                            Find the best products with smart recommendations.
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-white font-semibold mb-4">Quick Links</h3>
                        <ul className="space-y-2">
                            <li>
                                <Link href="/chat" className="hover:text-primary-400 transition-colors">
                                    Search Products
                                </Link>
                            </li>
                            <li>
                                <Link href="/history" className="hover:text-primary-400 transition-colors">
                                    Chat History
                                </Link>
                            </li>
                            <li>
                                <Link href="/auth/login" className="hover:text-primary-400 transition-colors">
                                    Login
                                </Link>
                            </li>
                            <li>
                                <Link href="/auth/register" className="hover:text-primary-400 transition-colors">
                                    Register
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Platforms */}
                    <div>
                        <h3 className="text-white font-semibold mb-4">Supported Platforms</h3>
                        <ul className="space-y-2">
                            <li className="hover:text-primary-400 transition-colors">Tokopedia</li>
                            <li className="hover:text-primary-400 transition-colors">Shopee</li>
                            <li className="hover:text-primary-400 transition-colors">Lazada</li>
                            <li className="hover:text-primary-400 transition-colors">Blibli</li>
                            <li className="hover:text-primary-400 transition-colors">Bukalapak</li>
                        </ul>
                    </div>
                </div>

                {/* Bottom */}
                <div className="border-t border-dark-700 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-gray-500 text-sm">
                        © {new Date().getFullYear()} ScrapeDgit. All rights reserved.
                    </p>
                    <div className="flex items-center gap-4">
                        <a href="#" className="hover:text-primary-400 transition-colors">
                            <Github className="w-5 h-5" />
                        </a>
                        <a href="#" className="hover:text-primary-400 transition-colors">
                            <Twitter className="w-5 h-5" />
                        </a>
                        <a href="#" className="hover:text-primary-400 transition-colors">
                            <Mail className="w-5 h-5" />
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
}

export default Footer;
