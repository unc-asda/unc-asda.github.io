document.addEventListener('DOMContentLoaded', async () => {
	const inject = async (selector, file) => {
		const slot = document.querySelector(selector);
		if (!slot) return;
		try {
			const res = await fetch(file, { cache: 'no-cache' });
			if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
			slot.innerHTML = await res.text();
		} catch (err) {
			console.error('Include failed:', file, err);
			slot.innerHTML = `<!-- include failed: ${file} -->`;
		}
	};

	// Inject both in parallel
	await Promise.all([
		inject('[data-include="header"]', 'partials/header.html'),
		inject('[data-include="footer"]', 'partials/footer.html'),
	]);

	// After partials are in the DOM, load your main JS so it can bind to the injected nav.
	const s = document.createElement('script');
	s.src = 'assets/js/script.js';
	s.onload = () => document.dispatchEvent(new Event('partials:loaded'));
	document.body.appendChild(s);
});
