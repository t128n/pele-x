function hash(value: string): string {
	let result = 2166136261;
	for (let index = 0; index < value.length; index++) {
		result ^= value.charCodeAt(index);
		result = Math.imul(result, 16777619);
	}
	return (result >>> 0).toString(36).padStart(7, '0');
}

export function diagramId(fileURL: string | undefined, index: number, source: string): string {
	const digest = hash(`${fileURL ?? ''}\0${source}`);
	return `pele-${digest}-${index.toString(36)}`;
}
