import React from "react";

const DailyPage = () => {
	function handleRCClick() {}

	function handleVAClick() {}

	return (
		<div className="flex flex-col gap-5">
			<h1 className="text-9xl">DailyPage</h1>
			<button onClick={handleRCClick}>RC Daily</button>
			<button onClick={handleVAClick}>VA Daily</button>
		</div>
	);
};

export default DailyPage;
