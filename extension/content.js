console.log("Content script loaded");

/* =====================================
   SHADOW DOM ROOT
===================================== */

const host = document.createElement("div");
host.id = "web-annotator-root";
document.body.appendChild(host);

const shadow = host.attachShadow({ mode: "open" });

const container = document.createElement("div");
shadow.appendChild(container);

// Add Google Fonts
const fontLink = document.createElement("link");
fontLink.href = "https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap";
fontLink.rel = "stylesheet";
shadow.appendChild(fontLink);

const style = document.createElement("style");
style.textContent = `
  * { box-sizing: border-box; }
  
  /* Custom scrollbar for side panel */
  ::-webkit-scrollbar {
    width: 8px;
  }
  ::-webkit-scrollbar-track {
    background: rgba(255,255,255,0.05);
  }
  ::-webkit-scrollbar-thumb {
    background: rgba(255,255,255,0.2);
    border-radius: 4px;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: rgba(255,255,255,0.3);
  }
`;
shadow.appendChild(style);

let addMode = false;

/* =====================================
   STORAGE (URL BASED)
===================================== */

function getPageKey() {
  return window.location.origin + window.location.pathname;
}

function getSavedAnnotations() {
  const raw = localStorage.getItem("web_annotations");
  if (!raw) return [];
  const parsed = JSON.parse(raw);
  return parsed[getPageKey()] || [];
}

function saveAnnotations(data) {
  const raw = localStorage.getItem("web_annotations");
  const parsed = raw ? JSON.parse(raw) : {};
  parsed[getPageKey()] = data;
  localStorage.setItem("web_annotations", JSON.stringify(parsed));
}

/* =====================================
   XPATH + TEXT SEARCH HELPERS
===================================== */

function getXPath(element) {
  if (element.id) return `//*[@id="${element.id}"]`;
  if (element === document.body) return "/html/body";

  const ix =
    Array.from(element.parentNode.children)
      .filter((sib) => sib.tagName === element.tagName)
      .indexOf(element) + 1;

  return (
    getXPath(element.parentNode) +
    "/" +
    element.tagName +
    "[" +
    ix +
    "]"
  );
}

function findTextNode(element, text) {
  const walker = document.createTreeWalker(
    element,
    NodeFilter.SHOW_TEXT,
    null,
    false
  );

  let node;
  while ((node = walker.nextNode())) {
    if (node.textContent.includes(text)) return node;
  }
  return null;
}

/* =====================================
   SIDE PANEL
===================================== */

const sidePanel = document.createElement("div");
sidePanel.style.position = "fixed";
sidePanel.style.right = "0";
sidePanel.style.top = "0";
sidePanel.style.width = "340px";
sidePanel.style.height = "100vh";
sidePanel.style.background = "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)";
sidePanel.style.borderLeft = "1px solid rgba(255,255,255,0.1)";
sidePanel.style.zIndex = "999998";
sidePanel.style.padding = "0";
sidePanel.style.overflowY = "auto";
sidePanel.style.display = "none";
sidePanel.style.boxShadow = "-4px 0 24px rgba(0,0,0,0.3)";
sidePanel.style.fontFamily = "'Space Mono', monospace";
sidePanel.style.color = "#fff";
sidePanel.style.transition = "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)";

// Decorative background elements
const topOrb = document.createElement("div");
topOrb.style.position = "absolute";
topOrb.style.top = "-50px";
topOrb.style.right = "-50px";
topOrb.style.width = "150px";
topOrb.style.height = "150px";
topOrb.style.background = "radial-gradient(circle, rgba(255,107,107,0.15) 0%, transparent 70%)";
topOrb.style.borderRadius = "50%";
topOrb.style.pointerEvents = "none";
topOrb.style.zIndex = "0";
sidePanel.appendChild(topOrb);

const bottomOrb = document.createElement("div");
bottomOrb.style.position = "absolute";
bottomOrb.style.bottom = "-30px";
bottomOrb.style.left = "-30px";
bottomOrb.style.width = "100px";
bottomOrb.style.height = "100px";
bottomOrb.style.background = "radial-gradient(circle, rgba(78,205,196,0.12) 0%, transparent 70%)";
bottomOrb.style.borderRadius = "50%";
bottomOrb.style.pointerEvents = "none";
bottomOrb.style.zIndex = "0";
sidePanel.appendChild(bottomOrb);

