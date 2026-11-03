document.addEventListener('DOMContentLoaded', () => {
    const yearElement = document.getElementById('current-year');
    if (yearElement) yearElement.textContent = new Date().getFullYear();
    initThemeToggle();
    loadApp();
    initSmoothScroll();
    initFAQ();
});

function initThemeToggle() {
    const themeBtn = document.getElementById('theme-toggle');
    const moonIcon = document.getElementById('moon-icon');
    const sunIcon = document.getElementById('sun-icon');
    const htmlElement = document.documentElement;

    const savedTheme = localStorage.getItem('theme') || 'light';
    htmlElement.setAttribute('data-theme', savedTheme);
    updateIcons(savedTheme);

    themeBtn?.addEventListener('click', () => {
        const currentTheme = htmlElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        htmlElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateIcons(newTheme);
    });

    function updateIcons(theme) {
        if (theme === 'dark') {
            if (moonIcon) moonIcon.style.display = 'none';
            if (sunIcon) sunIcon.style.display = 'block';
        } else {
            if (moonIcon) moonIcon.style.display = 'block';
            if (sunIcon) sunIcon.style.display = 'none';
        }
    }
}

function openLightbox(src) {
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    if(lightbox && lightboxImg) {
        lightbox.style.display = "block";
        lightboxImg.src = src;
    }
}
function closeLightbox() {
    const lightbox = document.getElementById('lightbox');
    if(lightbox) lightbox.style.display = "none";
}
document.getElementById('lightbox')?.addEventListener('click', function(e) {
    if (e.target === this) closeLightbox();
});
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeLightbox(); });

function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            if (this.id === 'main-download-btn' || this.id === 'sticky-download-btn' || this.id === 'floating-desktop-btn') return;
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                e.preventDefault(); 
                const headerOffset = 70; 
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
            }
        });
    });
}

function initFAQ() {
    const faqQuestions = document.querySelectorAll('.faq-question');
    faqQuestions.forEach(question => {
        question.addEventListener('click', () => {
            const parent = question.parentElement;
            const answer = question.nextElementSibling;
            document.querySelectorAll('.faq-item').forEach(item => {
                if (item !== parent) {
                    item.classList.remove('active');
                    item.querySelector('.faq-answer').style.maxHeight = null;
                }
            });
            parent.classList.toggle('active');
            if (parent.classList.contains('active')) {
                answer.style.maxHeight = answer.scrollHeight + "px";
            } else {
                answer.style.maxHeight = null;
            }
        });
    });
}

window.addEventListener('scroll', () => {
    const currentScrollY = window.scrollY;
    const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrollPercent = (currentScrollY / scrollHeight) * 100;
    
    const progressBar = document.getElementById('scroll-progress');
    if (progressBar) progressBar.style.width = scrollPercent + '%';
    const header = document.getElementById('header');
    if (header) {
        if (currentScrollY > 10) header.classList.add('scrolled');
        else header.classList.remove('scrolled');
    }
    const scrollTopBtn = document.getElementById('scroll-top');
    const floatDesktopBtn = document.getElementById('floating-desktop-btn');
    if (currentScrollY > 300) {
        if (scrollTopBtn) scrollTopBtn.classList.add('show');
        if (floatDesktopBtn) floatDesktopBtn.classList.add('show'); 
    } else {
        if (scrollTopBtn) scrollTopBtn.classList.remove('show');
        if (floatDesktopBtn) floatDesktopBtn.classList.remove('show');
    }
    const stickyBar = document.getElementById('mobile-sticky-bar');
    if (stickyBar) {
        if (currentScrollY > 300) stickyBar.classList.add('show');
        else stickyBar.classList.remove('show');
    }
});

document.getElementById('scroll-top')?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

function showToast(message) {
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toast-msg');
    if (!toast || !toastMsg) return;
    toastMsg.textContent = message;
    toast.classList.add('show');
    setTimeout(() => { toast.classList.remove('show'); }, 3000);
}

document.getElementById('share-btn')?.addEventListener('click', async () => {
    if (navigator.share) {
        try { await navigator.share({ title: 'SnapPro', text: 'Download SnapPro!', url: window.location.href }); } catch (err) {}
    } else {
        navigator.clipboard.writeText(window.location.href);
        showToast('Website link copied!');
    }
});

const menuBtn = document.getElementById('menu-btn');
const mobileMenu = document.getElementById('mobile-menu');
if (menuBtn && mobileMenu) {
    menuBtn.addEventListener('click', (e) => {
        e.preventDefault(); 
        menuBtn.classList.toggle('active');
        mobileMenu.classList.toggle('active');
        if (mobileMenu.classList.contains('active')) document.body.classList.add('menu-open');
        else document.body.classList.remove('menu-open');
    });
    document.querySelectorAll('.mobile-link').forEach(link => {
        link.addEventListener('click', () => {
            menuBtn.classList.remove('active');
            mobileMenu.classList.remove('active');
            document.body.classList.remove('menu-open');
        });
    });
}

