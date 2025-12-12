(function () {
  const redirect = new URLSearchParams(location.search).get('redirect');
  if (redirect && redirect !== location.pathname) {
    history.replaceState(null, '', redirect);
  }
})();