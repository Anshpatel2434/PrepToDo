import { useState } from "react";
import { useTeachConceptMutation } from "../redux_usecases/teachConceptApi";

type theory = string;

const TeachConceptPage = () => {
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
		<div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
			<div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
				{/* Header / Query Section */}
				<div className="bg-slate-900 p-8 text-white">
					<h2 className="text-xs font-bold tracking-widest text-indigo-400 uppercase mb-2">
						Current Query
					</h2>
					<p className="text-xl font-medium leading-relaxed">"{theoryQuery}"</p>
				</div>

				{/* Content Area */}
				<div className="p-8 flex flex-col gap-6">
					{/* Action Button */}
					<button
						onClick={handleSendRequest}
						disabled={isLoading}
						className={`
                            w-full py-4 px-6 rounded-lg font-bold text-lg transition-all duration-200 shadow-md hover:cursor-pointer
                            ${
															isLoading
																? "bg-gray-100 text-gray-400 cursor-not-allowed border-2 border-gray-200"
																: "bg-indigo-600 hover:bg-indigo-700 text-white hover:shadow-lg active:scale-[0.98]"
														}
                        `}
					>
						{isLoading ? "Processing..." : "Ab to sikhade yaar 🚀"}
					</button>

					<hr className="border-gray-100" />

					{/* Result / Loading State */}
					<div className="min-h-[200px] flex flex-col justify-center">
						{isLoading ? (
							<div className="text-center space-y-4">
								<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
								{/* Kept your custom text, just styled to fit the container */}
								<h1 className="text-xl font-bold text-indigo-600 animate-pulse">
									RUKJA THODI DER KAAAKEE !!!!!!
								</h1>
							</div>
						) : theoryText ? (
							<div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
								<h3 className="text-sm font-bold text-gray-500 mb-4 uppercase">
									Explanation
								</h3>
								{/* Changed h1 to div/p for better readability on long text */}
								<div className="text-gray-800 leading-7 text-lg whitespace-pre-wrap font-sans">
									{theoryText}
								</div>
							</div>
						) : (
							<div className="text-center text-gray-400 italic">
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
