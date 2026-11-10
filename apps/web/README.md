# Repovio Web Application

## Monitoring refresh

Use the timer icon in the authenticated navbar to select Off, 15 seconds (default), 30 seconds, 1 minute, or 5 minutes.
The choice is stored in this browser and applies across Dashboard, Workflow runs, Awaiting approval, Needs attention,
Issues, Pull requests, and security alert categories, including active repository monitoring tabs.

Only active monitoring content refreshes. Automatic requests pause while the tab is hidden or the browser is offline;
returning performs at most one catch-up. Requests never overlap for one data source. The selected table filters, sorting,
page, columns, search, and dashboard period remain in place. A slow refresh finishes before the next interval starts.

This updates Repovio's stored data. It does not trigger provider synchronization or change server Polling. Jobs and
notification popovers retain their separate behavior. Manual refresh and workflow sync-completion updates still work
when automatic refresh is Off. If browser storage is blocked, the current choice remains usable until reload.
