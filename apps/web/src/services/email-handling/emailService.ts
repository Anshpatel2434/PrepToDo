export class EmailService {
	/**
	 * Validate email format
	 * @param email - Email address to validate
	 * @returns true if valid email format
	 */
	static isValidEmail(email: string): boolean {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return emailRegex.test(email);
	}

	/**
	 * Mask email for display (show only first 3 and last 2 characters)
	 * @param email - Email address to mask
	 * @returns Masked email string
	 */
	static maskEmail(email: string): string {
		const [localPart, domain] = email.split("@");
		if (localPart.length <= 3) return email;
		return `${localPart.slice(0, 3)}***@${domain}`;
	}
}
