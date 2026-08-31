// assets/js/exec-board.js
(() => {
	"use strict";

	const CSV_URL = "assets/data/exec.csv";
	const GRID_ID = "exec-grid";
	const HEADSHOTS_DIR = "assets/img/headshots";

	// Try these extensions in order if image fails to load
	const EXT_FALLBACKS = ["jpg", "jpeg", "JPG", "JPEG"];

	function encodeHeadshotPath(name, ext) {
		// 'headshots/Firstname Lastname.jpg' with proper URL encoding
		const filename = `${name}.${ext}`;
		return `${HEADSHOTS_DIR}/${encodeURIComponent(filename)}`;
	}

	// Shown when a member has no headshot on file yet. Drawn inline (no extra
	// file to upload) at the same 5:6 portrait shape as the card frame.
	const PLACEHOLDER_SVG = `
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 600" role="img">
			<defs>
				<linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
					<stop offset="0%" stop-color="#eef3f7"/>
					<stop offset="100%" stop-color="#dbe4ec"/>
				</linearGradient>
			</defs>
			<rect width="500" height="600" fill="url(#bg)"/>
			<g fill="#2c3e50" opacity="0.22">
				<circle cx="250" cy="248" r="90"/>
				<path d="M70 600c0-107 80-186 180-186s180 79 180 186z"/>
			</g>
		</svg>`;

	const PLACEHOLDER_SRC =
		"data:image/svg+xml;charset=utf-8," +
		encodeURIComponent(PLACEHOLDER_SVG.trim().replace(/\s+/g, " "));

	function attachHeadshotFallback(imgEl, name) {
		let idx = 0;
		imgEl.src = encodeHeadshotPath(name, EXT_FALLBACKS[idx]);

		imgEl.onerror = () => {
			idx += 1;
			if (idx < EXT_FALLBACKS.length) {
				imgEl.src = encodeHeadshotPath(name, EXT_FALLBACKS[idx]);
			} else {
				// No photo on file — fall back to the silhouette placeholder.
				imgEl.onerror = null;
				imgEl.src = PLACEHOLDER_SRC;
				imgEl.alt = `${name} — photo coming soon`;
			}
		};
	}

	function safeHTML(str = "") {
		return String(str)
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/"/g, "&quot;")
			.replace(/'/g, "&#39;");
	}

	function createCard({ Name, Role, Hometown, Undergrad, Classyear, Quote, Memory }) {
		const li = document.createElement("li");
		li.className = "exec-card";

		const figure = document.createElement("figure");
		figure.className = "exec-figure";
		figure.tabIndex = 0;

		const img = document.createElement("img");
		img.loading = "lazy";
		img.alt = `${Name} headshot`;
		attachHeadshotFallback(img, Name);

		const caption = document.createElement("figcaption");
		caption.className = "exec-caption";

		const h3 = document.createElement("p");
		h3.className = "exec-name";
		h3.innerHTML = `<strong>${Name.trim()}</strong>`;

		if (Classyear && Classyear.trim()) {
			const yr = document.createElement("span");
			yr.className = "exec-year";
			yr.innerHTML = `<em>c/o ${Classyear.trim()}</em>`;
			// caption.appendChild(p);
			h3.appendChild(document.createTextNode(" ")); // space before year
			h3.appendChild(yr);
		}

		// const roleP = document.createElement("p");
		// roleP.className = "exec-role";
		// roleP.textContent = Role || "";

		if (Role && Role.trim()) {
			const roleP = document.createElement("p");
			roleP.className = "exec-role";
			roleP.innerHTML = `<strong><em>${Role.trim()}</em></strong>`;
			caption.appendChild(roleP);
		}

		if (Hometown && Hometown.trim()) {
			const p = document.createElement("p");
			p.className = "exec-hometown";
			// p.textContent = `Hometown: ${Hometown.trim()}`;
			p.innerHTML = `<strong><em>Hometown:</em></strong>&nbsp;&nbsp;&nbsp;&#8203;${safeHTML(Hometown.trim())}`;
			caption.appendChild(p);
		}

		// Undergrad institution
		if (Undergrad && Undergrad.trim()) {
			const p = document.createElement("p");
			p.className = "exec-undergrad";
			p.innerHTML = `<strong><em>Undergrad:</em></strong>&nbsp;&nbsp;&nbsp;&#8203;${safeHTML(Undergrad.trim())}`;
			caption.appendChild(p);
		}

		// Quote
		if (Quote && Quote.trim()) {
			const p = document.createElement("p");
			p.className = "exec-quote";
			p.innerHTML = `<strong><em>Favorite Quote:</em></strong>&nbsp;&nbsp;&nbsp;&#8203;${Quote.trim()}`;
			caption.appendChild(p);
		}

		// Favorite dental school memory
		if (Memory && Memory.trim()) {
			const p = document.createElement("p");
			p.className = "exec-memory";
			p.innerHTML = `<strong><em>Favorite Dental School Memory:</em></strong>&nbsp;&nbsp;&nbsp;&#8203;${Memory.trim()}`;
			caption.appendChild(p);
		}

		// caption.prepend(roleP);
		caption.prepend(h3);

		figure.appendChild(img);
		figure.appendChild(caption);

		li.appendChild(figure);
		return li;
	}

//Start review here.
	function buildGrid(rows) {
		const grid = document.getElementById(GRID_ID);
		if (!grid) return;

		// Clear existing content (if any)
		grid.innerHTML = "";

		rows.forEach((row) => {
			// Normalize keys to match exactly our expected headers
			const data = {
				Name: row.Name?.trim() || "",
				Role: row.Role?.trim() || "",
				Hometown: row.Hometown?.trim() || "",
				Undergrad: row.Undergrad?.trim() || "",
				Classyear: row.Classyear?.trim() || "",
				Quote: row.Quote?.trim() || "",
				Memory: row.Memory?.trim() || ""
			};

			if (!data.Name) return; // skip blank lines

			const card = createCard(data);
			grid.appendChild(card);
		});
	}

	function initTouchToggle() {
		// Same behavior from earlier snippet: tap to reveal on touch
		document.addEventListener("click", (e) => {
			const clickedLink = e.target.closest("a");
			if (clickedLink) return;

			const card = e.target.closest(".exec-card");
			const openCards = document.querySelectorAll(".exec-card.open");

			if (card) {
				openCards.forEach((c) => { if (c !== card) c.classList.remove("open"); });
				card.classList.toggle("open");
			} else {
				openCards.forEach((c) => c.classList.remove("open"));
			}
		});
	}

	function loadCSV() {
		// Papa Parse: robust CSV parsing with headers & UTF-8
		Papa.parse(CSV_URL, {
			download: true,
			header: true,
			skipEmptyLines: true,
			complete: (results) => {
				if (results?.data?.length) {
					buildGrid(results.data);
				} else {
					console.warn("CSV loaded, but no rows found.");
				}
			},
			error: (err) => {
				console.error("Error parsing CSV:", err);
			}
		});
	}

	// Wait until DOM + Papa are ready
	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", () => {
			// initTouchToggle();
			loadCSV();
		});
	} else {
		initTouchToggle();
		loadCSV();
	}
})();
