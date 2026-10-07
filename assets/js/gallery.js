// Photo gallery. Photos come from a private Google Drive folder through a
// small Google Apps Script web app (see the Code.gs file and setup steps).
(function () {
	// Paste the Web app URL from Apps Script here (it ends in /exec).
	var API_URL = 'https://script.google.com/macros/s/AKfycbx2-4b3CDch1pjZQPBqHBRYlifIFqGDkx4-skveaUoryF77LTruMpJbtNNrL9sy35Nm9w/exec';

	var grid = document.getElementById('pg-grid');
	var msg = document.getElementById('pg-msg');
	var filters = document.getElementById('pg-filters');
	var box = document.getElementById('pg-lightbox');
	var boxImg = document.getElementById('pg-lightbox-img');

	var photos = [];
	var visible = [];
	var current = 0;

	if (API_URL.indexOf('PASTE_') === 0) {
		msg.textContent = 'The gallery is not connected yet.';
		return;
	}

	// ---- image loading, a few at a time ----
	var cache = {};
	var queue = [];
	var active = 0;
	var MAX = 4;

	function loadImage(id, size) {
		var key = id + size;
		if (cache[key]) return Promise.resolve(cache[key]);
		return new Promise(function (resolve, reject) {
			queue.push({ id: id, size: size, key: key, resolve: resolve, reject: reject });
			pump();
		});
	}

	function pump() {
		while (active < MAX && queue.length) {
			var job = queue.shift();
			active++;
			(function (j) {
				fetch(API_URL + '?id=' + encodeURIComponent(j.id) + '&size=' + j.size)
					.then(function (r) { return r.json(); })
					.then(function (d) {
						if (d.error) throw new Error(d.error);
						cache[j.key] = d.src;
						j.resolve(d.src);
					})
					.catch(j.reject)
					.then(function () { active--; pump(); });
			})(job);
		}
	}

	var observer = 'IntersectionObserver' in window
		? new IntersectionObserver(function (entries) {
			entries.forEach(function (e) {
				if (!e.isIntersecting) return;
				observer.unobserve(e.target);
				fillTile(e.target);
			});
		}, { rootMargin: '400px' })
		: null;

	function fillTile(tile) {
		loadImage(tile.dataset.id, 'small').then(function (src) {
			var img = tile.querySelector('img');
			img.src = src;
			tile.classList.add('loaded');
		}).catch(function () {
			tile.style.display = 'none';
		});
	}

	// ---- rendering ----
	function render(album) {
		visible = photos.filter(function (p) { return !album || p.album === album; });
		grid.innerHTML = '';
		visible.forEach(function (p, i) {
			var li = document.createElement('li');
			li.className = 'pg-tile';
			li.dataset.id = p.id;
			var b = document.createElement('button');
			b.setAttribute('aria-label', 'Open photo ' + (i + 1));
			var img = document.createElement('img');
			img.alt = 'UNC ASDA photo';
			b.appendChild(img);
			b.addEventListener('click', function () { openBox(i); });
			li.appendChild(b);
			grid.appendChild(li);
			if (observer) observer.observe(li); else fillTile(li);
		});
		msg.textContent = visible.length ? '' : 'No photos yet. Check back soon!';
	}

	function buildFilters() {
		var albums = [];
		photos.forEach(function (p) {
			if (p.album && albums.indexOf(p.album) === -1) albums.push(p.album);
		});
		if (!albums.length) return;
		var names = [''].concat(albums);
		names.forEach(function (name) {
			var b = document.createElement('button');
			b.type = 'button';
			b.textContent = name || 'All';
			b.setAttribute('aria-pressed', name === '' ? 'true' : 'false');
			b.addEventListener('click', function () {
				filters.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
				b.setAttribute('aria-pressed', 'true');
				render(name);
			});
			filters.appendChild(b);
		});
		filters.hidden = false;
	}

	// ---- lightbox ----
	function openBox(i) {
		current = i;
		box.classList.add('open');
		document.body.style.overflow = 'hidden';
		showBox();
	}

	function showBox() {
		var p = visible[current];
		var token = p.id;
		boxImg.dataset.id = token;
		var small = cache[p.id + 'small'];
		boxImg.src = small || '';
		loadImage(p.id, 'large').then(function (src) {
			if (boxImg.dataset.id === token) boxImg.src = src;
		}).catch(function () {});
	}

	function step(d) {
		current = (current + d + visible.length) % visible.length;
		showBox();
	}

	function closeBox() {
		box.classList.remove('open');
		document.body.style.overflow = '';
		boxImg.removeAttribute('src');
	}

	box.querySelector('.pg-close').addEventListener('click', closeBox);
	box.querySelector('.pg-prev').addEventListener('click', function () { step(-1); });
	box.querySelector('.pg-next').addEventListener('click', function () { step(1); });
	box.addEventListener('click', function (e) { if (e.target === box) closeBox(); });
	document.addEventListener('keydown', function (e) {
		if (!box.classList.contains('open')) return;
		if (e.key === 'Escape') closeBox();
		if (e.key === 'ArrowLeft') step(-1);
		if (e.key === 'ArrowRight') step(1);
	});

	// ---- go ----
	fetch(API_URL)
		.then(function (r) { return r.json(); })
		.then(function (d) {
			if (d.error) throw new Error(d.error);
			photos = d.photos || [];
			buildFilters();
			render('');
		})
		.catch(function (err) {
			console.error('Gallery failed to load:', err);
			msg.textContent = 'Photos could not be loaded right now. Please try again later.';
		});
})();
