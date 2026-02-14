
console.log("Content script loaded");

/*SHADOW DOM ROOT*/

const host = document.createElement("div");
host.id = "web-annotator-root";
document.body.appendChild(host);

const shadow = host.attachShadow({ mode: "open" });

const container = document.createElement("div");
shadow.appendChild(container);

const style = document.createElement("style");
style.textContent = `
  * { box-sizing: border-box; font-family: Arial, sans-serif; }
  textarea { font-family: Arial, sans-serif; }
`;
shadow.appendChild(style);

let addMode = false;

/* STORAGE (URL BASED) */

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

/* XPATH + TEXT SEARCH HELPERS*/

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

/* SIDE PANEL */

const sidePanel = document.createElement("div");
sidePanel.style.position = "fixed";
sidePanel.style.right = "0";
sidePanel.style.top = "0";
sidePanel.style.width = "260px";
sidePanel.style.height = "100vh";
sidePanel.style.background = "#ffffff";
sidePanel.style.borderLeft = "1px solid #ccc";
sidePanel.style.zIndex = "999998";
sidePanel.style.padding = "10px";
sidePanel.style.overflowY = "auto";
sidePanel.style.display = "none";

const panelHeader = document.createElement("div");
panelHeader.style.display = "flex";
panelHeader.style.justifyContent = "space-between";
panelHeader.style.alignItems = "center";

const panelTitle = document.createElement("h3");
panelTitle.innerText = "Annotations";
panelTitle.style.margin = "0";

const closeBtn = document.createElement("span");
closeBtn.innerText = "✕";
closeBtn.style.cursor = "pointer";
closeBtn.onclick = () => (sidePanel.style.display = "none");

panelHeader.appendChild(panelTitle);
panelHeader.appendChild(closeBtn);
sidePanel.appendChild(panelHeader);

container.appendChild(sidePanel);

/* MESSAGE LISTENER */

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

/* HANDLE TEXT SELECTION */

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

/* HANDLE HYPERLINK CLICKS */

document.addEventListener("click", function (e) {
  if (!addMode) return;

  // Check if clicked element is a hyperlink or inside one
  const link = e.target.closest("a");
  if (!link) return;

  e.preventDefault();
  e.stopPropagation();

  // Create a range
  const range = document.createRange();
  range.selectNodeContents(link);

  createSticky(range.cloneRange());

  addMode = false;
}, true);

/* PANEL ITEM CREATOR (WITH DELETE)*/

function createPanelItem(note, textarea, id) {
  const panelItem = document.createElement("div");
  panelItem.style.display = "flex";
  panelItem.style.justifyContent = "space-between";
  panelItem.style.alignItems = "center";
  panelItem.style.padding = "6px";
  panelItem.style.borderBottom = "1px solid #eee";

  const textSpan = document.createElement("span");
  textSpan.innerText = textarea.value || "New Annotation";
  textSpan.style.cursor = "pointer";

  const deleteBtn = document.createElement("span");
  deleteBtn.innerText = "🗑";
  deleteBtn.style.cursor = "pointer";

  panelItem.appendChild(textSpan);
  panelItem.appendChild(deleteBtn);
  sidePanel.appendChild(panelItem);

  textSpan.addEventListener("click", () => {
    note.scrollIntoView({ behavior: "smooth", block: "center" });
    note.style.boxShadow = "0 0 10px red";
    setTimeout(() => (note.style.boxShadow = "none"), 1500);
  });

  deleteBtn.addEventListener("click", () => {
    note.remove();
    panelItem.remove();

    const annotations = getSavedAnnotations();
    const updated = annotations.filter((a) => a.id !== id);
    saveAnnotations(updated);
  });

  return textSpan;
}

/* CREATE STICKY*/

function createSticky(range, savedData = null) {
  const id = savedData ? savedData.id : Date.now().toString();

  const note = document.createElement("div");
  note.style.position = "absolute";
  note.style.background = "yellow";
  note.style.padding = "8px";
  note.style.minWidth = "180px";
  note.style.border = "1px solid black";
  note.style.borderRadius = "4px";
  note.style.zIndex = "999999";

  const textarea = document.createElement("textarea");
  textarea.placeholder = "Write comment...";
  textarea.style.width = "160px";
  textarea.style.height = "60px";
  textarea.style.border = "none";
  textarea.style.background = "transparent";
  textarea.style.resize = "none";
  textarea.style.outline = "none";

  if (savedData) textarea.value = savedData.text;

  note.appendChild(textarea);
  container.appendChild(note);

  function updatePosition() {
    if (range) {
      const rect = range.getBoundingClientRect();
      note.style.top = rect.bottom + window.scrollY + "px";
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

/* RESTORE ON LOAD */

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