// Header
const panelHeader = document.createElement("div");
panelHeader.style.display = "flex";
panelHeader.style.justifyContent = "space-between";
panelHeader.style.alignItems = "center";
panelHeader.style.padding = "24px 24px 20px";
panelHeader.style.borderBottom = "1px solid rgba(255,255,255,0.1)";
panelHeader.style.position = "sticky";
panelHeader.style.top = "0";
panelHeader.style.background = "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)";
panelHeader.style.backdropFilter = "blur(10px)";
panelHeader.style.zIndex = "10";

// Icon + Title container
const headerLeft = document.createElement("div");
headerLeft.style.display = "flex";
headerLeft.style.alignItems = "center";
headerLeft.style.gap = "12px";

const headerIcon = document.createElement("div");
headerIcon.innerText = "📌";
headerIcon.style.width = "36px";
headerIcon.style.height = "36px";
headerIcon.style.background = "linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)";
headerIcon.style.borderRadius = "8px";
headerIcon.style.display = "flex";
headerIcon.style.alignItems = "center";
headerIcon.style.justifyContent = "center";
headerIcon.style.fontSize = "18px";
headerIcon.style.boxShadow = "0 4px 12px rgba(255,107,107,0.3)";

const panelTitle = document.createElement("h3");
panelTitle.innerText = "Annotations";
panelTitle.style.margin = "0";
panelTitle.style.fontSize = "18px";
panelTitle.style.fontWeight = "700";
panelTitle.style.letterSpacing = "-0.5px";
panelTitle.style.background = "linear-gradient(135deg, #fff 0%, #e0e0e0 100%)";
panelTitle.style.webkitBackgroundClip = "text";
panelTitle.style.webkitTextFillColor = "transparent";
panelTitle.style.backgroundClip = "text";

headerLeft.appendChild(headerIcon);
headerLeft.appendChild(panelTitle);

// Close button
const closeBtn = document.createElement("div");
closeBtn.innerText = "✕";
closeBtn.style.cursor = "pointer";
closeBtn.style.width = "32px";
closeBtn.style.height = "32px";
closeBtn.style.display = "flex";
closeBtn.style.alignItems = "center";
closeBtn.style.justifyContent = "center";
closeBtn.style.borderRadius = "8px";
closeBtn.style.background = "rgba(255,255,255,0.08)";
closeBtn.style.border = "1px solid rgba(255,255,255,0.1)";
closeBtn.style.fontSize = "16px";
closeBtn.style.transition = "all 0.2s";
closeBtn.style.color = "#fff";

closeBtn.onmouseenter = () => {
  closeBtn.style.background = "rgba(255,107,107,0.2)";
  closeBtn.style.transform = "scale(1.05)";
};
closeBtn.onmouseleave = () => {
  closeBtn.style.background = "rgba(255,255,255,0.08)";
  closeBtn.style.transform = "scale(1)";
};
closeBtn.onclick = () => (sidePanel.style.display = "none");

panelHeader.appendChild(headerLeft);
panelHeader.appendChild(closeBtn);
sidePanel.appendChild(panelHeader);

// Annotations container
const annotationsContainer = document.createElement("div");
annotationsContainer.style.padding = "16px";
annotationsContainer.style.position = "relative";
annotationsContainer.style.zIndex = "1";
annotationsContainer.id = "annotations-list";
sidePanel.appendChild(annotationsContainer);

// Empty state
const emptyState = document.createElement("div");
emptyState.style.display = "flex";
emptyState.style.flexDirection = "column";
emptyState.style.alignItems = "center";
emptyState.style.justifyContent = "center";
emptyState.style.padding = "60px 30px";
emptyState.style.textAlign = "center";
emptyState.style.opacity = "0.6";
emptyState.id = "empty-state";

const emptyIcon = document.createElement("div");
emptyIcon.innerText = "📝";
emptyIcon.style.fontSize = "48px";
emptyIcon.style.marginBottom = "16px";

const emptyText = document.createElement("div");
emptyText.innerText = "No annotations yet";
emptyText.style.fontSize = "14px";
emptyText.style.fontWeight = "600";
emptyText.style.marginBottom = "8px";

