/* ************************************************************************

   cc-notify.js  +  cc-confirm.js  — combined build
   ─────────────────────────────────────────────────────────────────────────
   Two standalone UI utilities that share the same design language.
   No external dependencies.  Works as a plain <script>, CommonJS module,
   or AMD module.

   ════════════════════════════════════════════════════════════════════════
   ccNotify  —  toast / notification popups
   ════════════════════════════════════════════════════════════════════════

   Displays a self-dismissing pill-shaped notification.  Three types:
   info (default), warning, and error.

   Basic usage:
     ccNotify('Your message here')               // info (default)
     ccNotify('Your message here', 'info')
     ccNotify('Something to watch out for', 'warning')
     ccNotify('Something went wrong', 'error')

   With options:
     ccNotify('Saved!', 'info', {
       duration : 4000,    // ms before auto-dismiss. 0 = no auto-dismiss.
                           //   default: 3500
       position : 'top',  // 'top' | 'bottom'   default: 'bottom'
       closable : true,   // show × button       default: true
       html     : false,  // treat message as HTML instead of plain text
       onClick  : null,   // function called when the notification is clicked
     })

   Convenience aliases:
     ccNotify.info('msg', opts)
     ccNotify.warning('msg', opts)   // also: ccNotify.warn(...)
     ccNotify.error('msg', opts)

   Return value:
     Every call returns a dismiss callback you can invoke to close the
     notification early:
       var close = ccNotify('Uploading…', 'info', { duration: 0 });
       close();   // removes it immediately

   Type synonyms accepted for the second argument:
     'warn'    → 'warning'
     'err'     → 'error'
     'danger'  → 'error'
     'success' → 'info'   (no separate success type)

   ════════════════════════════════════════════════════════════════════════
   ccConfirm  —  confirm / prompt dialogs
   ════════════════════════════════════════════════════════════════════════

   Displays a modal dialog with a message and one or more action buttons.
   A "Cancel" button is always appended automatically as the final button.
   The user's choice is delivered via a callback.

   Basic usage:
     ccConfirm('Are you sure?', function (choice) {
       // choice === 'ok'   → OK was clicked  (default single button)
       // choice === null   → Cancel was clicked (or Escape / click-outside)
     })

   Custom buttons (string shorthand — value = label.toLowerCase()):
     ccConfirm('Delete this file?', function (choice) {
       if (choice === 'delete') doDelete();
     }, {
       buttons : ['Delete'],
       type    : 'error',
     })

   Custom buttons (explicit label + value pairs):
     ccConfirm('How do you want to proceed?', function (choice) {
       if      (choice === 'save')    save();
       else if (choice === 'discard') discard();
       // choice === null → cancelled
     }, {
       buttons : [
         { label: 'Save',    value: 'save'    },
         { label: 'Discard', value: 'discard' },
       ],
       type     : 'warning',  // 'info' | 'warning' | 'error'  default: 'info'
       position : 'bottom',   // 'top'  | 'bottom'             default: 'bottom'
       html     : false,      // treat message as HTML          default: false
       cancelLabel: 'Cancel', // custom label for the Cancel button
     })

   Button spec — each item in options.buttons may be:
     string           →  { label: string, value: string.toLowerCase() }
     { label, value } →  used as-is

   The first action button receives the primary (accent) visual treatment.
   Cancel is always last.

   Convenience aliases:
     ccConfirm.info('msg', cb, opts)
     ccConfirm.warning('msg', cb, opts)   // also: ccConfirm.warn(...)
     ccConfirm.error('msg', cb, opts)

   Return value:
     Returns a programmatic-dismiss callback that closes the dialog and
     passes null to the callback (same effect as the user clicking Cancel):
       var close = ccConfirm('Processing…', handler, { buttons: [] });
       close();

   Keyboard & accessibility:
     • Escape key        → Cancel
     • Click on backdrop → Cancel
     • Focus is moved to the first action button on open
     • role="alertdialog" + aria-modal="true" on the dialog element

   ════════════════════════════════════════════════════════════════════════
   Design tokens
   ════════════════════════════════════════════════════════════════════════

   Both utilities read CSS custom properties from :root when available and
   fall back to the gold / navy palette used in cc-shared.css.
   They work correctly with or without that stylesheet.

     --font-body  (default: "DM Sans", sans-serif)
     --radius     (default: 10px)
     --white      (default: #FFFFFF)
     --navy       (default: #1A2744)  ← info background
     --gold       (default: #C9A84C)  ← info accent bar / border
     --amber      (default: #B7700A)  ← warning background
     --red        (default: #C0392B)  ← error background

   ════════════════════════════════════════════════════════════════════════
   License: MIT
   ════════════════════════════════════════════════════════════════════════

************************************************************************ */

