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

	function attachHeadshotFallback(imgEl, name) {
		let idx = 0;
		imgEl.src = encodeHeadshotPath(name, EXT_FALLBACKS[idx]);

		imgEl.onerror = () => {
			idx += 1;
			if (idx < EXT_FALLBACKS.length) {
				imgEl.src = encodeHeadshotPath(name, EXT_FALLBACKS[idx]);
			} else {
				// Optional: last-resort placeholder (transparent pixel)
				imgEl.onerror = null;
				imgEl.src =
					"data:image/gif;base64,R0lGODlhAQABAAAAACw=";
				imgEl.alt = `${name} headshot not available`;
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

	function createCard({ Name, Role, Hometown, Classyear, Quote, Memory }) {
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
