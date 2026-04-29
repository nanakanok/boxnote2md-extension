document.addEventListener('DOMContentLoaded', () => {
  const convertBtn = document.getElementById('convertBtn');
  const copyBtn = document.getElementById('copyBtn');
  const saveBtn = document.getElementById('saveBtn');
  const markdownOutput = document.getElementById('markdownOutput');

  convertBtn.addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      if (tabs.length === 0) return;
      const tabId = tabs[0].id;

      try {
        // Check which frame has the .ProseMirror element
        const results = await chrome.scripting.executeScript({
          target: { tabId: tabId, allFrames: true },
          func: () => {
            return !!document.querySelector('.ProseMirror');
          }
        });

        const frameWithContent = results.find(r => r.result === true);

        if (!frameWithContent) {
          markdownOutput.value = "Error: Could not find Box Note content in any frame. Please ensure the note is fully loaded.";
          return;
        }

        // Send message 'extract_and_convert' to the specific frame
        chrome.tabs.sendMessage(tabId, { action: "extract_and_convert" }, { frameId: frameWithContent.frameId }, (response) => {
          if (chrome.runtime.lastError) {
            markdownOutput.value = "Error: " + chrome.runtime.lastError.message;
            return;
          }

          if (response && response.success) {
            markdownOutput.value = response.markdown;
            copyBtn.disabled = false;
            saveBtn.disabled = false;
          } else {
            markdownOutput.value = "Failed to convert: " + (response ? response.error : "Unknown error");
          }
        });

      } catch (err) {
        markdownOutput.value = "Error searching frames: " + err.message;
      }
    });
  });

  copyBtn.addEventListener('click', () => {
    const text = markdownOutput.value;
    navigator.clipboard.writeText(text).then(() => {
      const originalText = copyBtn.innerText;
      copyBtn.innerText = "Copied!";
      setTimeout(() => {
        copyBtn.innerText = originalText;
      }, 2000);
    }).catch(err => {
      console.error('Failed to copy: ', err);
    });
  });

  saveBtn.addEventListener('click', () => {
    const text = markdownOutput.value;
    const blob = new Blob([text], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    chrome.downloads.download({
      url: url,
      filename: `boxnote-export-${timestamp}.md`,
      saveAs: true
    });
  });
});
