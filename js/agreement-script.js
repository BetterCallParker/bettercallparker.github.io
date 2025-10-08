// ==========================
// agreement-script.js
// ==========================

// PDF.js init (only used if you're still showing a PDF canvas anywhere)
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
pdfjsLib.GlobalWorkerOptions.useWorkerFetch = true;
const CMAP_URL = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/cmaps/';
const FONT_URL = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/standard_fonts/';

// Optional PDF canvas preview support (safe no-ops if not present in your HTML)
let pdfDoc = null;
let pageNum = 1;
let pageRendering = false;
let pageNumPending = null;
let canvas = document.getElementById('pdf-canvas');
let ctx = canvas ? canvas.getContext('2d') : null;
let scale = 1.5;

// ------- Utility: make form read-only after submit
function makeFormReadOnly(form) {
  const els = Array.from(form.elements);
  els.forEach(el => {
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
      el.setAttribute('readonly', 'readonly');
      el.style.backgroundColor = '#f0f0f0';
      el.style.cursor = 'not-allowed';
      el.style.opacity = '0.8';
    } else if (el.tagName === 'SELECT') {
      el.setAttribute('disabled', 'disabled');
      el.style.backgroundColor = '#f0f0f0';
      el.style.cursor = 'not-allowed';
      el.style.opacity = '0.8';
    } else if (el.tagName === 'BUTTON') {
      el.setAttribute('disabled', 'disabled');
      el.style.cursor = 'not-allowed';
      el.style.opacity = '0.8';
    }
  });

  // Disable signature pad
  const sigCanvas = document.getElementById('signature-pad');
  if (sigCanvas) {
    const container = sigCanvas.parentNode;
    const newC = sigCanvas.cloneNode(true);
    container.replaceChild(newC, sigCanvas);
    const overlay = document.createElement('div');
    overlay.style.position = 'absolute';
    overlay.style.inset = '0';
    overlay.style.background = 'rgba(240,240,240,.5)';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.zIndex = '10';
    overlay.innerHTML = '<span style="background:#fff;padding:6px 10px;border-radius:6px;">Signature Submitted</span>';
    if (container.style.position !== 'relative') container.style.position = 'relative';
    container.appendChild(overlay);
  }

  const banner = document.createElement('div');
  banner.style.background = '#e9f7fe';
  banner.style.color = '#0277bd';
  banner.style.padding = '10px';
  banner.style.borderRadius = '6px';
  banner.style.marginBottom = '12px';
  banner.style.textAlign = 'center';
  banner.style.fontWeight = '700';
  banner.innerHTML = '<i class="fas fa-lock"></i> Form submitted and locked.';
  form.insertBefore(banner, form.firstChild);
}

// ------- Optional: PDF preview loader (safe to leave if not used)
function loadPDF() {
  const url = './assets/Buyer Agreement to Show Property.pdf';
  if (!canvas || !ctx) return;

  pdfjsLib.getDocument({
    url,
    cMapUrl: CMAP_URL,
    cMapPacked: true,
    standardFontDataUrl: FONT_URL,
    disableFontFace: false,
    stopAtErrors: false,
  }).promise.then(pdf => {
    pdfDoc = pdf;
    const pageCount = document.getElementById('page-count');
    if (pageCount) pageCount.textContent = pdf.numPages;
    renderPage(pageNum);
  }).catch(err => {
    // fallback drawing
    canvas.width = canvas.width || 600;
    canvas.height = canvas.height || 800;
    ctx.fillStyle = '#f1f1f1';
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = 'red';
    ctx.font = '20px Arial';
    ctx.fillText('PDF preview not available.', 50, 100);
    ctx.font = '16px Arial';
    ctx.fillText('Error: ' + err.message, 50, 130);
  });
}
function renderPage(num) {
  if (!pdfDoc || !canvas || !ctx) return;
  pageRendering = true;
  pdfDoc.getPage(num).then(page => {
    const viewport = page.getViewport({ scale });
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    return page.render({ canvasContext: ctx, viewport }).promise;
  }).then(() => {
    pageRendering = false;
    if (pageNumPending !== null) {
      renderPage(pageNumPending);
      pageNumPending = null;
    }
  }).catch(() => { pageRendering = false; });
}

