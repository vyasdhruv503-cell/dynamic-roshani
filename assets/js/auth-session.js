/**
 * RTPL Smart Digital Academy - Authentication Session Handler
 * Manages user login state, updates header menus dynamically, and handles logout.
 */

(function () {
  // Check if user is logged in
  function getSession() {
    const sessionStr = localStorage.getItem('rtpl_user_session');
    if (!sessionStr) return null;
    try {
      return JSON.parse(sessionStr);
    } catch (e) {
      return null;
    }
  }

  // Update header actions dynamically
  function updateNavForSession() {
    const session = getSession();
    
    // Find desktop and mobile containers where the login/signup buttons are located.
    const desktopActions = document.querySelector('header #theme-toggle')?.parentElement;
    if (!desktopActions) return;

    // Check if we already created a user profile dropdown
    let userMenu = document.getElementById('user-profile-menu');
    if (userMenu) {
      userMenu.remove();
    }

    // Hide/show the desktop Sign In / Sign Up wrapper by its ID
    const desktopAuthWrapper = document.getElementById('desktop-auth-buttons');
    if (desktopAuthWrapper) {
      if (session) {
        desktopAuthWrapper.style.setProperty('display', 'none', 'important');
      } else {
        desktopAuthWrapper.style.removeProperty('display');
      }
    }

    // Also hide individual links as a fallback (handles pages without the ID)
    const authLinks = document.querySelectorAll('header a[href$="login.html"], header a[href$="signup.html"]');
    authLinks.forEach(link => {
      if (session) {
        link.style.setProperty('display', 'none', 'important');
      } else {
        link.style.removeProperty('display');
      }
    });

    if (session) {
      // User is logged in - Create profile avatar with logout dropdown
      const avatarUrl = session.picture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=60';
      const initials = session.name ? session.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'U';

      const userMenuHtml = `
        <div id="user-profile-menu" class="relative flex items-center gap-3">
          <button id="user-avatar-btn" class="flex items-center gap-2 focus:outline-none cursor-pointer group">
            <div class="w-10 h-10 rounded-full border-2 border-brandBlue overflow-hidden shadow-sm transition-transform duration-200 group-hover:scale-105">
              ${session.picture ? `<img src="${avatarUrl}" class="w-full h-full object-cover">` : `<div class="w-full h-full bg-brandBlue text-white font-extrabold flex items-center justify-center text-xs">${initials}</div>`}
            </div>
            <div class="hidden md:flex flex-col text-left">
              <span class="text-xs font-black text-slate-900 dark:text-white leading-tight">${session.name || 'User'}</span>
              <span class="text-[9px] text-slate-400 font-semibold leading-none">${session.email || ''}</span>
            </div>
            <svg class="w-4 h-4 text-slate-400 transition-transform duration-200 group-hover:translate-y-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/>
            </svg>
          </button>

          <!-- Premium Dropdown Card -->
          <div id="user-dropdown-card" class="absolute right-0 top-12 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl py-4 px-4 z-50 hidden transition-all duration-200 transform opacity-0 scale-95 origin-top-right space-y-4">
            
            <!-- User Info Section -->
            <div class="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div class="w-12 h-12 rounded-full overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-center">
                ${session.picture ? `<img src="${avatarUrl}" class="w-full h-full object-cover">` : `<div class="w-full h-full bg-brandBlue text-white font-extrabold flex items-center justify-center text-sm">${initials}</div>`}
              </div>
              <div class="flex flex-col text-left">
                <span class="text-xs font-black text-slate-900 dark:text-white leading-tight">${session.name || 'User'}</span>
                <span class="text-[10px] text-slate-400 font-semibold leading-none truncate max-w-[150px] mt-0.5">${session.email || ''}</span>
              </div>
            </div>

            <!-- Portal Links (Admin Portal if matched or custom dashboard) -->
            <div class="space-y-1">
              <a href="profile.html" class="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:text-brandBlue transition-all group">
                <i data-lucide="user" class="w-4 h-4 !w-4 !h-4 text-slate-400 group-hover:text-brandBlue transition-colors flex-shrink-0"></i>
                <span>My Profile</span>
              </a>
              <a href="gemini-ai.html" class="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:text-brandBlue transition-all group">
                <!-- Sparkle Star Icon SVG -->
                <svg class="w-4 h-4 text-indigo-500 group-hover:text-indigo-600 transition-colors flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l2.4 4.8 5.3.8-3.8 3.7.9 5.3-4.8-2.5-4.8 2.5.9-5.3-3.8-3.7 5.3-.8z" />
                </svg>
                <span>tech AI Workspace</span>
              </a>
            </div>

            <!-- Sign Out Button -->
            <button onclick="window.handleRtplLogout()" class="w-full text-left px-3 py-2 text-xs font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors flex items-center gap-2.5 rounded-xl cursor-pointer group">
              <i data-lucide="log-out" class="w-4 h-4 !w-4 !h-4 text-rose-450 group-hover:translate-x-0.5 transition-transform flex-shrink-0"></i>
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      `;

      // Insert user menu before the mobile menu toggle or at the end
      const themeToggleBtn = document.getElementById('theme-toggle');
      if (themeToggleBtn) {
        themeToggleBtn.insertAdjacentHTML('afterend', userMenuHtml);
      } else {
        desktopActions.insertAdjacentHTML('beforeend', userMenuHtml);
      }

      // Add Click Action to Dropdown
      const avatarBtn = document.getElementById('user-avatar-btn');
      const dropdownCard = document.getElementById('user-dropdown-card');

      if (avatarBtn && dropdownCard) {
        avatarBtn.addEventListener('click', function (e) {
          e.stopPropagation();
          const isHidden = dropdownCard.classList.contains('hidden');
          if (isHidden) {
            dropdownCard.classList.remove('hidden');
            lucide.createIcons(); // Initialize the dynamic icons
            setTimeout(() => {
              dropdownCard.classList.remove('opacity-0', 'scale-95');
              dropdownCard.classList.add('opacity-100', 'scale-100');
            }, 10);
          } else {
            closeDropdown();
          }
        });

        document.addEventListener('click', function (e) {
          if (!dropdownCard.contains(e.target) && !avatarBtn.contains(e.target)) {
            closeDropdown();
          }
        });

        function closeDropdown() {
          dropdownCard.classList.remove('opacity-100', 'scale-100');
          dropdownCard.classList.add('opacity-0', 'scale-95');
          setTimeout(() => {
            dropdownCard.classList.add('hidden');
          }, 200);
        }
      }

      // Update Mobile Menu Drawer using reliable ID
      const mobileAuthGrid = document.getElementById('mobile-auth-buttons');
      if (mobileAuthGrid) {
        mobileAuthGrid.innerHTML = `
          <div class="col-span-2 flex flex-col gap-3 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full border border-brandBlue overflow-hidden">
                ${session.picture ? `<img src="${avatarUrl}" class="w-full h-full object-cover">` : `<div class="w-full h-full bg-brandBlue text-white font-black flex items-center justify-center text-xs">${initials}</div>`}
              </div>
              <div class="flex flex-col text-left">
                <span class="text-xs font-black text-slate-900 dark:text-white leading-tight">${session.name || 'User'}</span>
                <span class="text-[9px] text-slate-400 font-semibold leading-none truncate max-w-[130px]">${session.email || ''}</span>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-2 border-t border-slate-200/50 dark:border-slate-700/50 pt-3">
              <a href="profile.html" class="text-center py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-200 rounded-lg">My Profile</a>
              <button onclick="window.handleRtplLogout()" class="text-center py-2 bg-rose-500 hover:bg-rose-600 text-white font-black text-[10px] uppercase tracking-wider rounded-lg transition-colors cursor-pointer">Sign Out</button>
            </div>
          </div>
        `;
      }
    } else {
      // User not logged in — restore the mobile auth grid to default Sign In / Sign Up
      const mobileAuthGrid = document.getElementById('mobile-auth-buttons');
      if (mobileAuthGrid) {
        mobileAuthGrid.innerHTML = `
          <a href="login.html" class="w-full text-center inline-flex items-center justify-center px-4 py-3 border border-slate-200/80 dark:border-slate-800/80 text-slate-700 dark:text-slate-300 font-bold text-xs uppercase tracking-wider rounded-xl transition-all hover:bg-slate-100 dark:hover:bg-slate-800">Sign In</a>
          <a href="signup.html" class="w-full text-center inline-flex items-center justify-center px-4 py-3 bg-brandBlue text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm">Sign Up</a>
        `;
      }
    }
  }

  // Logout Function
  window.handleRtplLogout = function () {
    localStorage.removeItem('rtpl_user_session');
    // Redirect to home page on logout
    window.location.href = 'index.html';
  };

  // Run on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateNavForSession);
  } else {
    updateNavForSession();
  }

  // --- tech AI Floating Assistant Widget ---
  function initTechAiWidget() {
    // Avoid rendering on the chat page itself
    if (window.location.pathname.includes('gemini-ai.html')) return;

    // Inject custom CSS animation styles
    const styles = `
      @keyframes techAiSlideIn {
        0% { opacity: 0; transform: translateY(40px) scale(0.9); }
        60% { opacity: 1; transform: translateY(-10px) scale(1.02); }
        100% { opacity: 1; transform: translateY(0) scale(1); }
      }
      @keyframes techAiPulse {
        0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.7); }
        70% { transform: scale(1.05); box-shadow: 0 0 0 12px rgba(99, 102, 241, 0); }
        100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(99, 102, 241, 0); }
      }
      .tech-ai-pulse {
        animation: techAiPulse 2s infinite;
      }
      .tech-ai-popup {
        animation: techAiSlideIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
      }
    `;
    const styleEl = document.createElement('style');
    styleEl.textContent = styles;
    document.head.appendChild(styleEl);

    // Create container
    const container = document.createElement('div');
    container.id = 'tech-ai-widget-container';
    container.className = 'fixed bottom-24 right-6 z-40 flex flex-col items-end gap-3';
    
    // Check if dismissed before
    const isDismissed = localStorage.getItem('tech_ai_popup_dismissed') === 'true';

    // HTML Content
    container.innerHTML = `
      <!-- Popup Dialog -->
      <div id="tech-ai-popup-card" class="tech-ai-popup bg-slate-900/95 dark:bg-slate-900/95 border border-white/10 rounded-2xl p-4 shadow-2xl backdrop-blur-md text-white flex flex-col gap-3 w-[290px] md:w-[320px] transition-all duration-300 ${isDismissed ? 'hidden' : ''}">
        <!-- Header -->
        <div class="flex items-center justify-between border-b border-white/5 pb-2">
          <div class="flex items-center gap-2">
            <span class="text-indigo-400 text-sm">✦</span>
            <span class="text-xs font-black tracking-wider uppercase text-slate-300">tech AI Assistant</span>
          </div>
          <button id="tech-ai-close-btn" class="text-slate-400 hover:text-white transition-colors cursor-pointer text-xs font-black p-1 hover:bg-white/5 rounded">✕</button>
        </div>
        <!-- Body -->
        <div class="flex gap-3 items-start">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white text-lg font-black shadow-lg flex-shrink-0">✦</div>
          <div class="flex flex-col gap-1">
            <h4 class="text-xs font-black text-white">Need help choosing a course?</h4>
            <p class="text-[11px] text-slate-400 font-semibold leading-relaxed">Ask me about AutoCAD, Revit, SolidWorks, placement details, or class timings!</p>
          </div>
        </div>
        <!-- Footer / Action -->
        <div class="flex justify-end pt-1">
          <a href="gemini-ai.html" class="px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-black rounded-xl transition-all shadow-md flex items-center gap-1.5 hover:-translate-y-0.5">
            <span>Chat Now</span>
            <span class="text-[10px]">✦</span>
          </a>
        </div>
      </div>

      <!-- Floating Circle Button -->
      <button id="tech-ai-trigger-btn" class="tech-ai-pulse w-14 h-14 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 hover:from-indigo-500 hover:to-violet-500 text-white shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer relative group">
        <!-- Shine Overlay -->
        <div class="absolute inset-0 rounded-full bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <!-- Icon -->
        <svg class="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        <!-- Unread badge indicator -->
        ${isDismissed ? '' : '<span class="absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-500 border border-white rounded-full"></span>'}
      </button>
    `;

    document.body.appendChild(container);

    const closeBtn = document.getElementById('tech-ai-close-btn');
    const popupCard = document.getElementById('tech-ai-popup-card');
    const triggerBtn = document.getElementById('tech-ai-trigger-btn');

    if (closeBtn && popupCard) {
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        popupCard.classList.add('hidden');
        localStorage.setItem('tech_ai_popup_dismissed', 'true');
        // Remove red badge
        const badge = triggerBtn.querySelector('.bg-red-500');
        if (badge) badge.remove();
      });
    }

    if (triggerBtn) {
      triggerBtn.addEventListener('click', () => {
        // Toggle popup display
        if (popupCard.classList.contains('hidden')) {
          popupCard.classList.remove('hidden');
        } else {
          // If already open, go directly to chat page!
          window.location.href = 'gemini-ai.html';
        }
      });
    }
  }

  // Run on load after 3 seconds for new users (or immediately if not dismissed)
  const isDismissed = localStorage.getItem('tech_ai_popup_dismissed') === 'true';
  setTimeout(initTechAiWidget, isDismissed ? 500 : 3000);
})();
