import { useEffect, useState } from "react";

export interface UseObjectUrlParams {
	/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
	data: Uint8Array<any>;
	extension: string;
	filename: string;
}

/** @see https://github.com/Thinkmill/keystatic/blob/main/packages/keystatic/src/form/fields/image/ui.tsx#L48-L63 */
export function useObjectUrl(params: UseObjectUrlParams | null) {
	const data = params?.data;
	const contentType = params?.extension === "svg" ? "image/svg+xml" : undefined;

	const [url, setUrl] = useState<string | null>(null);

	useEffect(() => {
		if (data == null) {
			/* eslint-disable-next-line react-hooks/set-state-in-effect */
			setUrl(null);
			return undefined;
		}

		const url = URL.createObjectURL(
			new Blob([data], contentType ? { type: contentType } : undefined),
		);
		/* eslint-disable-next-line react-hooks/set-state-in-effect */
		setUrl(url);

		return () => {
			URL.revokeObjectURL(url);
		};
	}, [contentType, data]);

	return url;
}
