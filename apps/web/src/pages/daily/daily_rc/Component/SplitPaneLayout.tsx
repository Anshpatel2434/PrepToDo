import React, { useRef, useCallback } from "react";
import { motion } from "framer-motion";

interface SplitPaneLayoutProps {
	isDark: boolean;
	passage: any | null;
	children: React.ReactNode;
	showPassage: boolean;
	isExamMode: boolean;
}

export const SplitPaneLayout: React.FC<SplitPaneLayoutProps> = ({
	isDark,
	passage,
	children,
	showPassage,
	isExamMode,
}) => {
	const passageRef = useRef<HTMLDivElement>(null);

	// Handle text selection for vocab tooltip (Solution mode only)
	const handleTextSelection = useCallback(() => {
		if (isExamMode) return;

		const selection = window.getSelection();
		if (selection && selection.toString().trim()) {
			// Show "Add to Vocab" tooltip
			// This is a placeholder - actual implementation would show a tooltip
			console.log("Selected text:", selection.toString());
		}
	}, [isExamMode]);

	return (
		<div className="h-full flex">
			{/* Left Pane - Passage */}
			<motion.div
				className={`
                    h-full overflow-hidden flex flex-col
                    ${showPassage ? "w-1/2" : "w-0"}
                    transition-all duration-300 ease-in-out
                `}
				initial={{ width: "50%" }}
				animate={{ width: showPassage ? "50%" : "0%" }}
			>
				<div
					className={`
                    h-full flex flex-col border-r-2
                    ${
											isDark
												? "bg-bg-secondary-dark border-border-dark"
												: "bg-bg-secondary-light border-border-light"
										}
                `}
				>
					{/* Passage Header */}
					<div
						className={`
                        shrink-0 p-4 border-b
                        ${isDark ? "border-border-dark" : "border-border-light"}
                    `}
					>
						<div className="flex items-center justify-between">
							<div>
								<h2
									className={`
                                    font-serif font-semibold text-lg
                                    ${
																			isDark
																				? "text-text-primary-dark"
																				: "text-text-primary-light"
																		}
                                `}
								>
									{passage?.title || "Passage"}
								</h2>
								<p
									className={`
                                    text-xs mt-1
                                    ${
																			isDark
																				? "text-text-muted-dark"
																				: "text-text-muted-light"
																		}
                                `}
								>
									{passage?.genre && `${passage.genre} • `}
									{passage?.content &&
										`${passage.content.split(/\s+/).length} words`}
								</p>
							</div>
							<span
								className={`
                                px-2 py-1 rounded text-xs font-medium uppercase
                                ${
																	isDark
																		? "bg-brand-primary-dark/30 text-brand-primary-dark"
																		: "bg-brand-primary-light/20 text-brand-primary-light"
																}
                            `}
							>
								{isExamMode ? "Exam Mode" : "Solution Mode"}
							</span>
						</div>
					</div>

					{/* Passage Content */}
					<div
						ref={passageRef}
						className={`
                            flex-1 overflow-y-auto p-6 prose max-w-none
                            ${isExamMode ? "select-none" : ""}
                            ${
															isDark
																? "prose-invert prose-slate text-text-secondary-dark scrollbar-dark"
																: "prose-slate text-text-secondary-light scrollbar-light"
														}
                        `}
						onMouseUp={handleTextSelection}
						onCopy={(e) => {
							if (isExamMode) {
								e.preventDefault();
							}
						}}
					>
						{passage?.content ? (
							<div
								className={`
                                    font-serif leading-loose text-lg
                                    ${
																			isDark
																				? "text-text-secondary-dark"
																				: "text-text-secondary-light"
																		}
                                `}
								dangerouslySetInnerHTML={{ __html: passage.content }}
							/>
						) : (
							<div
								className={`
                                flex items-center justify-center h-full
                                ${
																	isDark
																		? "text-text-muted-dark"
																		: "text-text-muted-light"
																}
                            `}
							>
								<p>No passage available</p>
							</div>
						)}
					</div>

					{/* Copy Protection Notice (Exam Mode) */}
					{isExamMode && (
						<div
							className={`
                            shrink-0 px-4 py-2 text-center text-xs
                            ${
															isDark
																? "bg-bg-tertiary-dark text-text-muted-dark"
																: "bg-bg-tertiary-light text-text-muted-light"
														}
                        `}
						>
							Text selection is disabled during the exam
						</div>
					)}
				</div>
			</motion.div>

			{/* Right Pane - Question */}
			<motion.div
				className={`
                    h-full flex flex-col
                    ${showPassage ? "w-1/2" : "w-full"}
                    transition-all duration-300 ease-in-out
                `}
				initial={{ width: "50%" }}
				animate={{ width: showPassage ? "50%" : "100%" }}
			>
				<div
					className={`
                    h-full flex flex-col
                    ${isDark ? "bg-bg-primary-dark" : "bg-bg-primary-light"}
                `}
				>
					{children}
				</div>
			</motion.div>
		</div>
	);
};

export default SplitPaneLayout;
