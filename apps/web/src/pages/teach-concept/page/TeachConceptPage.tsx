import { useState } from "react";
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
			console.log("we are here hehe");
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
		<div className={`min-h-screen flex items-center justify-center p-4 ${isDark ? "bg-bg-primary-dark" : "bg-bg-primary-light"}`}>
			<div className={`w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden border ${isDark ? "bg-bg-secondary-dark border-border-dark" : "bg-bg-secondary-light border-border-light"}`}>
				{/* Header / Query Section */}
				<div className={`p-8 ${isDark ? "bg-bg-tertiary-dark" : "bg-brand-primary-light"}`}>
					<h2 className={`text-xs font-bold tracking-widest uppercase mb-2 ${isDark ? "text-brand-accent-dark" : "text-brand-accent-light"}`}>
						Current Query
					</h2>
					<p className={`text-xl font-medium leading-relaxed ${isDark ? "text-text-primary-dark" : "text-white"}`}>"{theoryQuery}"</p>
				</div>

				{/* Content Area */}
				<div className="p-8 flex flex-col gap-6">
					{/* Action Button */}
					<button
						onClick={handleSendRequest}
						disabled={isLoading}
						className={`
                            w-full py-4 px-6 rounded-lg font-bold text-lg transition-all duration-200 shadow-md hover:cursor-pointer
                            ${isLoading
								? isDark
									? "bg-bg-tertiary-dark text-text-muted-dark cursor-not-allowed border-2 border-border-dark"
									: "bg-bg-tertiary-light text-text-muted-light cursor-not-allowed border-2 border-border-light"
								: isDark
									? "bg-brand-primary-dark hover:bg-brand-primary-hover-dark text-white hover:shadow-lg active:scale-[0.98]"
									: "bg-brand-primary-light hover:bg-brand-primary-hover-light text-white hover:shadow-lg active:scale-[0.98]"
							}
                        `}
					>
						{isLoading ? "Processing..." : "Ab to sikhade yaar 🚀"}
					</button>

					<hr className={`${isDark ? "border-border-dark" : "border-border-light"}`} />

					{/* Result / Loading State */}
					<div className="min-h-[200px] flex flex-col justify-center">
						{isLoading ? (
							<div className="text-center space-y-4">
								<div className={`animate-spin rounded-full h-12 w-12 border-b-2 mx-auto ${isDark ? "border-brand-primary-dark" : "border-brand-primary-light"}`}></div>
								{/* Kept your custom text, just styled to fit the container */}
								<h1 className={`text-xl font-bold animate-pulse ${isDark ? "text-brand-primary-dark" : "text-brand-primary-light"}`}>
									RUKJA THODI DER KAAAKEE !!!!!!
								</h1>
							</div>
						) : theoryText ? (
							<div className={`rounded-xl p-6 border ${isDark ? "bg-bg-tertiary-dark border-border-dark" : "bg-bg-tertiary-light border-border-light"}`}>
								<h3 className={`text-sm font-bold mb-4 uppercase ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"}`}>
									Explanation
								</h3>
								{/* Changed h1 to div/p for better readability on long text */}
								<div className={`leading-7 text-lg whitespace-pre-wrap font-sans ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}`}>
									{theoryText}
								</div>
							</div>
						) : (
							<div className={`text-center italic ${isDark ? "text-text-muted-dark" : "text-text-muted-light"}`}>
								Click the button above to start learning...
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
};

export default TeachConceptPage;
