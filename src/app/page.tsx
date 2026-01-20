import Link from "next/link";
import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/ui/Footer";
import { Sparkles, Search, Zap, Shield, ArrowRight, Star, TrendingUp, MapPin } from "lucide-react";

export default function HomePage() {
    return (
        <div className="min-h-screen flex flex-col">
            <Navbar />

            {/* Hero Section */}
            <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center">
                        {/* Badge */}
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 text-sm font-medium mb-6">
                            <Sparkles className="w-4 h-4" />
                            <span>AI-Powered E-commerce Search</span>
                        </div>

                        {/* Headline */}
                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 dark:text-white mb-6 leading-tight">
                            Find the{" "}
                            <span className="gradient-text">Best Products</span>
                            <br />
                            Across Indonesian Marketplaces
                        </h1>

                        {/* Subheadline */}
                        <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-8">
                            Search naturally, get smart recommendations. We scrape real-time data from
                            Tokopedia, Shopee, Lazada, Blibli & Bukalapak and rank products based on
                            price, shipping, ratings, and popularity.
                        </p>

                        {/* CTA Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                href="/chat"
                                className="btn btn-primary text-lg px-8 py-4 group"
                            >
                                <Search className="w-5 h-5 mr-2" />
                                Try Now - It&apos;s Free
                                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                            </Link>
                            <Link
                                href="/auth/register"
                                className="btn btn-secondary text-lg px-8 py-4"
                            >
                                Create Account
                            </Link>
                        </div>

                        {/* Trust indicators */}
                        <div className="mt-12 flex flex-wrap justify-center gap-8 text-gray-500 dark:text-gray-400">
                            <div className="flex items-center gap-2">
                                <Shield className="w-5 h-5 text-green-500" />
                                <span>100% Free</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Zap className="w-5 h-5 text-yellow-500" />
                                <span>Real-time Data</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Star className="w-5 h-5 text-primary-500" />
                                <span>AI Recommendations</span>
                            </div>
                        </div>
                    </div>

                    {/* Demo Preview */}
                    <div className="mt-16 relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-primary-500/20 via-secondary-500/20 to-primary-500/20 blur-3xl" />
                        <div className="relative card p-6 sm:p-8 max-w-4xl mx-auto">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-3 h-3 rounded-full bg-red-500" />
                                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                                <div className="w-3 h-3 rounded-full bg-green-500" />
                            </div>
                            <div className="bg-gray-50 dark:bg-dark-900 rounded-lg p-4">
                                <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400 mb-4">
                                    <Search className="w-5 h-5" />
                                    <span className="font-mono">&quot;Gaming laptop under 15 million rupiah&quot;</span>
                                </div>
                                <div className="space-y-3">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="flex items-center gap-4 bg-white dark:bg-dark-800 rounded-lg p-3 animate-pulse">
                                            <div className="w-16 h-16 rounded-lg bg-gray-200 dark:bg-dark-700" />
                                            <div className="flex-1">
                                                <div className="h-4 bg-gray-200 dark:bg-dark-700 rounded w-3/4 mb-2" />
                                                <div className="h-3 bg-gray-200 dark:bg-dark-700 rounded w-1/2" />
                                            </div>
                                            <div className="text-right">
                                                <div className="h-4 bg-primary-100 dark:bg-primary-900/30 rounded w-20 mb-2" />
                                                <div className="h-3 bg-gray-200 dark:bg-dark-700 rounded w-16" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-dark-900">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                            How It Works
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
                            Our AI-powered engine makes finding the perfect product simple and fast.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Feature 1 */}
                        <div className="card p-6 text-center hover:shadow-xl transition-shadow">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-r from-primary-500 to-primary-600 flex items-center justify-center mx-auto mb-4">
                                <Search className="w-7 h-7 text-white" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                1. Describe Your Need
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400">
                                Just type what you&apos;re looking for in natural language.
                                Our AI understands your intent and preferences.
                            </p>
                        </div>

                        {/* Feature 2 */}
                        <div className="card p-6 text-center hover:shadow-xl transition-shadow">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-r from-secondary-500 to-secondary-600 flex items-center justify-center mx-auto mb-4">
                                <Zap className="w-7 h-7 text-white" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                2. We Scrape Real-Time
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400">
                                We search across 5 major Indonesian e-commerce platforms
                                to find all matching products instantly.
                            </p>
                        </div>

                        {/* Feature 3 */}
                        <div className="card p-6 text-center hover:shadow-xl transition-shadow">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 flex items-center justify-center mx-auto mb-4">
                                <TrendingUp className="w-7 h-7 text-white" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                3. Smart Ranking
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400">
                                Our algorithm ranks products by price, shipping cost,
                                ratings, and popularity to show you the best options first.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Scoring Section */}
            <section className="py-16 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-6">
                                Our Smart Scoring Algorithm
                            </h2>
                            <p className="text-gray-600 dark:text-gray-400 mb-8">
                                We don&apos;t just show you random results. Our weighted algorithm calculates
                                a final score based on what matters most to Indonesian shoppers.
                            </p>

                            <div className="space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-full bg-gray-200 dark:bg-dark-700 rounded-full h-4 flex-1">
                                        <div className="bg-primary-500 h-4 rounded-full" style={{ width: "50%" }} />
                                    </div>
                                    <span className="text-sm font-medium w-32">Price (50%)</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="w-full bg-gray-200 dark:bg-dark-700 rounded-full h-4 flex-1">
                                        <div className="bg-secondary-500 h-4 rounded-full" style={{ width: "25%" }} />
                                    </div>
                                    <span className="text-sm font-medium w-32">Shipping (25%)</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="w-full bg-gray-200 dark:bg-dark-700 rounded-full h-4 flex-1">
                                        <div className="bg-orange-500 h-4 rounded-full" style={{ width: "15%" }} />
                                    </div>
                                    <span className="text-sm font-medium w-32">Sold Count (15%)</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="w-full bg-gray-200 dark:bg-dark-700 rounded-full h-4 flex-1">
                                        <div className="bg-yellow-500 h-4 rounded-full" style={{ width: "10%" }} />
                                    </div>
                                    <span className="text-sm font-medium w-32">Rating (10%)</span>
                                </div>
                            </div>
                        </div>

                        <div className="card p-6">
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-primary-500" />
                                Location-Based Shipping
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-4">
                                Tell us your city, and we&apos;ll estimate shipping costs from each seller
                                to give you a more accurate total price comparison.
                            </p>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="bg-gray-50 dark:bg-dark-700 rounded-lg p-3">
                                    <p className="font-medium text-gray-900 dark:text-white">Jakarta</p>
                                    <p className="text-gray-500">Shipping: Rp 10,000</p>
                                </div>
                                <div className="bg-gray-50 dark:bg-dark-700 rounded-lg p-3">
                                    <p className="font-medium text-gray-900 dark:text-white">Surabaya</p>
                                    <p className="text-gray-500">Shipping: Rp 25,000</p>
                                </div>
                                <div className="bg-gray-50 dark:bg-dark-700 rounded-lg p-3">
                                    <p className="font-medium text-gray-900 dark:text-white">Bandung</p>
                                    <p className="text-gray-500">Shipping: Rp 15,000</p>
                                </div>
                                <div className="bg-gray-50 dark:bg-dark-700 rounded-lg p-3">
                                    <p className="font-medium text-gray-900 dark:text-white">Medan</p>
                                    <p className="text-gray-500">Shipping: Rp 35,000</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-16 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto">
                    <div className="card p-8 sm:p-12 text-center bg-gradient-to-r from-primary-500 to-secondary-500">
                        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                            Ready to Find Your Perfect Product?
                        </h2>
                        <p className="text-white/80 mb-8 max-w-xl mx-auto">
                            Start searching now and discover the best deals across all Indonesian
                            e-commerce platforms in seconds.
                        </p>
                        <Link
                            href="/chat"
                            className="inline-flex items-center gap-2 bg-white text-primary-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                        >
                            <Search className="w-5 h-5" />
                            Start Searching
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
}