const revealElements = document.querySelectorAll('.reveal, .reveal-item');
const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            entry.target.classList.add('active');
            revealObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.1 });
revealElements.forEach(el => revealObserver.observe(el));

function copyLink(url) {
    navigator.clipboard.writeText(url).then(() => showToast('Download link copied!'));
}

async function loadApp() {
    const descEl = document.getElementById('app-desc');
    const mainBtn = document.getElementById('main-download-btn');
    const skeletonBtn = document.getElementById('download-skeleton');
    const versionsContainer = document.getElementById('versions-container');
    const stickyBtn = document.getElementById('sticky-download-btn');
    const floatDesktopBtn = document.getElementById('floating-desktop-btn');
    const stickyMeta = document.getElementById('sticky-meta');
    const metaEl = document.getElementById('app-meta');
    const techSize = document.getElementById('tech-size');
    const techVersion = document.getElementById('tech-version');
    const techDate = document.getElementById('tech-date');

    if (!versionsContainer) return;

    try {
        const response = await fetch('/api/apps');
        const apps = await response.json();

        if (apps.length === 0) {
            if (skeletonBtn) skeletonBtn.style.display = 'none';
            versionsContainer.innerHTML = `<div style="text-align:center; padding: 40px; color: var(--text-muted);">No app uploaded yet.</div>`;
            if (metaEl) metaEl.textContent = "No version available"; 
            return;
        }

        const app = apps[0]; 
        if (descEl) descEl.textContent = app.description || "The fastest video downloader.";
        const latest = app.versions[0];
        
        if (skeletonBtn) skeletonBtn.style.display = 'none';
        if (mainBtn) {
            mainBtn.style.display = 'inline-flex';
            mainBtn.href = `/download/${latest.version}`; 
        }
        if (stickyBtn) stickyBtn.href = `/download/${latest.version}`;
        if (floatDesktopBtn) floatDesktopBtn.href = `/download/${latest.version}`;
        if (stickyMeta) stickyMeta.textContent = `v${latest.version} • ${latest.size}`;
        if (techSize) techSize.textContent = latest.size;
        if (techVersion) techVersion.textContent = `v${latest.version}`;
        if (techDate) techDate.textContent = latest.date;
        if (metaEl) metaEl.textContent = `v${latest.version} • ${latest.size} • Android 8.0+`;

        versionsContainer.innerHTML = '';
        app.versions.forEach((v, index) => {
            const isLatest = index === 0;
            const item = document.createElement('div');
            item.className = 'version-item reveal-item';
            
            const infoDiv = document.createElement('div');
            infoDiv.className = 'version-info';
            const headerDiv = document.createElement('div');
            headerDiv.className = 'version-header';
            const numSpan = document.createElement('span');
            numSpan.className = 'version-number';
            numSpan.textContent = `v${v.version}`;
            headerDiv.appendChild(numSpan);
            if(isLatest) {
                const badge = document.createElement('span');
                badge.className = 'badge-latest';
                badge.textContent = 'Latest';
                headerDiv.appendChild(badge);
            }
            const metaSpan = document.createElement('span');
            metaSpan.className = 'version-meta';
            metaSpan.textContent = `${v.size} • Released on ${v.date}`;
            infoDiv.appendChild(headerDiv);
            infoDiv.appendChild(metaSpan);
            
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'version-actions';
            const copyBtn = document.createElement('button');
            copyBtn.className = 'btn-copy';
            copyBtn.title = "Copy Link";
            copyBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;
            copyBtn.addEventListener('click', () => copyLink(`${window.location.origin}/download/${v.version}`));
            
            const dlLink = document.createElement('a');
            dlLink.className = 'btn-download-small';
            dlLink.href = `/download/${v.version}`;
            dlLink.textContent = 'Download';
            
            actionsDiv.appendChild(copyBtn);
            actionsDiv.appendChild(dlLink);
            item.appendChild(infoDiv);
            item.appendChild(actionsDiv);
            versionsContainer.appendChild(item);
            revealObserver.observe(item);
        });
    } catch (error) {
        versionsContainer.innerHTML = `<div style="text-align:center; color: #ef4444;">Failed to load data.</div>`;
        if (metaEl) metaEl.textContent = "Failed to load version.";
        if (skeletonBtn) skeletonBtn.style.display = 'none';
        if (stickyMeta) stickyMeta.textContent = 'Unavailable';
    }
}