const emptyHint = document.createElement("div");
emptyHint.innerText = "Click 'Add Comment' to create your first annotation";
emptyHint.style.fontSize = "11px";
emptyHint.style.opacity = "0.7";
emptyHint.style.lineHeight = "1.5";

emptyState.appendChild(emptyIcon);
emptyState.appendChild(emptyText);
emptyState.appendChild(emptyHint);
annotationsContainer.appendChild(emptyState);

container.appendChild(sidePanel);

/* =====================================
   MESSAGE LISTENER
===================================== */

chrome.runtime.onMessage.addListener((request) => {
  if (request.action === "ENABLE_ADD_MODE") {
    addMode = true;
    alert("Select text or click a link to add comment");
  }

  if (request.action === "TOGGLE_PANEL") {
    sidePanel.style.display =
      sidePanel.style.display === "none" ? "block" : "none";
  }
});

/* =====================================
   HANDLE TEXT SELECTION
===================================== */

document.addEventListener("mouseup", function () {
  if (!addMode) return;

  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;

  const range = selection.getRangeAt(0);
  if (range.collapsed) return;

  createSticky(range.cloneRange());

  addMode = false;
  selection.removeAllRanges();
});

/* =====================================
   HANDLE HYPERLINK CLICKS
===================================== */

document.addEventListener("click", function (e) {
  if (!addMode) return;

  // Check if clicked element is a hyperlink or inside one
  const link = e.target.closest("a");
  if (!link) return;

  e.preventDefault(); // Prevent navigation
  e.stopPropagation();

  // Create a range for the link element
  const range = document.createRange();
  range.selectNodeContents(link);

  createSticky(range.cloneRange());

  addMode = false;
}, true); // Use capture phase to intercept before default link behavior

/* =====================================
   PANEL ITEM CREATOR (WITH DELETE)
===================================== */

function createPanelItem(note, textarea, id) {
  // Hide empty state when first annotation is added
  const emptyState = annotationsContainer.querySelector("#empty-state");
  if (emptyState) {
    emptyState.style.display = "none";
  }

  const panelItem = document.createElement("div");
  panelItem.style.display = "flex";
  panelItem.style.flexDirection = "column";
  panelItem.style.padding = "14px";
  panelItem.style.marginBottom = "10px";
  panelItem.style.background = "rgba(255,255,255,0.08)";
  panelItem.style.border = "1px solid rgba(255,255,255,0.1)";
  panelItem.style.borderRadius = "10px";
  panelItem.style.cursor = "pointer";
  panelItem.style.transition = "all 0.2s";
  panelItem.style.position = "relative";

  panelItem.onmouseenter = () => {
    panelItem.style.background = "rgba(255,255,255,0.12)";
    panelItem.style.transform = "translateX(-2px)";
  };
  panelItem.onmouseleave = () => {
    panelItem.style.background = "rgba(255,255,255,0.08)";
    panelItem.style.transform = "translateX(0)";
  };

  const topRow = document.createElement("div");
  topRow.style.display = "flex";
  topRow.style.justifyContent = "space-between";
  topRow.style.alignItems = "flex-start";
  topRow.style.marginBottom = "8px";

  const textSpan = document.createElement("div");
  textSpan.innerText = textarea.value || "New Annotation";
  textSpan.style.flex = "1";
  textSpan.style.fontSize = "13px";
  textSpan.style.fontWeight = "600";
  textSpan.style.lineHeight = "1.4";
  textSpan.style.color = "#fff";
  textSpan.style.wordBreak = "break-word";

  const deleteBtn = document.createElement("div");
  deleteBtn.innerText = "🗑";
  deleteBtn.style.cursor = "pointer";
  deleteBtn.style.fontSize = "16px";
  deleteBtn.style.opacity = "0.6";
  deleteBtn.style.transition = "all 0.2s";
  deleteBtn.style.padding = "4px";
  deleteBtn.style.marginLeft = "8px";

  deleteBtn.onmouseenter = (e) => {
    e.stopPropagation();
    deleteBtn.style.opacity = "1";
    deleteBtn.style.transform = "scale(1.1)";
  };
  deleteBtn.onmouseleave = () => {
    deleteBtn.style.opacity = "0.6";
    deleteBtn.style.transform = "scale(1)";
  };

  topRow.appendChild(textSpan);
  topRow.appendChild(deleteBtn);

  const timestamp = document.createElement("div");
  timestamp.innerText = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  timestamp.style.fontSize = "10px";
  timestamp.style.opacity = "0.5";
  timestamp.style.marginTop = "4px";

  panelItem.appendChild(topRow);
  panelItem.appendChild(timestamp);
  annotationsContainer.appendChild(panelItem);

  panelItem.addEventListener("click", (e) => {
    if (e.target === deleteBtn) return;
    note.scrollIntoView({ behavior: "smooth", block: "center" });
    note.style.boxShadow = "0 0 20px rgba(255,107,107,0.8)";
    setTimeout(() => (note.style.boxShadow = "0 4px 16px rgba(0,0,0,0.2)"), 1500);
  });

  deleteBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    note.remove();
    panelItem.remove();

    const annotations = getSavedAnnotations();
    const updated = annotations.filter((a) => a.id !== id);
    saveAnnotations(updated);

    // Show empty state if no annotations left
    if (updated.length === 0 && emptyState) {
      emptyState.style.display = "flex";
    }
  });

  return textSpan;
}

