// Copy email buttons
document.querySelectorAll('[data-copy]').forEach(function (btn) {
  btn.addEventListener('click', function () {
    var el = document.getElementById(btn.getAttribute('data-copy'));
    function done(m) { btn.textContent = m; setTimeout(function () { btn.textContent = 'Copy'; }, 1500); }
    function select() { var r = document.createRange(); r.selectNodeContents(el); var s = getSelection(); s.removeAllRanges(); s.addRange(r); }
    try { navigator.clipboard.writeText(el.textContent.trim()).then(function () { done('Copied'); }, function () { select(); done('Selected'); }); }
    catch (e) { select(); done('Selected'); }
  });
});

// Project filters on the projects page
(function () {
  var bar = document.querySelector('.filters'); if (!bar) return;
  var buttons = bar.querySelectorAll('button');
  var cards = document.querySelectorAll('.project-grid .card');
  bar.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    var f = b.getAttribute('data-filter');
    buttons.forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
    cards.forEach(function (c) { c.hidden = !(f === 'all' || c.getAttribute('data-kind') === f); });
  });
})();

// Cluster illustration for the MSc thesis (seven Gaussian clusters, one per recovered activity context)
(function () {
  var canvases = document.querySelectorAll('canvas.clusters'); if (!canvases.length) return;
  function draw(c) {
    var r = c.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
    if (!r.width) return;
    c.width = r.width * dpr; c.height = r.height * dpr;
    var x = c.getContext('2d'); x.setTransform(dpr, 0, 0, dpr, 0, 0);
    var accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
    var cols = [accent, '#e0894f', '#3f9c7a', '#b05cc4', '#d4b23c', '#4aa3c7', '#8a8f9c'];
    var seed = 7; function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
    function g() { return Math.sqrt(-2 * Math.log(rnd() + 1e-9)) * Math.cos(2 * Math.PI * rnd()); }
    var centres = [[.16,.32],[.36,.7],[.5,.28],[.66,.66],[.84,.34],[.25,.82],[.86,.8]];
    var n = r.width > 600 ? 70 : 42;
    centres.forEach(function (p, i) {
      x.fillStyle = cols[i]; x.globalAlpha = .75;
      for (var k = 0; k < n; k++) {
        x.beginPath();
        x.arc((p[0] + g() * .045) * r.width, (p[1] + g() * .07) * r.height, 2.6, 0, Math.PI * 2);
        x.fill();
      }
    });
  }
  function all() { canvases.forEach(draw); }
  all();
  addEventListener('resize', all);
  try { matchMedia('(prefers-color-scheme: dark)').addEventListener('change', all); } catch (e) {}
})();

// Click-to-start live demos: the iframe (and its camera request) is only created after the click
document.querySelectorAll('.demo').forEach(function (box) {
  var btn = box.querySelector('.demo-btn'); if (!btn) return;
  btn.addEventListener('click', function () {
    var f = document.createElement('iframe');
    f.src = box.getAttribute('data-src');
    f.title = 'Live demo';
    f.allow = 'camera; fullscreen';
    box.innerHTML = '';
    box.appendChild(f);
  });
});