// ------- Dates: today + 7 days
function setupDateFields() {
  const today = new Date();
  const fmt = d => [(d.getMonth()+1).toString().padStart(2,'0'),
                    d.getDate().toString().padStart(2,'0'),
                    d.getFullYear()].join('/');
  const start = fmt(today);
  const exp = new Date(today);
  exp.setDate(today.getDate() + 7);
  const end = fmt(exp);

  const hiddenStart = document.getElementById('hiddenStartDate');
  const hiddenEnd = document.getElementById('hiddenExpirationDate');
  if (hiddenStart) hiddenStart.value = start;
  if (hiddenEnd) hiddenEnd.value = end;
}

// ------- Signature Pad
function initSignaturePad() {
  const canvas = document.getElementById('signature-pad');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let drawing = false;

  function size() {
    const w = canvas.clientWidth || canvas.parentElement.clientWidth || 600;
    const h = 200;
    canvas.width = w; canvas.height = h;
    ctx.fillStyle = '#fff'; ctx.fillRect(0,0,w,h);
  }
  size(); addEventListener('resize', size);

  const pos = e => {
    const r = canvas.getBoundingClientRect();
    const t = e.touches ? e.touches[0] : e;
    return { x: t.clientX - r.left, y: t.clientY - r.top };
  };
  const start = e => { drawing = true; const p = pos(e); ctx.beginPath(); ctx.moveTo(p.x,p.y); };
  const move  = e => { if(!drawing) return; const p = pos(e); ctx.lineWidth=2; ctx.lineCap='round'; ctx.strokeStyle='#000'; ctx.lineTo(p.x,p.y); ctx.stroke(); };
  const end   = () => { drawing = false; };

  canvas.addEventListener('mousedown', start);
  canvas.addEventListener('mousemove', move);
  canvas.addEventListener('mouseup', end);
  canvas.addEventListener('mouseleave', end);
  canvas.addEventListener('touchstart', e => { e.preventDefault(); start(e); }, { passive:false });
  canvas.addEventListener('touchmove',  e => { e.preventDefault(); move(e);  }, { passive:false });
  canvas.addEventListener('touchend',   e => { e.preventDefault(); end();    }, { passive:false });

  const clearBtn = document.getElementById('clear-signature');
  if (clearBtn) clearBtn.addEventListener('click', () => {
    size(); const hidden = document.getElementById('signature-data'); if (hidden) hidden.value = '';
  });

  const acceptBtn = document.getElementById('accept-signature');
  if (acceptBtn) acceptBtn.addEventListener('click', () => {
    const hidden = document.getElementById('signature-data');
    if (hidden) hidden.value = canvas.toDataURL();

    const old = acceptBtn.innerHTML;
    const oldBg = acceptBtn.style.backgroundColor;
    acceptBtn.innerHTML = '<i class="fa-solid fa-check"></i> Accepted';
    acceptBtn.style.backgroundColor = '#0ea5e9';
    setTimeout(() => { acceptBtn.innerHTML = old; acceptBtn.style.backgroundColor = oldBg || 'var(--ok)'; }, 1100);

    // ✅ Smooth scroll to bottom so they see Submit area
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  });
}

// ------- Build Signed PDF with pdf-lib
async function generateCompletedPDF() {
  const pdfUrl = './assets/Buyer Agreement to Show Property.pdf';
  const res = await fetch(pdfUrl);
  if (!res.ok) throw new Error(`Could not load base PDF (${res.status})`);
  const baseBytes = await res.arrayBuffer();

  const doc = await PDFLib.PDFDocument.load(baseBytes);
  const form = doc.getForm?.();

  const fullName = document.getElementById('fullName')?.value || '';
  const startDate = document.getElementById('hiddenStartDate')?.value || '';
  const expirationDate = document.getElementById('hiddenExpirationDate')?.value || '';
  const signatureData = document.getElementById('signature-data')?.value || '';

  try { form?.getTextField('Name').setText(fullName); } catch {}
  try { form?.getTextField('StartDate').setText(startDate); } catch {}
  try { form?.getTextField('EndDate').setText(expirationDate); } catch {}
  try { form?.getTextField('SigDate').setText(startDate); } catch {}
  try { form?.getCheckBox('Residential').check(); } catch {}

  if (signatureData) {
    try {
      const png = await doc.embedPng(signatureData);
      const pages = doc.getPages();
      const last = pages[pages.length - 1];
      const { width, height } = last.getSize();
      last.drawImage(png, {
        x: width * 0.12,
        y: height * 0.28,
        width: width * 0.22,
        height: height * 0.045
      });
    } catch {}
  }

  return await doc.save({ updateFieldAppearances: true });
}

