// Shared Firebase bootstrap. Load after the Firebase CDN scripts and firebase-config.js.
if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = (typeof firebase.firestore === 'function') ? firebase.firestore() : null;

// SESSION persistence avoids Safari's slow IndexedDB auth lookup
auth.setPersistence(firebase.auth.Auth.Persistence.SESSION).catch(() => {});

function signOut() {
    auth.signOut().then(() => window.location.href = 'login.html');
}

// Redirects to login.html if not signed in (or if auth stalls for `timeoutMs`),
// otherwise calls onUser(user).
function requireAuth(onUser, timeoutMs = 8000) {
    const _authTimeout = setTimeout(() => window.location.href = 'login.html', timeoutMs);
    auth.onAuthStateChanged(user => {
        clearTimeout(_authTimeout);
        if (!user) { window.location.href = 'login.html'; return; }
        onUser(user);
    });
}
