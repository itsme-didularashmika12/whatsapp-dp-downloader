/* ============================================================
   WhatsApp DP Downloader — app.js (no dependencies)
   ============================================================ */
(function () {
  'use strict';

  /* ---------- country dial codes (ISO, name, dial) ---------- */
  var COUNTRIES = [
    ['LK', 'Sri Lanka', '94'], ['IN', 'India', '91'], ['US', 'United States', '1'], ['GB', 'United Kingdom', '44'],
    ['PK', 'Pakistan', '92'], ['BD', 'Bangladesh', '880'], ['AE', 'UAE', '971'], ['SA', 'Saudi Arabia', '966'],
    ['AF', 'Afghanistan', '93'], ['AL', 'Albania', '355'], ['DZ', 'Algeria', '213'], ['AD', 'Andorra', '376'],
    ['AO', 'Angola', '244'], ['AG', 'Antigua & Barbuda', '1'], ['AR', 'Argentina', '54'], ['AM', 'Armenia', '374'],
    ['AU', 'Australia', '61'], ['AT', 'Austria', '43'], ['AZ', 'Azerbaijan', '994'], ['BS', 'Bahamas', '1'],
    ['BH', 'Bahrain', '973'], ['BB', 'Barbados', '1'], ['BY', 'Belarus', '375'], ['BE', 'Belgium', '32'],
    ['BZ', 'Belize', '501'], ['BJ', 'Benin', '229'], ['BT', 'Bhutan', '975'], ['BO', 'Bolivia', '591'],
    ['BA', 'Bosnia', '387'], ['BW', 'Botswana', '267'], ['BR', 'Brazil', '55'], ['BN', 'Brunei', '673'],
    ['BG', 'Bulgaria', '359'], ['BF', 'Burkina Faso', '226'], ['BI', 'Burundi', '257'], ['KH', 'Cambodia', '855'],
    ['CM', 'Cameroon', '237'], ['CA', 'Canada', '1'], ['CV', 'Cape Verde', '238'], ['CF', 'Central African Rep.', '236'],
    ['TD', 'Chad', '235'], ['CL', 'Chile', '56'], ['CN', 'China', '86'], ['CO', 'Colombia', '57'],
    ['KM', 'Comoros', '269'], ['CG', 'Congo', '242'], ['CD', 'Congo (DRC)', '243'], ['CR', 'Costa Rica', '506'],
    ['CI', "Côte d'Ivoire", '225'], ['HR', 'Croatia', '385'], ['CU', 'Cuba', '53'], ['CY', 'Cyprus', '357'],
    ['CZ', 'Czechia', '420'], ['DK', 'Denmark', '45'], ['DJ', 'Djibouti', '253'], ['DM', 'Dominica', '1'],
    ['DO', 'Dominican Rep.', '1'], ['EC', 'Ecuador', '593'], ['EG', 'Egypt', '20'], ['SV', 'El Salvador', '503'],
    ['GQ', 'Equatorial Guinea', '240'], ['ER', 'Eritrea', '291'], ['EE', 'Estonia', '372'], ['SZ', 'Eswatini', '268'],
    ['ET', 'Ethiopia', '251'], ['FJ', 'Fiji', '679'], ['FI', 'Finland', '358'], ['FR', 'France', '33'],
    ['GA', 'Gabon', '241'], ['GM', 'Gambia', '220'], ['GE', 'Georgia', '995'], ['DE', 'Germany', '49'],
    ['GH', 'Ghana', '233'], ['GR', 'Greece', '30'], ['GD', 'Grenada', '1'], ['GT', 'Guatemala', '502'],
    ['GN', 'Guinea', '224'], ['GW', 'Guinea-Bissau', '245'], ['GY', 'Guyana', '592'], ['HT', 'Haiti', '509'],
    ['HN', 'Honduras', '504'], ['HK', 'Hong Kong', '852'], ['HU', 'Hungary', '36'], ['IS', 'Iceland', '354'],
    ['ID', 'Indonesia', '62'], ['IR', 'Iran', '98'], ['IQ', 'Iraq', '964'], ['IE', 'Ireland', '353'],
    ['IL', 'Israel', '972'], ['IT', 'Italy', '39'], ['JM', 'Jamaica', '1'], ['JP', 'Japan', '81'],
    ['JO', 'Jordan', '962'], ['KZ', 'Kazakhstan', '7'], ['KE', 'Kenya', '254'], ['KI', 'Kiribati', '686'],
    ['KW', 'Kuwait', '965'], ['KG', 'Kyrgyzstan', '996'], ['LA', 'Laos', '856'], ['LV', 'Latvia', '371'],
    ['LB', 'Lebanon', '961'], ['LS', 'Lesotho', '266'], ['LR', 'Liberia', '231'], ['LY', 'Libya', '218'],
    ['LI', 'Liechtenstein', '423'], ['LT', 'Lithuania', '370'], ['LU', 'Luxembourg', '352'], ['MO', 'Macau', '853'],
    ['MG', 'Madagascar', '261'], ['MW', 'Malawi', '265'], ['MY', 'Malaysia', '60'], ['MV', 'Maldives', '960'],
    ['ML', 'Mali', '223'], ['MT', 'Malta', '356'], ['MH', 'Marshall Islands', '692'], ['MR', 'Mauritania', '222'],
    ['MU', 'Mauritius', '230'], ['MX', 'Mexico', '52'], ['FM', 'Micronesia', '691'], ['MD', 'Moldova', '373'],
    ['MC', 'Monaco', '377'], ['MN', 'Mongolia', '976'], ['ME', 'Montenegro', '382'], ['MA', 'Morocco', '212'],
    ['MZ', 'Mozambique', '258'], ['MM', 'Myanmar', '95'], ['NA', 'Namibia', '264'], ['NR', 'Nauru', '674'],
    ['NP', 'Nepal', '977'], ['NL', 'Netherlands', '31'], ['NZ', 'New Zealand', '64'], ['NI', 'Nicaragua', '505'],
    ['NE', 'Niger', '227'], ['NG', 'Nigeria', '234'], ['KP', 'North Korea', '850'], ['MK', 'North Macedonia', '389'],
    ['NO', 'Norway', '47'], ['OM', 'Oman', '968'], ['PW', 'Palau', '680'], ['PS', 'Palestine', '970'],
    ['PA', 'Panama', '507'], ['PG', 'Papua New Guinea', '675'], ['PY', 'Paraguay', '595'], ['PE', 'Peru', '51'],
    ['PH', 'Philippines', '63'], ['PL', 'Poland', '48'], ['PT', 'Portugal', '351'], ['QA', 'Qatar', '974'],
    ['RO', 'Romania', '40'], ['RU', 'Russia', '7'], ['RW', 'Rwanda', '250'], ['WS', 'Samoa', '685'],
    ['SM', 'San Marino', '378'], ['ST', 'São Tomé & Príncipe', '239'], ['SN', 'Senegal', '221'], ['RS', 'Serbia', '381'],
    ['SC', 'Seychelles', '248'], ['SL', 'Sierra Leone', '232'], ['SG', 'Singapore', '65'], ['SK', 'Slovakia', '421'],
    ['SI', 'Slovenia', '386'], ['SB', 'Solomon Islands', '677'], ['SO', 'Somalia', '252'], ['ZA', 'South Africa', '27'],
    ['KR', 'South Korea', '82'], ['SS', 'South Sudan', '211'], ['ES', 'Spain', '34'], ['SD', 'Sudan', '249'],
    ['SR', 'Suriname', '597'], ['SE', 'Sweden', '46'], ['CH', 'Switzerland', '41'], ['SY', 'Syria', '963'],
    ['TW', 'Taiwan', '886'], ['TJ', 'Tajikistan', '992'], ['TZ', 'Tanzania', '255'], ['TH', 'Thailand', '66'],
    ['TL', 'Timor-Leste', '670'], ['TG', 'Togo', '228'], ['TO', 'Tonga', '676'], ['TT', 'Trinidad & Tobago', '1'],
    ['TN', 'Tunisia', '216'], ['TR', 'Turkey', '90'], ['TM', 'Turkmenistan', '993'], ['TV', 'Tuvalu', '688'],
    ['UG', 'Uganda', '256'], ['UA', 'Ukraine', '380'], ['UY', 'Uruguay', '598'], ['UZ', 'Uzbekistan', '998'],
    ['VU', 'Vanuatu', '678'], ['VA', 'Vatican', '39'], ['VE', 'Venezuela', '58'], ['VN', 'Vietnam', '84'],
    ['YE', 'Yemen', '967'], ['ZM', 'Zambia', '260'], ['ZW', 'Zimbabwe', '263']
  ];

  var $ = function (s, el) { return (el || document).querySelector(s); };

  /* ============================================================
     COMMON — runs on every page (footer year + status pill)
     ============================================================ */
  function initCommon() {
    var y = $('#year'); if (y) y.textContent = new Date().getFullYear();
    var pill = $('#status-pill');
    if (pill) {
      fetch('/api/health').then(function (r) { return r.json(); }).then(function (d) {
        if (d && d.ok && d.sessions_open > 0) {
          $('#status-text').textContent = 'Engine online · ' + d.sessions_open + ' nodes ready';
        } else { pill.classList.add('off'); $('#status-text').textContent = 'Engine warming up'; }
      }).catch(function () { pill.classList.add('off'); $('#status-text').textContent = 'Status unknown'; });
    }
  }

  /* ============================================================
     TOOL — only on pages containing the lookup form
     ============================================================ */
  function initTool() {

  /* ---------- build country dropdown ---------- */
  var sel = $('#country');
  if (sel) {
    var html = '';
    for (var i = 0; i < COUNTRIES.length; i++) {
      var c = COUNTRIES[i];
      html += '<option value="' + c[2] + '" data-iso="' + c[0] + '"' + (c[0] === 'LK' ? ' selected' : '') + '>' +
        c[1] + ' (+' + c[2] + ')</option>';
    }
    sel.innerHTML = html;
  }

  /* ---------- elements ---------- */
  var form = $('#dp-form');
  var phone = $('#phone');
  var btn = $('#dp-btn');
  var formError = $('#form-error');
  var resultCard = $('#result');
  var skel = $('#skeleton');
  var errCard = $('#lookup-error');
  var toast = $('#toast');

  function scrollToEl(el) { if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(function () { toast.classList.remove('show'); }, 2600);
  }
  function setLoading(on) {
    btn.classList.toggle('loading', on);
    btn.disabled = on;
  }
  function hide(el) { el && el.classList.remove('show'); }
  function show(el) { el && el.classList.add('show'); }

  function showFormError(msg) {
    formError.textContent = msg;
    formError.classList.add('show');
  }

  /* normalize: keep digits; users paste "+94 77-123 4567", "0771234567" etc. */
  function normalizeNumber() {
    var dial = sel.value;
    var raw = phone.value.replace(/[^\d]/g, '');
    if (!raw) return '';
    // if user typed/pasted full intl number (starts with 00 or with the dial code)
    raw = raw.replace(/^00/, '');
    if (raw.indexOf(dial) === 0 && raw.length > dial.length + 4) return raw; // already intl
    raw = raw.replace(/^0+/, ''); // strip national trunk zeros
    return dial + raw;
  }

  /* ---------- lookup ---------- */
  var lastData = null;

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    formError.classList.remove('show');
    hide(errCard);
    hide(resultCard);

    var number = normalizeNumber();
    if (!/^\d{9,15}$/.test(number)) {
      showFormError('Please enter a valid WhatsApp number with your country code (9–15 digits). Example: 77 123 4567 for Sri Lanka (+94).');
      phone.focus();
      return;
    }

    setLoading(true);
    hide(errCard); hide(resultCard); show(skel);
    scrollToEl($('#result-anchor'));

    var started = Date.now();
    fetch('/api/dp?number=' + encodeURIComponent(number), { headers: { 'Accept': 'application/json' } })
      .then(function (r) {
        return r.json().then(function (data) { return { status: r.status, data: data }; });
      })
      .then(function (res) {
        // keep the skeleton visible at least 600ms for a calm UX
        var wait = Math.max(0, 600 - (Date.now() - started));
        setTimeout(function () {
          setLoading(false);
          hide(skel);
          if (res.data && res.data.success) {
            renderResult(res.data);
          } else {
            renderError(res.data || { error: 'unexpected_error' });
          }
        }, wait);
      })
      .catch(function () {
        setLoading(false);
        hide(skel);
        renderError({ error: 'network', message: 'Network error — check your connection and try again.' });
      });
  });

  function renderError(err) {
    var msg = err.message || 'Something went wrong. Please try again.';
    var map = {
      not_on_whatsapp: 'That number is not registered on WhatsApp. Double-check the country code and number.',
      no_profile_picture: 'This account has no profile picture, or their privacy settings hide it from everyone. Nothing to download.',
      rate_limited: 'You are doing that too often — please wait a minute and try again.',
      no_sessions_available: 'Our lookup engine is restarting — please try again in a few seconds.',
      whatsapp_timeout: 'WhatsApp took too long to respond. Please try again.',
      invalid_number: 'That does not look like a valid international number. Include the country code, digits only.'
    };
    $('#lookup-error-msg').textContent = map[err.error] || msg;
    show(errCard);
    scrollToEl($('#result-anchor'));
  }

  function renderResult(d) {
    lastData = d;
    $('#dp-img').src = d.image;
    $('#dp-img').alt = 'WhatsApp profile picture of +' + d.number;
    $('#r-number').textContent = '+' + d.number;
    $('#r-format').textContent = (d.contentType || 'image/jpeg').split('/')[1].toUpperCase();
    $('#r-size').textContent = d.bytes > 1048576
      ? (d.bytes / 1048576).toFixed(2) + ' MB'
      : Math.round(d.bytes / 1024) + ' KB';
    show(resultCard);
    scrollToEl(resultCard);
  }

  /* download */
  var dlBtn = $('#btn-download');
  dlBtn && dlBtn.addEventListener('click', function () {
    if (!lastData) return;
    var ext = (lastData.contentType || 'image/jpeg').split('/')[1] === 'png' ? 'png' : 'jpg';
    var a = document.createElement('a');
    a.href = lastData.image;
    a.download = 'whatsapp-dp-' + lastData.number + '.' + ext;
    document.body.appendChild(a);
    a.click();
    a.remove();
    showToast('Download started — check your Downloads folder');
  });

  /* full-size lightbox (with focus hand-off for keyboard users) */
  var lb = $('#lightbox');
  var lastFocus = null;
  function openLb() {
    if (!lb) return;
    $('#lightbox-img').src = $('#dp-img').src;
    lastFocus = document.activeElement;
    lb.classList.add('show');
    var close = $('.lb-close', lb);
    if (close) close.focus();
  }
  function closeLb() {
    if (!lb) return;
    lb.classList.remove('show');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  var viewBtn = $('#btn-view');
  viewBtn && viewBtn.addEventListener('click', openLb);
  var dpImg = $('#dp-img');
  dpImg && dpImg.addEventListener('click', openLb);
  lb && lb.addEventListener('click', function (e) { if (e.target === lb || e.target.classList.contains('lb-close')) closeLb(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeLb(); });

  /* try another */
  var againBtn = $('#btn-again');
  againBtn && againBtn.addEventListener('click', function () {
    hide(resultCard); hide(errCard);
    phone.value = '';
    scrollToEl($('#tool-anchor'));
    phone.focus();
  });

  /* live tidy of input */
  phone.addEventListener('input', function () { formError.classList.remove('show'); });

  } /* end initTool */

  initCommon();
  if ($('#dp-form')) initTool();
})();
