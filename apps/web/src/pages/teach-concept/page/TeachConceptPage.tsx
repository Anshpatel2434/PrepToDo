import { useState } from "react";
import { motion } from "framer-motion";
import { useTeachConceptMutation } from "../redux_usecases/teachConceptApi";
import { useTheme } from "../../../context/ThemeContext";

type theory = string;

const TeachConceptPage = () => {
	const { isDark } = useTheme();
	const [teachConcept, { isLoading }] = useTeachConceptMutation();
	const theoryQuery = "How to identify the authors Tone ? ";

	const [theoryText, setTheoryText] = useState<theory>();

	async function handleSendRequest() {
		try {
			// Note: Unwrap is often cleaner here, but keeping your logic distinct

			const data = await teachConcept({ conceptQuery: theoryQuery }).unwrap();
			if (data?.explanation) {
				const temp = data?.explanation;
				setTheoryText(temp);
			}
		} catch (error) {
			console.log(error);
		}
	}

	return (
		<div className={`min-h-screen relative overflow-hidden flex items-center justify-center p-4 ${isDark ? "bg-bg-primary-dark" : "bg-bg-primary-light"}`}>
			{/* Liquid Background */}
			<div className="absolute inset-0 pointer-events-none">
				<div
					className={`absolute inset-0 ${isDark
						? "bg-[radial-gradient(circle_at_50%_50%,_rgba(17,24,39,0)_0%,_rgba(17,24,39,1)_100%)]"
						: "bg-[radial-gradient(circle_at_50%_50%,_rgba(255,255,255,0)_0%,_rgba(255,255,255,1)_100%)]"
						} z-10`}
				/>
				<motion.div
					animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.3, 0.1], rotate: [0, 90, 0] }}
					transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
					className={`absolute -top-[20%] -left-[10%] w-[70vw] h-[70vw] rounded-full blur-[100px] opacity-30 ${isDark ? "bg-brand-primary-dark/20" : "bg-brand-primary-light/20"}`}
				/>
				<motion.div
					animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.2, 0.1], x: [0, 50, 0] }}
					transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
					className={`absolute top-[40%] -right-[10%] w-[60vw] h-[60vw] rounded-full blur-[100px] opacity-20 ${isDark ? "bg-brand-accent-dark/20" : "bg-brand-accent-light/20"}`}
				/>
			</div>

			<div className={`relative z-20 w-full max-w-2xl rounded-3xl overflow-hidden border backdrop-blur-xl shadow-2xl ${isDark ? "bg-white/5 border-white/10" : "bg-white/70 border-white/40"}`}>
				{/* Header / Query Section */}
				<div className={`p-8 ${isDark ? "bg-black/20" : "bg-white/40"}`}>
					<h2 className={`text-xs font-bold tracking-widest uppercase mb-3 flex items-center gap-2 ${isDark ? "text-brand-accent-dark" : "text-brand-accent-light"}`}>
						<span className={`w-2 h-2 rounded-full ${isDark ? "bg-brand-accent-dark" : "bg-brand-accent-light"}`}></span>
						Current Query
					</h2>
					<p className={`text-2xl font-serif font-medium leading-relaxed ${isDark ? "text-text-primary-dark" : "text-gray-900"}`}>"{theoryQuery}"</p>
				</div>

				{/* Content Area */}
				<div className="p-8 flex flex-col gap-8">
					{/* Action Button */}
					<button
						onClick={handleSendRequest}
						disabled={isLoading}
						className={`
                            group w-full py-4 px-6 rounded-2xl font-bold text-lg tracking-wide transition-all duration-300 transform 
                            flex items-center justify-center gap-3
                            ${isLoading
								? "bg-gray-500/10 text-gray-400 cursor-not-allowed border border-gray-500/20"
								: isDark
									? "bg-linear-to-r from-brand-primary-dark to-brand-accent-dark text-white hover:shadow-lg hover:shadow-brand-primary-dark/20 hover:-translate-y-1"
									: "bg-linear-to-r from-brand-primary-light to-brand-accent-light text-white hover:shadow-lg hover:shadow-brand-primary-light/20 hover:-translate-y-1"
							}
                        `}
					>
						{isLoading ? (
							<>
								<div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
								<span>Generating Explanation...</span>
							</>
						) : (
							<>
								<span>Teach Me Concept</span>
								<span className="group-hover:translate-x-1 transition-transform">→</span>
							</>
						)}
					</button>

					{/* Result / Loading State */}
					<div className="min-h-[200px] flex flex-col justify-center">
						{isLoading ? (
							<div className="text-center space-y-4">
								<p className={`text-sm animate-pulse ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"}`}>
									Analyzing concept structure...
								</p>
							</div>
						) : theoryText ? (
							<motion.div
								initial={{ opacity: 0, y: 10 }}
								animate={{ opacity: 1, y: 0 }}
								className={`rounded-2xl p-8 border backdrop-blur-md relative overflow-hidden ${isDark ? "bg-white/5 border-white/5" : "bg-white/50 border-white/40"}`}
							>
								<div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-brand-primary-dark to-brand-accent-dark opacity-50" />
								<h3 className={`text-xs font-bold mb-4 uppercase tracking-widest ${isDark ? "text-text-muted-dark" : "text-text-muted-light"}`}>
									Explanation
								</h3>
								<div className={`leading-8 text-lg font-light ${isDark ? "text-text-primary-dark" : "text-gray-800"}`}>
									{theoryText}
								</div>
							</motion.div>
						) : (
							<div className={`text-center py-12 ${isDark ? "text-text-muted-dark" : "text-text-muted-light"}`}>
								<div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${isDark ? "bg-white/5" : "bg-black/5"}`}>
									<span className="text-2xl">💡</span>
								</div>
								<p>Ready to explain detailed concepts.</p>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
};

export default TeachConceptPage;