// ------- Countdown helper (if you still use it elsewhere)
function startRedirectCountdown() {
  let seconds = 10;
  const el = document.getElementById('countdown');
  if (!el) return;
  el.textContent = seconds;
  const t = setInterval(() => {
    seconds--; el.textContent = seconds;
    if (seconds <= 0) { clearInterval(t); window.location.href = 'index.html'; }
  }, 1000);
}

// ------- Init
document.addEventListener('DOMContentLoaded', () => {
  // Optional preview
  try { loadPDF(); } catch {}

  initSignaturePad();
  setupDateFields();

  const form = document.getElementById('agreement-form');
  if (!form) return;

  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    // Validate minimal fields
    const missing = [];
    if (!document.getElementById('fullName')?.value) missing.push('• Please enter your full name');
    if (!document.getElementById('initials')?.value) missing.push('• Please enter your initials');

    // read/terms checkboxes are optional depending on your markup — guard them
    const readBox = document.getElementById('confirm-read') || document.getElementById('read');
    if (readBox && !readBox.checked) missing.push('• Please confirm you\'ve read the agreement');

    const sig = document.getElementById('signature-data')?.value || '';
    if (!sig || sig.length < 900) missing.push('• Please sign the agreement');

    if (missing.length) { alert('Please complete the following:\n' + missing.join('\n')); return; }

    const submitBtn = this.querySelector('button[type="submit"]');
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Submitting…'; }

    try {
      // Build signed PDF
      const pdfBytes = await generateCompletedPDF();
      const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });

      const buyerName = (document.getElementById('fullName')?.value || 'Client').trim();
      const safeName = buyerName.replace(/\s+/g, '_');
      const fileName = `BuyerBrokerAgreement_${safeName}.pdf`;
      const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });

      // ✅ Build pretty FormSubmit payload using the "box" template
      const fd = new FormData();
      fd.append('Buyer Name', buyerName);
      fd.append('Initials', document.getElementById('initials')?.value || '');
      fd.append('Start Date', document.getElementById('hiddenStartDate')?.value || '');
      fd.append('Expiration Date', document.getElementById('hiddenExpirationDate')?.value || '');
      fd.append('Read & Agreed', readBox ? (readBox.checked ? 'Yes' : 'No') : 'Yes');
      fd.append('_subject', `New Buyer Broker Agreement – ${buyerName}`);
      fd.append('_template', 'box');          // << clean modern layout
      fd.append('_captcha', 'false');
      fd.append('_next', 'thank-you.html');
      fd.append('file', pdfFile);             // << standard file key

      const res = await fetch(this.action, { method: 'POST', body: fd });
      if (!res.ok && res.status !== 0) throw new Error('Form submission failed');

      // Download a copy for the buyer
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url; a.download = fileName;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);

      // Lock UI + thank you + redirect
      makeFormReadOnly(this);

      const thankEl = document.getElementById('thank-you-message') || document.getElementById('thank-you');
      if (thankEl) {
        thankEl.style.display = 'block';
        thankEl.innerHTML = `
          <h3><i class="fa-solid fa-circle-check"></i> Thank you!</h3>
          <p>Your signed agreement has been sent successfully.</p>
          <p><strong>Sending you to the next stage…</strong></p>
        `;
      }
      if (submitBtn) submitBtn.style.display = 'none';

      // Scroll to show message
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });

      // Redirect to your next stage
      setTimeout(() => {
        window.location.href = 'https://bettercallparker.github.io/steps/search.html';
      }, 4000);

    } catch (err) {
      console.error(err);
      alert('There was a problem sending your signed agreement. Please try again.');
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Submit Signed Agreement'; }
    }
  });

  // If returning from FormSubmit success URL (?success=true), show thank-you/lock UI as well
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('success') === 'true') {
    const form = document.getElementById('agreement-form');
    if (form) makeFormReadOnly(form);
    const thank = document.getElementById('thank-you-message') || document.getElementById('thank-you');
    if (thank) thank.style.display = 'block';
    startRedirectCountdown();
  }
});
