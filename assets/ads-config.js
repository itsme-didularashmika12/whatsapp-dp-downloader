/* ============================================================
   WhatsApp DP Downloader — sponsored-link configuration
   ----------------------------------------------------------------
   CENTRALIZED AD CONFIG. Every monetization link lives ONLY here.
   - enabled:false  → the whole sponsored layer never renders
   - a link's enabled:false → that link is skipped everywhere
   - Settings are read by /assets/ads.js; nothing here is secret.
   - Links are plain outbound URLs. No scripts, no beacons, no
     third-party code ever loads from these domains on page load.
   ============================================================ */
window.WA_DP_ADS = {
  enabled: true, // master switch — set false to disable all sponsored links
  perPage: 2, // how many sponsored links render in the (single) slot per page view
  reshowHours: 6, // the same link won't be shown to the same browser again within this window
  cooldownHours: 72, // after a browser clicks a link, hide THAT link from it for this long
  inlineSlots: true, // also render labeled inline sponsored links into [data-ads-inline] slots on guide pages
  openOnDownload: { // labeled dual action on the real Download button: one partner tab + the real download
    enabled: true,
    minIntervalMinutes: 15 // at most one partner tab per interval per browser
  },
  links: [
    { id: 'omg-01', enabled: true, title: 'Sponsored offer', url: 'https://omg10.com/4/10272425' },
    { id: 'omg-02', enabled: true, title: 'Sponsored offer', url: 'https://omg10.com/4/9964203' },
    { id: 'omg-03', enabled: true, title: 'Sponsored offer', url: 'https://omg10.com/4/9966292' },
    { id: 'omg-04', enabled: true, title: 'Sponsored offer', url: 'https://omg10.com/4/9964213' },
    { id: 'omg-05', enabled: true, title: 'Sponsored offer', url: 'https://omg10.com/4/10399769' },
    { id: 'omg-06', enabled: true, title: 'Sponsored offer', url: 'https://omg10.com/4/10208217' },
    { id: 'omg-07', enabled: true, title: 'Sponsored offer', url: 'https://omg10.com/4/10268011' },
    { id: 'omg-08', enabled: true, title: 'Sponsored offer', url: 'https://omg10.com/4/10239172' }
  ]
};
