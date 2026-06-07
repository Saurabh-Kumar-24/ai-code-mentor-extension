chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "GET_SELECTED_CODE") {
    const selectedText = window.getSelection().toString();
    sendResponse({ code: selectedText });
  }
});
