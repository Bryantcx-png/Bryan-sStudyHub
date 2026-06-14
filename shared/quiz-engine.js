// Shared quiz engine — chapter selection, quiz modes, scoring, results,
// and Firestore progress/session sync. Used by critical-thinking.html and
// future subject quiz pages.
//
// Usage: requireAuth(user => initQuizApp({
//     subjectId: 'critical-thinking',
//     questions: CT_QUESTIONS,
//     chapters: CT_CHAPTERS,
//     quickCount: 40
// }));
//
// Expects `auth`, `db`, and `requireAuth`/`signOut` from shared/firebase-init.js,
// and the standard quiz markup (#CS, #S, #QS, #RS, etc.) from shared/quiz.css /
// the page body.

function initQuizApp(config) {
    const Q = config.questions;
    const CH = config.chapters;
    const subjectId = config.subjectId;
    const quickCount = config.quickCount || 40;
    const chapterIds = Object.keys(CH).map(Number);

    let quiz = [], ci = 0, results = [], sel = new Set(chapterIds), quizMode = '';
    let bankAnswered = new Set();
    let wrongQs = new Set(); // indices of all questions ever answered wrong
    let currentUid = null;

    function toggleSmart() {
        const sub = document.getElementById('smart-sub');
        const arrow = document.getElementById('smart-arrow');
        const open = sub.classList.toggle('open');
        arrow.classList.toggle('open', open);
    }

    (function () {
        const w = document.getElementById('CS');
        chapterIds.forEach(c => { const n = Q.filter(x => x.c === c).length; w.innerHTML += `<div class="cr sel" id="R${c}" onclick="tC(${c})"><input type="checkbox" checked id="B${c}"><span class="cd" style="background:${CH[c].cl}"></span><label>Ch ${c}: ${CH[c].n}</label><span class="cc">${n} Qs</span></div>`; });
        uI();
    })();

    function tC(c) { if (sel.has(c)) sel.delete(c); else sel.add(c); document.getElementById('B' + c).checked = sel.has(c); document.getElementById('R' + c).classList.toggle('sel', sel.has(c)); uI(); }
    function tAll(on) { chapterIds.forEach(c => { if (on) sel.add(c); else sel.delete(c); document.getElementById('B' + c).checked = on; document.getElementById('R' + c).classList.toggle('sel', on); }); uI(); }
    function uI() { const p = Q.filter(x => sel.has(x.c)), n = p.length; document.getElementById('SI').textContent = n > 0 ? `${n} questions from ${sel.size} chapter${sel.size !== 1 ? 's' : ''}.` : 'Select at least one chapter.'; document.getElementById('FD').textContent = `All ${n} questions from selected chapters.`; }
    function sh(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]]; } return a; }

    function go(mode) {
        ci = 0; results = []; quizMode = mode;
        if (mode === 'retry-wrong') {
            if (!wrongQs.size) { alert('No wrong questions recorded yet — complete a quiz first!'); return; }
            quiz = sh(Q.filter((_, i) => wrongQs.has(i)));
        } else {
            if (!sel.size) { alert('Select at least one chapter.'); return; }
            const pool = Q.filter(x => sel.has(x.c));
            if (mode === 'full') { quiz = sh([...pool]); }
            else if (mode === 'unanswered') {
                const unseen = pool.filter(q => !bankAnswered.has(Q.indexOf(q)));
                if (!unseen.length) { alert('You\'ve already answered all questions in the selected chapters! Try Mixed or Full Bank.'); return; }
                quiz = sh(unseen).slice(0, quickCount);
            }
            else if (mode === 'mixed') {
                const unseen = sh(pool.filter(q => !bankAnswered.has(Q.indexOf(q))));
                const seen   = sh(pool.filter(q =>  bankAnswered.has(Q.indexOf(q))));
                const need   = Math.max(0, quickCount - unseen.length);
                quiz = sh([...unseen, ...seen.slice(0, need)]).slice(0, quickCount);
                if (!quiz.length) { alert('No questions available. Try Full Bank instead.'); return; }
            }
            else { let pk = [], chs = [...sel], per = Math.max(1, Math.floor(quickCount / chs.length)), ex = quickCount - per * chs.length; chs.forEach((c, i) => { let cq = sh(pool.filter(x => x.c === c)); pk.push(...cq.slice(0, per + (i < ex ? 1 : 0))); }); quiz = sh(pk); if (quiz.length > quickCount) quiz = quiz.slice(0, quickCount); }
        }
        results = quiz.map(() => null);
        document.getElementById('graduate-wrap').style.display = 'none';
        document.getElementById('S').style.display = 'none';
        document.getElementById('QS').style.display = 'block';
        document.getElementById('home-link').style.display = 'none';
        document.getElementById('back-link').style.display = '';
        document.body.classList.add('quiz-active');
        sQ();
    }

    function sQ() {
        const q = quiz[ci], t = quiz.length, ans = results[ci] !== null;
        document.getElementById('QC').textContent = `${ci + 1} / ${t}`;
        document.getElementById('SL').textContent = `Score: ${results.filter(r => r && r.ok).length}/${results.filter(r => r !== null).length}`;
        document.getElementById('PF').style.width = `${((ci + 1) / t) * 100}%`;
        const tag = document.getElementById('CT'); tag.textContent = `Chapter ${q.c}: ${CH[q.c].n}`; tag.style.background = CH[q.c].cl;
        document.getElementById('QT').textContent = q.q;
        const w = document.getElementById('OW'); w.innerHTML = '';
        if (q.type === 'text' || q.type === 'complexity') {
            w.classList.add('opts-text');
            const isComplexity = q.type === 'complexity';
            const correct = Array.isArray(q.a) ? q.a[0] : q.a;
            const correctDisplay = isComplexity ? `O(${correct})` : correct;
            if (q.img) {
                const img = document.createElement('img');
                img.className = 'ti-gif';
                img.src = q.img;
                img.alt = q.q;
                w.appendChild(img);
            }
            if (ans) {
                const r = results[ci];
                const wrap = document.createElement('div');
                wrap.className = 'ti-complexity-wrap';
                if (isComplexity) wrap.insertAdjacentHTML('beforeend', '<span class="ti-bracket">O(</span>');
                const input = document.createElement('input');
                input.className = 'ti-input dis ' + (r.ok ? 'ok' : 'no') + (isComplexity ? ' ti-complexity-input' : '');
                input.value = r.ua;
                input.disabled = true;
                wrap.appendChild(input);
                if (isComplexity) wrap.insertAdjacentHTML('beforeend', '<span class="ti-bracket">)</span>');
                w.appendChild(wrap);
                if (!r.ok) {
                    const fb = document.createElement('div');
                    fb.className = 'ti-fb';
                    fb.textContent = `Correct answer: ${correctDisplay}`;
                    w.appendChild(fb);
                }
            } else {
                const wrap = document.createElement('div');
                wrap.className = 'ti-complexity-wrap';
                if (isComplexity) wrap.insertAdjacentHTML('beforeend', '<span class="ti-bracket">O(</span>');
                const input = document.createElement('input');
                input.className = 'ti-input' + (isComplexity ? ' ti-complexity-input' : '');
                input.type = 'text';
                input.id = 'TI';
                input.placeholder = isComplexity ? 'e.g. n log n' : 'Type the algorithm name…';
                input.autocomplete = 'off';
                input.setAttribute('autocapitalize', 'off');
                input.spellcheck = false;
                input.onkeydown = e => { if (e.key === 'Enter') submitText(); };
                wrap.appendChild(input);
                if (isComplexity) wrap.insertAdjacentHTML('beforeend', '<span class="ti-bracket">)</span>');
                w.appendChild(wrap);
                const btn = document.createElement('button');
                btn.className = 'nb pr ti-submit';
                btn.id = 'TISUB';
                btn.textContent = 'Submit';
                btn.onclick = () => submitText();
                w.appendChild(btn);
                setTimeout(() => input.focus(), 0);
            }
        } else {
            w.classList.remove('opts-text');
            const L = ['A', 'B', 'C', 'D'];
            if (!q._s) q._s = sh(q.o.map((o, i) => ({ t: o, i })));
            q._s.forEach((op, i) => { const b = document.createElement('button'); b.className = 'ob'; if (ans) { b.classList.add('dis'); const r = results[ci]; if (op.i === q.a) b.classList.add('ok'); if (op.t === r.ua && !r.ok) b.classList.add('no'); } b.innerHTML = `<span class="le">${L[i]}</span><span>${op.t}</span>`; if (!ans) b.onclick = () => pick(b, op.i, q.a, op.t); w.appendChild(b); });
        }
        document.getElementById('PB').disabled = ci === 0;
        const nb = document.getElementById('NB');
        nb.disabled = !ans;
        if (ci === t - 1 && ans) { nb.textContent = 'See Results'; nb.className = 'nb pr'; } else { nb.textContent = 'Next'; nb.className = 'nb pr'; }
    }

    function normalizeAnswer(s) {
        return s.toLowerCase().replace(/²/g, '2').replace(/\^/g, '').replace(/\s+/g, '');
    }

    function submitText() {
        if (results[ci] !== null) return;
        const q = quiz[ci];
        const input = document.getElementById('TI');
        const typed = input.value.trim();
        const accepted = (Array.isArray(q.a) ? q.a : [q.a]).map(normalizeAnswer);
        const ok = accepted.includes(normalizeAnswer(typed));
        const correct = Array.isArray(q.a) ? q.a[0] : q.a;
        const ca = q.type === 'complexity' ? `O(${correct})` : correct;
        results[ci] = { q: q.q, ch: q.c, ua: typed || '(no answer)', ca, ok };
        const nb = document.getElementById('NB'); nb.disabled = false;
        if (ci === quiz.length - 1) { nb.textContent = 'See Results'; nb.className = 'nb pr'; }
        if (quizMode === 'retry-wrong') {
            const wrap = document.getElementById('graduate-wrap');
            wrap.style.display = ok ? '' : 'none';
            if (ok) document.getElementById('graduate-cb').checked = true;
        }
        sQ();
    }

    function pick(btn, chosen, correct, text) {
        if (results[ci] !== null) return;
        const q = quiz[ci], ok = chosen === correct;
        document.querySelectorAll('.ob').forEach(b => { b.classList.add('dis'); const t = b.querySelector('span:last-child').textContent; if (q.o.indexOf(t) === correct) b.classList.add('ok'); });
        if (!ok) btn.classList.add('no');
        results[ci] = { q: q.q, ch: q.c, ua: text, ca: q.o[correct], ok };
        const nb = document.getElementById('NB'); nb.disabled = false;
        if (ci === quiz.length - 1) { nb.textContent = 'See Results'; nb.className = 'nb pr'; }
        // In Retry Wrong mode: show graduate toggle only when correct
        if (quizMode === 'retry-wrong') {
            const wrap = document.getElementById('graduate-wrap');
            wrap.style.display = ok ? '' : 'none';
            if (ok) document.getElementById('graduate-cb').checked = true;
        }
    }

    function nq() {
        if (results[ci] === null) return;
        // Retry Wrong: process graduation decision before advancing
        if (quizMode === 'retry-wrong' && results[ci] && results[ci].ok) {
            if (document.getElementById('graduate-cb').checked) graduateQuestion(quiz[ci]);
        }
        document.getElementById('graduate-wrap').style.display = 'none';
        if (ci >= quiz.length - 1) { sR(); return; }
        ci++; sQ();
    }
    function pq() { if (ci <= 0) return; ci--; sQ(); }

    function graduateQuestion(q) {
        const qIdx = Q.indexOf(q);
        if (qIdx === -1) return;
        wrongQs.delete(qIdx);
        updateWrongBadge();
        if (currentUid) {
            db.collection('users').doc(currentUid).collection('progress')
              .doc(subjectId).set(
                { wrongIds: firebase.firestore.FieldValue.arrayRemove(qIdx) },
                { merge: true }
              );
        }
    }

    function updateWrongBadge() {
        const n = wrongQs.size;
        const btn = document.getElementById('retry-wrong-btn');
        const badge = document.getElementById('wrong-count-badge');
        if (btn) btn.style.display = n > 0 ? '' : 'none';
        if (badge) badge.textContent = n;
    }

    function sR() {
        document.body.classList.remove('quiz-active');
        document.getElementById('QS').style.display = 'none';
        document.getElementById('home-link').style.display = 'none';
        document.getElementById('back-link').style.display = '';
        const rs = document.getElementById('RS'); rs.style.display = 'block';
        document.getElementById('result-image-container').style.display = 'block';
        const ok = results.filter(r => r && r.ok).length, t = quiz.length, pct = Math.round((ok / t) * 100);
        saveSession(ok, t, pct);
        const pe = document.getElementById('RP'); pe.textContent = `${pct}%`; pe.className = 'rp ' + (pct >= 70 ? 'hi' : pct >= 50 ? 'mi' : 'lo');
        document.getElementById('RB').textContent = `${ok} out of ${t} correct`;
        const wr = results.filter(r => r && !r.ok), rl = document.getElementById('RL'); rl.innerHTML = '';
        if (!wr.length) { document.getElementById('TB').textContent = 'Perfect Score'; document.getElementById('TB').disabled = true; document.getElementById('RT').textContent = 'You got everything right.'; }
        else {
            document.getElementById('TB').textContent = `View Wrong Answers (${wr.length})`; document.getElementById('TB').disabled = false;
            wr.forEach((r, i) => { rl.innerHTML += `<div class="ri"><div class="ric">Chapter ${r.ch}: ${CH[r.ch].n}</div><div class="riq">${i + 1}. ${r.q}</div><div class="riy">Your answer: ${r.ua}</div><div class="rik">Correct: ${r.ca}</div></div>`; });
        }
    }
    function saveSession(correct, total, pct) {
        const user = typeof firebase !== 'undefined' && firebase.apps.length ? firebase.auth().currentUser : null;
        if (!user) return;
        const uid = user.uid;
        const fdb = firebase.firestore();
        const answeredIds = quiz.map(q => Q.indexOf(q)).filter(i => i !== -1);
        // Save session record
        fdb.collection('users').doc(uid).collection('sessions').add({
            subject: subjectId,
            date: firebase.firestore.FieldValue.serverTimestamp(),
            score: correct,
            total: total,
            pct: pct,
            chapters: [...sel].sort((a, b) => a - b),
            mode: quizMode
        }).then(() => { loadRecentSessions(uid); });
        // Merge unique answered question indices into the bank tracker
        fdb.collection('users').doc(uid).collection('progress').doc(subjectId).set({
            answeredIds: firebase.firestore.FieldValue.arrayUnion(...answeredIds),
            totalBank: Q.length
        }, { merge: true });
        // Track newly wrong questions (skip retry-wrong; graduations handled per-question)
        if (quizMode !== 'retry-wrong') {
            const newWrong = quiz
                .map((q, i) => (results[i] && !results[i].ok) ? Q.indexOf(q) : -1)
                .filter(i => i !== -1);
            if (newWrong.length) {
                newWrong.forEach(i => wrongQs.add(i));
                updateWrongBadge();
                fdb.collection('users').doc(uid).collection('progress').doc(subjectId).set({
                    wrongIds: firebase.firestore.FieldValue.arrayUnion(...newWrong)
                }, { merge: true });
            }
        }
    }

    function tRev() { const s = document.getElementById('RV'); s.classList.toggle('hid'); const b = document.getElementById('TB'), w = results.filter(r => r && !r.ok).length; b.textContent = s.classList.contains('hid') ? `View Wrong Answers (${w})` : 'Hide Wrong Answers'; }
    function goHome() { Q.forEach(q => delete q._s); document.body.classList.remove('quiz-active'); document.getElementById('QS').style.display = 'none'; document.getElementById('RS').style.display = 'none'; document.getElementById('RV').classList.add('hid'); document.getElementById('result-image-container').style.display = 'none'; document.getElementById('graduate-wrap').style.display = 'none'; document.getElementById('S').style.display = ''; document.getElementById('home-link').style.display = ''; document.getElementById('back-link').style.display = 'none'; quiz = []; ci = 0; results = []; }

    function loadBankProgress(uid) {
        db.collection('users').doc(uid).collection('progress').doc(subjectId).get()
            .then(doc => {
                if (!doc.exists) return;
                const { answeredIds = [], wrongIds = [], totalBank = 0 } = doc.data();
                bankAnswered = new Set(answeredIds);
                wrongQs = new Set(wrongIds);
                updateWrongBadge();
                const answered = answeredIds.length;
                const unansCount = Math.max(0, (totalBank || Q.length) - answered);
                const sd = document.getElementById('smart-desc');
                if (sd) sd.textContent = `${unansCount} unanswered question${unansCount !== 1 ? 's' : ''} remaining.`;
                const total = totalBank || Q.length;
                const remaining = Math.max(0, total - answered);
                const pct = total > 0 ? Math.round((answered / total) * 100) : 0;

                document.getElementById('bp-answered').textContent = answered;
                document.getElementById('bp-total').textContent = total;
                document.getElementById('bp-remaining').textContent = remaining;
                document.getElementById('bp-pct').textContent = pct + '%';
                document.getElementById('bp-fill').style.width = pct + '%';
                document.getElementById('bank-progress').style.display = '';
            });
    }

    function loadRecentSessions(uid) {
        db.collection('users').doc(uid).collection('sessions')
            .orderBy('date', 'desc').limit(5).get()
            .then(snap => {
                const block = document.getElementById('recent-sess-block');
                const list  = document.getElementById('recent-sess-list');
                if (snap.empty) return;
                block.style.display = '';
                const CH_N = {}; chapterIds.forEach(c => CH_N[c] = `Ch${c}`);
                list.innerHTML = snap.docs.map(d => {
                    const s    = d.data();
                    const date = s.date ? s.date.toDate().toLocaleDateString('en-GB', { day:'numeric', month:'short' }) : '—';
                    const chs  = (s.chapters||[]).map(c => CH_N[c]||`Ch${c}`).join(', ');
                    const mode = s.mode === 'quick' ? 'Quick 40' : s.mode === 'unanswered' ? 'Unanswered' : s.mode === 'mixed' ? 'Mixed' : 'Full Bank';
                    const cls  = s.pct >= 70 ? 'pct-hi' : s.pct >= 50 ? 'pct-mi' : 'pct-lo';
                    return `<div class="sess-row">
                        <div class="sess-info">${chs} · ${mode} · ${date}</div>
                        <span class="sess-score">${s.score}/${s.total}</span>
                        <span class="pct-badge ${cls}">${s.pct}%</span>
                    </div>`;
                }).join('');
            });
    }

    // Expose handlers referenced by inline onclick="..." attributes in the page markup
    window.tC = tC;
    window.tAll = tAll;
    window.go = go;
    window.nq = nq;
    window.pq = pq;
    window.tRev = tRev;
    window.goHome = goHome;
    window.toggleSmart = toggleSmart;

    requireAuth(user => {
        currentUid = user.uid;
        document.body.style.display = '';
        loadBankProgress(user.uid);
        loadRecentSessions(user.uid);
    });
}
