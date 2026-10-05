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
