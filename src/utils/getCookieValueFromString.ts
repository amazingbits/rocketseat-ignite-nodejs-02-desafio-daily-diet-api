export function getCookieValueFromString(str: string): string {
	// sessionUser=310c9dc8-7232-4d03-84c9-b7aa06698b34; Max-Age=604800; Path=/
	const cookieValue = str.split('=')[1];
	return cookieValue.split(';')[0];
}