(function (root, factory) {
    /* ── UMD wrapper ────────────────────────────────────────────────────────
       Supports three module systems without any build step:
         • Plain <script> tag  →  exposes root.ccNotify and root.ccConfirm
         • CommonJS (Node/bundlers) →  module.exports = { ccNotify, ccConfirm }
         • AMD (RequireJS)     →  define([], factory)                        */
    if (typeof define === 'function' && define.amd) {
        define([], function () { return factory(); });
    } else if (typeof module === 'object' && typeof module.exports === 'object') {
        module.exports = factory();
    } else {
        var exports    = factory();
        root.ccNotify  = exports.ccNotify;
        root.ccConfirm = exports.ccConfirm;
        root.ccPrompt  = exports.ccPrompt;
        /* Unified facade: notify.success / .info / .warning / .error for
           toasts, plus notify.confirm / notify.prompt for dialogs. This is the
           single object app code should call; it routes straight into this
           engine. (nx.util.notify* also routes here, see cc-shared.js.) */
        root.notify = {
            info:    function (m, o) { return exports.ccNotify(m, 'info',    o); },
            success: function (m, o) { return exports.ccNotify(m, 'info',    o); },
            warning: function (m, o) { return exports.ccNotify(m, 'warning', o); },
            warn:    function (m, o) { return exports.ccNotify(m, 'warning', o); },
            error:   function (m, o) { return exports.ccNotify(m, 'error',   o); },
            confirm: function (m, cb, o) { return exports.ccConfirm(m, cb, o); },
            prompt:  function (m, cb, o) { return exports.ccPrompt(m, cb, o); },
        };
    }
}(typeof globalThis !== 'undefined' ? globalThis
  : typeof window   !== 'undefined' ? window : this,

function () {
    'use strict';

    /* ────────────────────────────────────────────────────────────────────────
       Guard: both utilities require a real DOM.
       In server-side / non-browser environments they silently become no-ops
       so that imports do not crash SSR builds.
    ──────────────────────────────────────────────────────────────────────── */
    if (typeof document === 'undefined') {
        var noop = function () { return function () {}; };
        noop.info = noop.warning = noop.warn = noop.error = noop;
        return { ccNotify: noop, ccConfirm: noop, ccPrompt: noop };
    }

    var doc = document;

    /* ════════════════════════════════════════════════════════════════════════
       SHARED INTERNALS
       Utilities, design tokens, and helpers used by both ccNotify and
       ccConfirm live here so they are defined exactly once.
    ════════════════════════════════════════════════════════════════════════ */

    /* ── Design tokens ──────────────────────────────────────────────────────
       Each value is a CSS var() expression with a hard-coded literal
       fallback.  This means the palette is consistent whether or not
       cc-shared.css (or any other stylesheet) is loaded.                    */
    var T = {
        fontBody : 'var(--font-body,"DM Sans",sans-serif)',
        radius   : 'var(--radius,10px)',
        white    : 'var(--white,#FFFFFF)',

        /* info  — navy background, gold accent */
        infoBg   : 'var(--notify-green-bg,#EAF7EE)',
        infoBar  : 'var(--notify-green,#007A3D)',
        infoText : 'var(--notify-green-text,#124025)',

        /* warning — amber background */
        warnBg   : 'var(--amber,#B7700A)',
        warnBar  : '#FDE68A',
        warnText : '#FFFFFF',

        /* error — red background */
        errorBg  : 'var(--red,#C0392B)',
        errorBar : '#FCA5A5',
        errorText: '#FFFFFF',
    };

    /* ── Icon glyphs per type ───────────────────────────────────────────── */
    var ICONS = { info: 'ℹ', warning: '⚠', error: '✕' };

    /* ── Type normaliser ────────────────────────────────────────────────────
       Accepts the canonical names plus a handful of common synonyms.
       Always returns one of: 'info' | 'warning' | 'error'.                 */
    var VALID_TYPES = { info: true, warning: true, error: true };

    function normaliseType(type) {
        if (!type) return 'info';
        var t = String(type).toLowerCase().trim();
        if (t === 'warn')    return 'warning';
        if (t === 'err')     return 'error';
        if (t === 'danger')  return 'error';
        if (t === 'success') return 'info';     // no separate success type
        return VALID_TYPES[t] ? t : 'info';
    }

    /* ── Shared keyframe block ──────────────────────────────────────────────
       Both utilities use the same enter / exit animations.  Defined once
       here so the CSS string can be embedded in both style blocks without
       browsers complaining about duplicate @keyframes declarations.         */
    var KEYFRAMES = [
        '@keyframes cc-notify-enter{',
        '  from{opacity:0;transform:translateY(14px) scale(0.95);}',
        '  to  {opacity:1;transform:translateY(0)    scale(1);}',
        '}',
        '@keyframes cc-notify-exit{',
        '  from{opacity:1;transform:scale(1);}',
        '  to  {opacity:0;transform:scale(0.92) translateY(8px);}',
        '}',
    ].join('\n');

    /* ── Shared type-theme block ────────────────────────────────────────────
       Produces the three colour-theme rules for a given CSS selector.
       Used by both the notify item and the confirm dialog so the colours
       are guaranteed to be identical.                                       */
    function typeThemeCSS(sel) {
        return [
            sel + '.cc-info{',
            '  background:'       + T.infoBg   + ';',
            '  color:'            + T.infoText + ';',
            '  border-left-color:' + T.infoBar  + ';',
            '}',
            sel + '.cc-info .cc-bar{background:' + T.infoBar + ';}',

            sel + '.cc-warning{',
            '  background:'       + T.warnBg   + ';',
            '  color:'            + T.warnText + ';',
            '  border-left-color:' + T.warnBar  + ';',
            '}',
            sel + '.cc-warning .cc-bar{background:' + T.warnBar + ';}',

            sel + '.cc-error{',
            '  background:'       + T.errorBg   + ';',
            '  color:'            + T.errorText + ';',
            '  border-left-color:' + T.errorBar  + ';',
            '}',
            sel + '.cc-error .cc-bar{background:' + T.errorBar + ';}',
        ].join('\n');
    }

    /* ════════════════════════════════════════════════════════════════════════
       ccNOTIFY — IMPLEMENTATION
    ════════════════════════════════════════════════════════════════════════ */

    /* ── Notify styles (injected once, on first call) ───────────────────── */
    var NOTIFY_STYLE_ID = 'cc-notify-styles';

    function injectNotifyStyles() {
        if (doc.getElementById(NOTIFY_STYLE_ID)) return;

        var css = [
            /* ── Stack container ──────────────────────────────────────────
               Fixed, horizontally centred column that stacks notification
               pills.  pointer-events:none lets clicks fall through to the
               page; individual items re-enable pointer events.             */
            '#cc-notify-stack{',
            '  position:fixed;',
            '  left:50%;',
            '  transform:translateX(-50%);',
            '  display:flex;',
            '  flex-direction:column;',
            '  align-items:center;',
            '  gap:10px;',
            '  z-index:9999;',
            '  pointer-events:none;',
            '  width:max-content;',
            '  max-width:min(420px,90vw);',
            '}',

            /* pos-bottom: new toasts stack upward from the bottom edge */
            '#cc-notify-stack.pos-bottom{',
            '  bottom:28px;',
            '  top:auto;',
            '  flex-direction:column-reverse;',
            '}',

            /* pos-top: new toasts stack downward from the top edge */
            '#cc-notify-stack.pos-top{',
            '  top:24px;',
            '  bottom:auto;',
            '  flex-direction:column;',
            '}',

            /* ── Individual notification pill ─────────────────────────────
               Left border provides a quick colour-coded type indicator.
               overflow:hidden keeps the bottom progress bar clipped to the
               rounded corners.                                             */
            '.cc-notify-item{',
            '  position:relative;',
            '  display:flex;',
            '  align-items:flex-start;',
            '  gap:11px;',
            '  min-width:260px;',
            '  max-width:420px;',
            '  padding:13px 16px 13px 16px;',
            '  border-radius:10px;',
            '  box-shadow:0 8px 32px rgba(0,0,0,0.22),0 2px 8px rgba(0,0,0,0.14);',
            '  font-family:' + T.fontBody + ';',
            '  font-size:13.5px;',
            '  font-weight:500;',
            '  line-height:1.5;',
            '  letter-spacing:0.01em;',
            '  pointer-events:all;',
            '  cursor:default;',
            '  overflow:hidden;',
            '  border-left:4px solid transparent;',
            '  user-select:none;',
            '}',

            /* Enter: slide up + fade in */
            '.cc-notify-item.cc-enter{',
            '  animation:cc-notify-enter 0.38s cubic-bezier(0.16,1,0.3,1) both;',
            '}',

            /* Exit: shrink + fade out */
            '.cc-notify-item.cc-exit{',
            '  animation:cc-notify-exit 0.28s ease-in forwards;',
            '}',

            KEYFRAMES,

            /* Icon glyph */
            '.cc-notify-icon{',
            '  font-size:17px;',
            '  flex-shrink:0;',
            '  line-height:1.3;',
            '  margin-top:1px;',
            '}',

            /* Message text — fills remaining width and wraps gracefully */
            '.cc-notify-msg{',
            '  flex:1;',
            '  word-break:break-word;',
            '}',

            /* × close button */
            '.cc-notify-close{',
            '  flex-shrink:0;',
            '  font-size:15px;',
            '  line-height:1;',
            '  cursor:pointer;',
            '  opacity:0.55;',
            '  margin-top:2px;',
            '  transition:opacity 0.15s;',
            '  padding:0 2px;',
            '}',
            '.cc-notify-close:hover{opacity:1;}',

            /* Progress bar — shrinks left-to-right over the duration.
               .cc-bar is the shared class; the type theme block targets it. */
            '.cc-notify-item .cc-bar{',
            '  position:absolute;',
            '  bottom:0; left:0;',
            '  height:3px;',
            '  border-radius:0 0 10px 10px;',
            '  width:100%;',
            '  transition:width linear;',
            '}',

            /* ── Type themes for notify items ───────────────────────────── */
            typeThemeCSS('.cc-notify-item'),
        ].join('\n');

        var el         = doc.createElement('style');
        el.id          = NOTIFY_STYLE_ID;
        el.textContent = css;
        (doc.head || doc.documentElement).appendChild(el);
    }

    /* ── Stack container ────────────────────────────────────────────────────
       A single <div> holds all active toasts; its position class is updated
       on every call so the last requested position always wins.             */
    function getStack(position) {
        var id    = 'cc-notify-stack';
        var pos   = position === 'top' ? 'pos-top' : 'pos-bottom';
        var stack = doc.getElementById(id);
        if (!stack) {
            stack    = doc.createElement('div');
            stack.id = id;
            doc.body.appendChild(stack);
        }
        stack.className = pos;
        return stack;
    }

    /* ── Dismiss a single notification ─────────────────────────────────────
       Cancels the auto-timer, freezes the progress bar at its current
       width, plays the exit animation, then removes the element from the
       DOM.  A setTimeout safety net fires if animationend never triggers
       (e.g. when animations are disabled via prefers-reduced-motion).       */
    function dismissNotify(item) {
        if (!item || item._dismissing) return;
        item._dismissing = true;

        clearTimeout(item._autoTimer);

        var bar = item.querySelector('.cc-bar');
        if (bar) {
            var w            = bar.offsetWidth;
            bar.style.transition = 'none';
            bar.style.width      = w + 'px';
        }

        item.classList.remove('cc-enter');
        item.classList.add('cc-exit');

        item.addEventListener('animationend', function () {
            if (item.parentNode) item.parentNode.removeChild(item);
        }, { once: true });

        setTimeout(function () {
            if (item.parentNode) item.parentNode.removeChild(item);
        }, 400);
    }

    /* ── ccNotify ───────────────────────────────────────────────────────────
       Main notification function — see top-of-file JSDoc for full API.     */
    function ccNotify(message, type, options) {
        if (typeof message !== 'string') message = String(message);

        /* Support ccNotify(msg, optionsObj) shorthand (skip the type arg) */
        if (type !== null && typeof type === 'object') {
            options = type;
            type    = 'info';
        }

        var kind     = normaliseType(type);
        var opts     = options || {};
        var duration = typeof opts.duration === 'number' ? opts.duration : 3500;
        var position = opts.position === 'top' ? 'top' : 'bottom';
        var closable = opts.closable !== false;
        var useHtml  = opts.html === true;

        injectNotifyStyles();

        /* Build the pill element */
        var item       = doc.createElement('div');
        item.className = 'cc-notify-item cc-' + kind + ' cc-enter';

        /* Icon */
        var iconEl           = doc.createElement('span');
        iconEl.className     = 'cc-notify-icon';
        iconEl.setAttribute('aria-hidden', 'true');
        iconEl.textContent   = ICONS[kind];

        /* Message */
        var msgEl        = doc.createElement('span');
        msgEl.className  = 'cc-notify-msg';
        msgEl.setAttribute('role', 'status');
        if (useHtml) { msgEl.innerHTML   = message; }
        else         { msgEl.textContent = message; }

        item.appendChild(iconEl);
        item.appendChild(msgEl);

        /* Optional × close button */
        if (closable) {
            var closeBtn         = doc.createElement('span');
            closeBtn.className   = 'cc-notify-close';
            closeBtn.textContent = '✕';
            closeBtn.setAttribute('aria-label', 'Close');
            closeBtn.setAttribute('role', 'button');
            closeBtn.setAttribute('tabindex', '0');
            closeBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                dismissNotify(item);
            });
            closeBtn.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    dismissNotify(item);
                }
            });
            item.appendChild(closeBtn);
        }

        /* Progress bar (hidden when duration === 0) */
        var bar       = doc.createElement('div');
        bar.className = 'cc-bar';
        if (duration > 0) {
            bar.style.width              = '100%';
            bar.style.transitionDuration = duration + 'ms';
        } else {
            bar.style.display = 'none';
        }
        item.appendChild(bar);

        /* Click the notification body to dismiss (and fire onClick) */
        item.addEventListener('click', function () {
            if (typeof opts.onClick === 'function') opts.onClick();
            dismissNotify(item);
        });

        /* Hover pauses the auto-dismiss timer and freezes the progress bar */
        var pausedAt = 0;
        var elapsed  = 0;

        if (duration > 0) {
            item.addEventListener('mouseenter', function () {
                clearTimeout(item._autoTimer);
                pausedAt = Date.now();
                var pct  = Math.max(0, 1 - (elapsed + (Date.now() - item._startTime)) / duration);
                bar.style.transition = 'none';
                bar.style.width      = (pct * 100) + '%';
            });

            item.addEventListener('mouseleave', function () {
                var additional     = Date.now() - pausedAt;
                elapsed           += additional;
                var remaining      = Math.max(0, duration - elapsed);
                bar.style.transitionDuration = remaining + 'ms';
                bar.style.width              = '0%';
                item._autoTimer = setTimeout(function () {
                    dismissNotify(item);
                }, remaining);
            });
        }

        /* Insert into the stack */
        var stack = getStack(position);
        stack.appendChild(item);

        /* Kick off the shrinking progress bar on the next two animation
           frames — one frame is sometimes not enough for the transition
           to register after the element is first painted.                   */
        if (duration > 0) {
            item._startTime = Date.now();
            requestAnimationFrame(function () {
                requestAnimationFrame(function () {
                    bar.style.width = '0%';
                });
            });
            item._autoTimer = setTimeout(function () {
                dismissNotify(item);
            }, duration);
        }

        /* Return a manual-dismiss callback */
        return function () { dismissNotify(item); };
    }

    /* Convenience aliases */
    ccNotify.info    = function (msg, opts) { return ccNotify(msg, 'info',    opts); };
    ccNotify.warning = function (msg, opts) { return ccNotify(msg, 'warning', opts); };
    ccNotify.warn    = ccNotify.warning;
    ccNotify.error   = function (msg, opts) { return ccNotify(msg, 'error',   opts); };

    /* ════════════════════════════════════════════════════════════════════════
       ccCONFIRM — IMPLEMENTATION
    ════════════════════════════════════════════════════════════════════════ */

    /* ── Confirm styles (injected once, on first call) ──────────────────── */
    var CONFIRM_STYLE_ID = 'cc-confirm-styles';

    function injectConfirmStyles() {
        if (doc.getElementById(CONFIRM_STYLE_ID)) return;

        // Chat-Intake modal format (matches ui/shared/cc-launcher.js's
        // "Start Chat Intake" dialog): a centered white card with a navy header
        // bar (white serif title + a boxed ✕), a white body, and a slate-light
        // footer holding a gold-outline cancel and a navy/gold primary button.
        // This replaces the previous bottom-anchored dark "pill" confirm so all
        // ccConfirm / ccPrompt callers share the Chat-Intake look.
        var css = [
            /* ── Backdrop: full-viewport scrim, dialog centered ── */
            '#cc-confirm-backdrop{',
            '  position:fixed;',
            '  inset:0;',
            '  background:rgba(18,64,37,.38);',
            '  z-index:2147483000;',
            '  display:flex;',
            '  align-items:center;',
            '  justify-content:center;',
            '  padding:20px;',
            '  animation:cc-confirm-fade-in 0.18s ease both;',
            '}',
            /* pos-top: dialog appears nearer the top of the viewport */
            '#cc-confirm-backdrop.pos-top{align-items:flex-start;padding-top:8vh;}',

            '@keyframes cc-confirm-fade-in{from{opacity:0;}to{opacity:1;}}',
            '@keyframes cc-confirm-fade-out{from{opacity:1;}to{opacity:0;}}',

            /* ── Dialog card ── */
            '#cc-confirm-dialog{',
            '  position:relative;',
            '  background:#fff;',
            '  width:100%;',
            '  max-width:440px;',
            '  border-radius:14px;',
            '  overflow:hidden;',
            '  box-shadow:0 18px 50px rgba(0,0,0,.3);',
            '  font-family:' + T.fontBody + ';',
            '  animation:cc-notify-enter 0.34s cubic-bezier(0.16,1,0.3,1) both;',
            '}',

            KEYFRAMES,

            /* ── Header bar: navy, white serif title, boxed ✕ ── */
            '.cc-confirm-header{',
            '  display:flex;align-items:center;justify-content:space-between;',
            '  padding:.85rem 1.25rem;',
            '  background:var(--notify-green,#007A3D);color:#fff;',
            '}',
            '.cc-confirm-title{',
            "  font-family:var(--font-heading,'DM Serif Display',serif);",
            '  font-size:1.05rem;',
            '}',
            '.cc-confirm-x{',
            '  background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.25);',
            '  color:#fff;width:28px;height:28px;border-radius:6px;cursor:pointer;',
            '  flex-shrink:0;font-size:14px;line-height:1;',
            '}',
            '.cc-confirm-x:hover{background:rgba(255,255,255,.2);}',
            '.cc-confirm-icon{display:none;}',     /* icon not used in this format */

            /* ── Body: the message (and input for ccPrompt) ── */
            '.cc-confirm-msg{',
            '  display:block;',
            '  padding:1.1rem 1.25rem;',
            '  color:var(--notify-green-text,#124025);',
            '  font-size:.9rem;line-height:1.5;',
            '  word-break:break-word;',
            '}',
            '.cc-confirm-msg.has-input{padding-bottom:.4rem;}',

            /* ── Footer: slate-light, right-aligned buttons ── */
            '.cc-confirm-buttons{',
            '  display:flex;flex-wrap:wrap;gap:.5rem;justify-content:flex-end;',
            '  padding:.85rem 1.25rem;',
            '  border-top:1px solid var(--notify-green-border,#B9DEC6);',
            '  background:var(--notify-green-soft,#F3FBF5);',
            '}',
            '.cc-confirm-btn{',
            '  padding:.5rem 1rem;border-radius:8px;',
            '  font-family:inherit;font-weight:700;font-size:.85rem;',
            '  cursor:pointer;white-space:nowrap;line-height:1.3;',
            '  border:1.5px solid var(--notify-green,#007A3D);',
            '  background:var(--notify-green-bg,#EAF7EE);color:var(--notify-green,#007A3D);',
            '  transition:background 0.15s,border-color 0.15s,opacity 0.15s;',
            '}',
            '.cc-confirm-btn:hover{background:#fff;}',
            '.cc-confirm-btn:active{opacity:0.8;}',
            '.cc-confirm-btn:focus-visible{outline:2px solid var(--notify-green,#007A3D);outline-offset:2px;}',
            /* Primary (first action): navy with gold text */
            '.cc-confirm-btn.cc-primary{',
            '  padding:.5rem 1.1rem;border:none;',
            '  background:var(--notify-green,#007A3D);color:#fff;',
            '}',
            '.cc-confirm-btn.cc-primary:hover{background:var(--notify-green-dark,#005B2E);}',
            /* Cancel: muted gold-outline (same as base) */
            '.cc-confirm-btn.cc-cancel{}',

            /* Accent bar retained as a no-op element (hidden in this format) */
            '#cc-confirm-dialog .cc-bar{display:none;}',

            /* ── Text input used by ccPrompt ── */
            '.cc-confirm-input{',
            '  width:calc(100% - 2.5rem);box-sizing:border-box;',
            '  margin:.2rem 1.25rem 1rem;',
            '  padding:.55rem .7rem;',
            '  font-family:inherit;font-size:.9rem;',
            '  color:var(--notify-green-text,#124025);',
            '  background:var(--notify-green-soft,#F3FBF5);',
            '  border:1.5px solid var(--notify-green-border,#B9DEC6);',
            '  border-radius:8px;outline:none;',
            '}',
            '.cc-confirm-input:focus{border-color:var(--notify-green,#007A3D);background:#fff;}',
            '.cc-confirm-input::placeholder{color:var(--notify-green-muted,#5F7D69);opacity:.7;}',
        ].join('\n');

        var el         = doc.createElement('style');
        el.id          = CONFIRM_STYLE_ID;
        el.textContent = css;
        (doc.head || doc.documentElement).appendChild(el);
    }

    /* ── Normalise a single button spec ─────────────────────────────────────
       Accepts a plain string (label only) or a { label, value } object.
       Returns a normalised { label, value } object, or null if invalid.     */
    function normaliseButton(spec) {
        if (typeof spec === 'string') {
            return { label: spec, value: spec.toLowerCase() };
        }
        if (spec && typeof spec === 'object' && spec.label) {
            return {
                label: String(spec.label),
                value: spec.value !== undefined
                    ? String(spec.value)
                    : String(spec.label).toLowerCase(),
            };
        }
        return null;
    }

    /* ── Close / animate-out helper ─────────────────────────────────────────
       Plays the exit animations on both the dialog card and the backdrop,
       removes the backdrop from the DOM, then fires the user callback.
       A safety-net setTimeout ensures the cleanup runs even if the browser
       suppresses animationend (e.g. prefers-reduced-motion, hidden tabs).   */
    function closeConfirm(backdrop, dialog, cb, value) {
        if (backdrop._closing) return;
        backdrop._closing = true;

        dialog.style.animation   = 'cc-confirm-fade-out 0.22s ease forwards';
        backdrop.style.animation = 'cc-confirm-fade-out 0.28s ease forwards';

        var done = false;
        function finish() {
            if (done) return;
            done = true;
            if (backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
            if (typeof cb === 'function') cb(value);
        }

        backdrop.addEventListener('animationend', finish, { once: true });
        setTimeout(finish, 380);
    }

    /* ── ccConfirm ──────────────────────────────────────────────────────────
       Main confirm function — see top-of-file JSDoc for full API.          */
    function ccConfirm(message, callback, options) {
        if (typeof message !== 'string') message = String(message);

        var opts        = options || {};
        var kind        = normaliseType(opts.type);
        var position    = opts.position === 'top' ? 'top' : 'bottom';
        var useHtml     = opts.html === true;
        var cancelLabel = typeof opts.cancelLabel === 'string' ? opts.cancelLabel : 'Cancel';

        /* Normalise the buttons array; fall back to a single OK button */
        var rawButtons = Array.isArray(opts.buttons) && opts.buttons.length > 0
            ? opts.buttons
            : [{ label: 'OK', value: 'ok' }];

        var buttons = [];
        for (var i = 0; i < rawButtons.length; i++) {
            var b = normaliseButton(rawButtons[i]);
            if (b) buttons.push(b);
        }
        if (buttons.length === 0) buttons.push({ label: 'OK', value: 'ok' });

        injectConfirmStyles();

        /* ── Backdrop ── */
        var backdrop    = doc.createElement('div');
        backdrop.id     = 'cc-confirm-backdrop';
        if (position === 'top') backdrop.classList.add('pos-top');

        /* Click directly on the backdrop (outside the card) → Cancel */
        backdrop.addEventListener('click', function (e) {
            if (e.target === backdrop) {
                removeKeyListener();
                closeConfirm(backdrop, dialog, callback, null);
            }
        });

        /* Escape key → Cancel */
        function onKeyDown(e) {
            if (e.key === 'Escape') {
                removeKeyListener();
                closeConfirm(backdrop, dialog, callback, null);
            }
        }
        function removeKeyListener() {
            doc.removeEventListener('keydown', onKeyDown);
        }
        doc.addEventListener('keydown', onKeyDown);

        /* ── Dialog card ── */
        var dialog       = doc.createElement('div');
        dialog.id        = 'cc-confirm-dialog';
        dialog.className = 'cc-' + kind;
        dialog.setAttribute('role', 'alertdialog');
        dialog.setAttribute('aria-modal', 'true');

        /* Header bar: title + boxed ✕ (the ✕ cancels, like the Chat Intake dialog) */
        var defaultTitle = { info: 'Confirm', warning: 'Please confirm', error: 'Confirm', danger: 'Please confirm' }[kind] || 'Confirm';
        var titleText = (typeof opts.title === 'string' && opts.title) ? opts.title : defaultTitle;

        var header       = doc.createElement('div');
        header.className = 'cc-confirm-header';

        var titleEl       = doc.createElement('span');
        titleEl.className = 'cc-confirm-title';
        titleEl.textContent = titleText;

        var xBtn         = doc.createElement('button');
        xBtn.type        = 'button';
        xBtn.className   = 'cc-confirm-x';
        xBtn.setAttribute('aria-label', 'Close');
        xBtn.innerHTML   = '&#10005;';
        xBtn.addEventListener('click', function () {
            removeKeyListener();
            closeConfirm(backdrop, dialog, callback, null);
        });

        header.appendChild(titleEl);
        header.appendChild(xBtn);

        /* Body: the message */
        var msgEl        = doc.createElement('div');
        msgEl.className  = 'cc-confirm-msg';
        msgEl.setAttribute('role', 'status');
        if (useHtml) { msgEl.innerHTML   = message; }
        else         { msgEl.textContent = message; }

        /* Button row */
        var btnRow       = doc.createElement('div');
        btnRow.className = 'cc-confirm-buttons';

        /* Helper: create a single button and wire up its click + Enter/Space */
        function makeButton(label, value, extraClass) {
            var btn         = doc.createElement('button');
            btn.type        = 'button';
            btn.className   = 'cc-confirm-btn' + (extraClass ? ' ' + extraClass : '');
            btn.textContent = label;

            function choose() {
                removeKeyListener();
                closeConfirm(backdrop, dialog, callback, value);
            }
            btn.addEventListener('click', choose);
            btn.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    choose();
                }
            });
            return btn;
        }

        /* Action buttons — first one gets the primary accent style */
        for (var j = 0; j < buttons.length; j++) {
            btnRow.appendChild(makeButton(
                buttons[j].label,
                buttons[j].value,
                j === 0 ? 'cc-primary' : ''
            ));
        }

        /* Cancel button — auto-appended, always last, passes null */
        btnRow.appendChild(makeButton(cancelLabel, null, 'cc-cancel'));

        dialog.appendChild(header);
        dialog.appendChild(msgEl);
        dialog.appendChild(btnRow);
        backdrop.appendChild(dialog);
        doc.body.appendChild(backdrop);

        /* Move focus to the first action button for keyboard accessibility */
        var firstBtn = btnRow.querySelector('.cc-confirm-btn');
        if (firstBtn) {
            requestAnimationFrame(function () { firstBtn.focus(); });
        }

        /* Return a programmatic-dismiss callback (equivalent to Cancel) */
        return function () {
            removeKeyListener();
            closeConfirm(backdrop, dialog, callback, null);
        };
    }

    /* Convenience aliases */
    ccConfirm.info    = function (msg, cb, opts) {
        return ccConfirm(msg, cb, Object.assign({}, opts, { type: 'info' }));
    };
    ccConfirm.warning = function (msg, cb, opts) {
        return ccConfirm(msg, cb, Object.assign({}, opts, { type: 'warning' }));
    };
    ccConfirm.warn    = ccConfirm.warning;
    ccConfirm.error   = function (msg, cb, opts) {
        return ccConfirm(msg, cb, Object.assign({}, opts, { type: 'error' }));
    };

    /* ════════════════════════════════════════════════════════════════════════
       ccPrompt  —  single-line text input dialog (same look as ccConfirm)
       ────────────────────────────────────────────────────────────────────────
       Usage:
         ccPrompt('Rename file:', function (value) {
             if (value === null) { ... cancelled ... }
             else { ... use value ... }
         }, { defaultValue: 'old-name.txt', okLabel: 'Rename' });

       The callback receives the entered string on OK / Enter, or null on
       Cancel / Escape / backdrop click.
    ════════════════════════════════════════════════════════════════════════ */
    function ccPrompt(message, callback, options) {
        if (typeof message !== 'string') message = String(message);

        var opts        = options || {};
        var kind        = normaliseType(opts.type);
        var position    = opts.position === 'top' ? 'top' : 'bottom';
        var useHtml     = opts.html === true;
        var cancelLabel = typeof opts.cancelLabel === 'string' ? opts.cancelLabel : 'Cancel';
        var okLabel     = typeof opts.okLabel === 'string' ? opts.okLabel : 'OK';
        var defaultVal  = opts.defaultValue != null ? String(opts.defaultValue) : '';
        var placeholder = typeof opts.placeholder === 'string' ? opts.placeholder : '';

        injectConfirmStyles();

        /* ── Backdrop ── */
        var backdrop = doc.createElement('div');
        backdrop.id  = 'cc-confirm-backdrop';
        if (position === 'top') backdrop.classList.add('pos-top');

        backdrop.addEventListener('click', function (e) {
            if (e.target === backdrop) { removeKeyListener(); finishWith(null); }
        });

        function onKeyDown(e) {
            if (e.key === 'Escape') { removeKeyListener(); finishWith(null); }
        }
        function removeKeyListener() { doc.removeEventListener('keydown', onKeyDown); }
        doc.addEventListener('keydown', onKeyDown);

        /* ── Dialog card ── */
        var dialog       = doc.createElement('div');
        dialog.id        = 'cc-confirm-dialog';
        dialog.className = 'cc-' + kind;
        dialog.setAttribute('role', 'dialog');
        dialog.setAttribute('aria-modal', 'true');

        /* Header bar: title + boxed ✕ */
        var titleText = (typeof opts.title === 'string' && opts.title) ? opts.title : 'Enter a value';

        var header       = doc.createElement('div');
        header.className = 'cc-confirm-header';

        var titleEl       = doc.createElement('span');
        titleEl.className = 'cc-confirm-title';
        titleEl.textContent = titleText;

        var xBtn         = doc.createElement('button');
        xBtn.type        = 'button';
        xBtn.className   = 'cc-confirm-x';
        xBtn.setAttribute('aria-label', 'Close');
        xBtn.innerHTML   = '&#10005;';
        xBtn.addEventListener('click', function () { removeKeyListener(); finishWith(null); });

        header.appendChild(titleEl);
        header.appendChild(xBtn);

        /* Body: the message (label) */
        var msgEl       = doc.createElement('div');
        msgEl.className = 'cc-confirm-msg has-input';
        if (useHtml) { msgEl.innerHTML = message; } else { msgEl.textContent = message; }

        /* Text input */
        var input         = doc.createElement('input');
        input.type        = 'text';
        input.className   = 'cc-confirm-input';
        input.value       = defaultVal;
        if (placeholder) input.placeholder = placeholder;

        function finishWith(value) {
            closeConfirm(backdrop, dialog, callback, value);
        }

        input.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                removeKeyListener();
                finishWith(input.value);
            }
        });

        /* Button row */
        var btnRow       = doc.createElement('div');
        btnRow.className = 'cc-confirm-buttons';

        function makeButton(label, extraClass, onChoose) {
            var btn         = doc.createElement('button');
            btn.type        = 'button';
            btn.className   = 'cc-confirm-btn' + (extraClass ? ' ' + extraClass : '');
            btn.textContent = label;
            btn.addEventListener('click', onChoose);
            btn.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onChoose(); }
            });
            return btn;
        }

        btnRow.appendChild(makeButton(okLabel, 'cc-primary', function () {
            removeKeyListener(); finishWith(input.value);
        }));
        btnRow.appendChild(makeButton(cancelLabel, 'cc-cancel', function () {
            removeKeyListener(); finishWith(null);
        }));

        dialog.appendChild(header);
        dialog.appendChild(msgEl);
        dialog.appendChild(input);
        dialog.appendChild(btnRow);
        backdrop.appendChild(dialog);
        doc.body.appendChild(backdrop);

        /* Focus + select the input for immediate typing */
        requestAnimationFrame(function () {
            input.focus();
            try { input.select(); } catch (e) {}
        });

        return function () { removeKeyListener(); finishWith(null); };
    }

    ccPrompt.info    = function (msg, cb, opts) { return ccPrompt(msg, cb, Object.assign({}, opts, { type: 'info' })); };
    ccPrompt.warning = function (msg, cb, opts) { return ccPrompt(msg, cb, Object.assign({}, opts, { type: 'warning' })); };
    ccPrompt.warn    = ccPrompt.warning;
    ccPrompt.error   = function (msg, cb, opts) { return ccPrompt(msg, cb, Object.assign({}, opts, { type: 'error' })); };

    /* ════════════════════════════════════════════════════════════════════════
       EXPORTS
    ════════════════════════════════════════════════════════════════════════ */
    return { ccNotify: ccNotify, ccConfirm: ccConfirm, ccPrompt: ccPrompt };
}));
