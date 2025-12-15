// import { useLoginMutation, useSignUpMutation } from "../redux_usecase/authApi";
// // 1. Local state for form inputs
// const [email, setEmail] = useState("");
// const [password, setPassword] = useState("");
// const [isLoginMode, setIsLoginMode] = useState(true); // Toggle between Login and Sign Up

// // 2. The Mutation Hooks
// // The first item (login) is the TRIGGER function.
// // The second item is an object with status flags (isLoading, error, etc.)
// const [login, { isLoading: isLoggingIn }] = useLoginMutation();
// const [signUp, { isLoading: isSigningUp }] = useSignUpMutation();

// const handleAuth = async (e: React.FormEvent) => {
// 	e.preventDefault();

// 	try {
// 		// 3. Call the appropriate mutation
// 		// We use .unwrap() to extract the payload or throw an error immediately
// 		// This makes standard try/catch blocks work perfectly!
// 		if (isLoginMode) {
// 			await login({ email, password }).unwrap();
// 			alert("Logged in successfully!");
// 		} else {
// 			await signUp({ email, password }).unwrap();
// 			alert("Check your email to confirm your account!");
// 		}

// 		// Clear inputs
// 		setEmail("");
// 		setPassword("");
// 	} catch (err: any) {
// 		console.error("Failed:", err);
// 		alert(err.data || "Something went wrong");
// 	}
// };

// const isLoading = isLoggingIn || isSigningUp;

//handle the confirmation token handling here for re-redering the user on refresh
