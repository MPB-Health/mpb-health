const STAFF_HUB_URL = 'https://staff.mpb.health/';

chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setOptions({
    path: 'sidepanel.html',
    enabled: true,
  });
});

chrome.action.onClicked.addListener(async (tab) => {
  await chrome.tabs.create({ url: STAFF_HUB_URL, active: true });

  if (tab?.windowId != null) {
    try {
      await chrome.sidePanel.open({ windowId: tab.windowId });
    } catch {
      // Side panel may be unavailable in some managed Chrome builds.
    }
  }
});
