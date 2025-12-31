import React from "react";

interface SkeletonProps {
	className?: string;
}

const SkeletonRect: React.FC<SkeletonProps> = ({ className = "" }) => (
	<div className={`animate-pulse rounded-md bg-bg-tertiary-light dark:bg-bg-tertiary-dark bg-opacity-60 ${className}`} />
);

export const DailyRCVAPageSkeleton: React.FC<{ isRC: boolean }> = ({ isRC }) => {
	return (
		<div className="h-screen flex flex-col bg-bg-primary-light dark:bg-bg-primary-dark">
			{/* Header Skeleton */}
			<header className="shrink-0 h-16 px-6 border-b border-border-light dark:border-border-dark flex items-center justify-between">
				<SkeletonRect className="h-6 w-48" />
				<div className="flex items-center gap-4">
					<SkeletonRect className="h-2 w-32 rounded-full" />
					<SkeletonRect className="h-4 w-12" />
				</div>
			</header>

			{/* Main Body Skeleton */}
			<div className="flex-1 flex overflow-hidden">
				<div className="flex-1 flex flex-col md:flex-row h-full">
					{isRC && (
						<div className="w-full md:w-1/2 h-1/2 md:h-full border-b-2 md:border-b-0 md:border-r-2 border-border-light dark:border-border-dark flex flex-col">
							<div className="p-4 border-b border-border-light dark:border-border-dark">
								<SkeletonRect className="h-6 w-3/4 mb-2" />
								<SkeletonRect className="h-3 w-1/2" />
							</div>
							<div className="flex-1 p-6 space-y-4 overflow-hidden">
								<SkeletonRect className="h-4 w-full" />
								<SkeletonRect className="h-4 w-full" />
								<SkeletonRect className="h-4 w-5/6" />
								<SkeletonRect className="h-4 w-full" />
								<SkeletonRect className="h-4 w-4/5" />
								<SkeletonRect className="h-4 w-full" />
							</div>
						</div>
					)}
					<div className={`flex-1 h-full flex flex-col ${isRC ? "md:w-1/2" : "w-full"}`}>
						<div className="p-6 space-y-6 flex-1 overflow-hidden">
							<div className="flex gap-2">
								<SkeletonRect className="h-6 w-24 rounded-full" />
								<SkeletonRect className="h-6 w-20 rounded-full" />
							</div>
							<SkeletonRect className="h-8 w-full" />
							<div className="space-y-3">
								{[1, 2, 3, 4].map((i) => (
									<SkeletonRect key={i} className="h-16 w-full rounded-xl" />
								))}
							</div>
						</div>
					</div>
				</div>

				{/* Palette Skeleton */}
				<div className="hidden md:flex w-64 border-l border-border-light dark:border-border-dark flex-col">
					<div className="p-4 border-b border-border-light dark:border-border-dark">
						<SkeletonRect className="h-5 w-32" />
					</div>
					<div className="p-4 border-b border-border-light dark:border-border-dark space-y-2">
						<SkeletonRect className="h-3 w-full" />
						<SkeletonRect className="h-3 w-full" />
						<SkeletonRect className="h-3 w-full" />
					</div>
					<div className="p-4 grid grid-cols-5 gap-2">
						{[...Array(10)].map((_, i) => (
							<SkeletonRect key={i} className="aspect-square w-full rounded-lg" />
						))}
					</div>
				</div>
			</div>

			{/* Footer Skeleton */}
			<footer className="shrink-0 h-20 px-6 border-t border-border-light dark:border-border-dark flex items-center justify-between">
				<div className="flex gap-3">
					<SkeletonRect className="h-12 w-32 rounded-xl" />
					<SkeletonRect className="h-12 w-48 rounded-xl" />
				</div>
				<div className="flex gap-3">
					<SkeletonRect className="h-12 w-32 rounded-xl" />
					<SkeletonRect className="h-12 w-24 rounded-xl" />
				</div>
			</footer>
		</div>
	);
};
