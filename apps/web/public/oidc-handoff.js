(
  /** Moves the one-time OIDC handoff value out of browser history before the app loads. */ () => {
    if (window.location.pathname !== '/auth/oidc/callback' || !window.location.hash) return;
    Object.defineProperty(window, '__repovioOidcHandoffFragment', {
      configurable: true,
      value: window.location.hash.slice(1),
    });
    window.history.replaceState({}, '', '/auth/oidc/callback');
  }
)();