/* =====================================
   CREATE STICKY
===================================== */

function createSticky(range, savedData = null) {
  const id = savedData ? savedData.id : Date.now().toString();

  const note = document.createElement("div");
  note.style.position = "absolute";
  note.style.background = "linear-gradient(135deg, #fef08a 0%, #fde047 100%)";
  note.style.padding = "12px";
  note.style.minWidth = "200px";
  note.style.border = "1px solid rgba(0,0,0,0.1)";
  note.style.borderRadius = "10px";
  note.style.zIndex = "999999";
  note.style.boxShadow = "0 4px 16px rgba(0,0,0,0.2)";
  note.style.fontFamily = "'Space Mono', monospace";

  const textarea = document.createElement("textarea");
  textarea.placeholder = "Write comment...";
  textarea.style.width = "180px";
  textarea.style.minHeight = "60px";
  textarea.style.border = "none";
  textarea.style.background = "transparent";
  textarea.style.resize = "vertical";
  textarea.style.outline = "none";
  textarea.style.fontSize = "13px";
  textarea.style.fontFamily = "'Space Mono', monospace";
  textarea.style.color = "#1a1a2e";

  if (savedData) textarea.value = savedData.text;

  note.appendChild(textarea);
  container.appendChild(note);

  function updatePosition() {
    if (range) {
      const rect = range.getBoundingClientRect();
      note.style.top = rect.bottom + window.scrollY + 5 + "px";
      note.style.left = rect.left + window.scrollX + "px";
    }
  }

  updatePosition();
  window.addEventListener("scroll", updatePosition);
  window.addEventListener("resize", updatePosition);

  const textSpan = createPanelItem(note, textarea, id);

  textarea.addEventListener("input", () => {
    textSpan.innerText = textarea.value || "New Annotation";

    const annotations = getSavedAnnotations();
    const index = annotations.findIndex((a) => a.id === id);

    const parentElement = range
      ? range.startContainer.parentElement
      : document.body;

    const newData = {
      id,
      text: textarea.value,
      selectedText: range ? range.toString() : savedData.selectedText,
      xpath: range ? getXPath(parentElement) : savedData.xpath,
    };

    if (index > -1) {
      annotations[index] = newData;
    } else {
      annotations.push(newData);
    }

    saveAnnotations(annotations);
  });
}

/* =====================================
   RESTORE ON LOAD
===================================== */

window.addEventListener("load", () => {
  const annotations = getSavedAnnotations();

  annotations.forEach((item) => {
    const element = document.evaluate(
      item.xpath,
      document,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null
    ).singleNodeValue;

    if (!element) return;

    const textNode = findTextNode(element, item.selectedText);
    if (!textNode) return;

    const range = document.createRange();
    const startIndex = textNode.textContent.indexOf(item.selectedText);

    if (startIndex === -1) return;

    range.setStart(textNode, startIndex);
    range.setEnd(textNode, startIndex + item.selectedText.length);

    createSticky(range, item);
  });
});