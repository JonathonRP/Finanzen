export default (node: Element) => {
	const setHeight = (detail: HTMLDetailsElement, open = false) => {
		detail.open = open;
		const rect = detail.getBoundingClientRect();
		detail.dataset.width = `${rect.width}`;
		detail.style.setProperty(open ? `--expanded` : `--collapsed`, `${rect.height}px`);
	};
	const RO = new ResizeObserver((entries) =>
		entries.forEach((entry) => {
			const detail = entry.target as HTMLDetailsElement;
			const width = parseInt(detail.dataset.width ?? '', 10);
			if (width !== parseInt(`${entry.contentRect.width}` ?? '', 10)) {
				detail.removeAttribute('style');
				setHeight(detail);
				setHeight(detail, true);
				detail.open = false;
			}
		})
	);
	RO.observe(node);

	return {
		destroy() {
			RO.unobserve(node);
		},
	};
};
