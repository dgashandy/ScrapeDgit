import { clsx } from "clsx";

interface LoadingSpinnerProps {
    size?: "sm" | "md" | "lg";
    className?: string;
}

export function LoadingSpinner({ size = "md", className }: LoadingSpinnerProps) {
    const sizes = {
        sm: "w-4 h-4",
        md: "w-8 h-8",
        lg: "w-12 h-12",
    };

    return (
        <div className={clsx("flex items-center justify-center", className)}>
            <div
                className={clsx(
                    "animate-spin rounded-full border-2 border-gray-200 border-t-primary-500",
                    sizes[size]
                )}
            />
        </div>
    );
}

export function LoadingDots() {
    return (
        <div className="loading-dots flex gap-1">
            <span className="w-2 h-2 rounded-full bg-primary-500" />
            <span className="w-2 h-2 rounded-full bg-primary-500" />
            <span className="w-2 h-2 rounded-full bg-primary-500" />
        </div>
    );
}

export function PageLoader() {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
                <LoadingSpinner size="lg" />
                <p className="mt-4 text-gray-500">Loading...</p>
            </div>
        </div>
    );
}

export default LoadingSpinner;
