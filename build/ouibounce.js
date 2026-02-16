

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(factory);
  } else if (typeof exports === 'object') {
    module.exports = factory(require,exports,module);
  } else {
    root.ouibounce = factory();
  }
}(this, function(require,exports,module) {

return function ouibounce(el, custom_config) {
  "use strict";

  var config     = custom_config || {},
    aggressive   = config.aggressive || false,
    sensitivity  = setDefault(config.sensitivity, 20),
    timer        = setDefault(config.timer, 1000),
    delay        = setDefault(config.delay, 0),
    callback     = config.callback || function() {},
    cookieExpire = setDefaultCookieExpire(config.cookieExpire) || '',
    cookieDomain = config.cookieDomain ? ';domain=' + config.cookieDomain : '',
    cookieName   = config.cookieName ? config.cookieName : 'viewedOuibounceModal',
    sitewide     = config.sitewide === true ? ';path=/' : '',
    _delayTimer  = null,
    _html        = document.documentElement,
    // Touch/mobile detection options
    touchSensitivity    = setDefault(config.touchSensitivity, 300),
    scrollThreshold     = setDefault(config.scrollThreshold, 200),
    detectVisibility    = setDefault(config.detectVisibility, true),
    _lastScrollY        = 0,
    _scrollEnabled      = false,
    _isTouchDevice      = false;

  function setDefault(_property, _default) {
    return typeof _property === 'undefined' ? _default : _property;
  }

  function setDefaultCookieExpire(days) {
    // transform days to milliseconds
    var ms = days*24*60*60*1000;

    var date = new Date();
    date.setTime(date.getTime() + ms);

    return "; expires=" + date.toUTCString();
  }

  function detectTouchDevice() {
    return ('ontouchstart' in window) ||
      (navigator.maxTouchPoints > 0);
  }

  setTimeout(attachOuiBounce, timer);
  function attachOuiBounce() {
    if (isDisabled()) { return; }

    _isTouchDevice = detectTouchDevice();

    // Desktop: mouse-based exit intent
    _html.addEventListener('mouseleave', handleMouseleave);
    _html.addEventListener('mouseenter', handleMouseenter);
    _html.addEventListener('keydown', handleKeydown);

    // Mobile/touch: scroll-up detection for exit intent
    if (_isTouchDevice) {
      _lastScrollY = window.pageYOffset || document.documentElement.scrollTop;
      // Wait a short period before enabling scroll detection to avoid false positives
      setTimeout(function() {
        _scrollEnabled = true;
      }, timer);
      window.addEventListener('scroll', handleScroll);
    }

    // Modern: visibility change detection (tab switch, minimize)
    if (detectVisibility && typeof document.addEventListener === 'function') {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }
  }

  function handleMouseleave(e) {
    if (e.clientY > sensitivity) { return; }

    _delayTimer = setTimeout(fire, delay);
  }

  function handleMouseenter() {
    if (_delayTimer) {
      clearTimeout(_delayTimer);
      _delayTimer = null;
    }
  }

  var disableKeydown = false;
  function handleKeydown(e) {
    if (disableKeydown) { return; }
    else if(!e.metaKey || e.keyCode !== 76) { return; }

    disableKeydown = true;
    _delayTimer = setTimeout(fire, delay);
  }

  // Mobile: detect rapid scroll-up toward top of page (exit intent signal)
  function handleScroll() {
    if (!_scrollEnabled) { return; }

    var currentScrollY = window.pageYOffset || document.documentElement.scrollTop;
    var scrollDelta = _lastScrollY - currentScrollY;

    // User scrolled up quickly past threshold while near the top of the page
    if (scrollDelta > scrollThreshold && currentScrollY < touchSensitivity) {
      if (_delayTimer) { clearTimeout(_delayTimer); }
      _delayTimer = setTimeout(fire, delay);
    }

    _lastScrollY = currentScrollY;
  }

  // Modern: detect when user switches away from the page
  function handleVisibilityChange() {
    if (document.visibilityState === 'hidden') {
      if (_delayTimer) { clearTimeout(_delayTimer); }
      _delayTimer = setTimeout(fire, delay);
    }
  }

  function checkCookieValue(cookieName, value) {
    return parseCookies()[cookieName] === value;
  }

  function parseCookies() {
    // cookies are separated by '; '
    var cookies = document.cookie.split('; ');

    var ret = {};
    for (var i = cookies.length - 1; i >= 0; i--) {
      var el = cookies[i].split('=');
      ret[el[0]] = el[1];
    }
    return ret;
  }

  function isDisabled() {
    return checkCookieValue(cookieName, 'true') && !aggressive;
  }

  // You can use ouibounce without passing an element
  // https://github.com/carlsednaoui/ouibounce/issues/30
  function fire() {
    if (isDisabled()) { return; }

    if (el) { el.style.display = 'block'; }

    callback();
    disable();
  }

  function disable(custom_options) {
    var options = custom_options || {};

    // you can pass a specific cookie expiration when using the OuiBounce API
    // ex: _ouiBounce.disable({ cookieExpire: 5 });
    if (typeof options.cookieExpire !== 'undefined') {
      cookieExpire = setDefaultCookieExpire(options.cookieExpire);
    }

    // you can pass use sitewide cookies too
    // ex: _ouiBounce.disable({ cookieExpire: 5, sitewide: true });
    if (options.sitewide === true) {
      sitewide = ';path=/';
    }

    // you can pass a domain string when the cookie should be read subdomain-wise
    // ex: _ouiBounce.disable({ cookieDomain: '.example.com' });
    if (typeof options.cookieDomain !== 'undefined') {
      cookieDomain = ';domain=' + options.cookieDomain;
    }

    if (typeof options.cookieName !== 'undefined') {
      cookieName = options.cookieName;
    }

    document.cookie = cookieName + '=true' + cookieExpire + cookieDomain + sitewide;

    // remove listeners
    _html.removeEventListener('mouseleave', handleMouseleave);
    _html.removeEventListener('mouseenter', handleMouseenter);
    _html.removeEventListener('keydown', handleKeydown);
    window.removeEventListener('scroll', handleScroll);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  }

  return {
    fire: fire,
    disable: disable,
    isDisabled: isDisabled
  };
}

/*exported ouibounce */
;

}));
