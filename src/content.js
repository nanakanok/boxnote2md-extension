// Content script to handle Box Note HTML extraction and conversion

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "extract_and_convert") {
        try {
            const rootElement = extractBoxNoteRoot();
            if (!rootElement) {
                sendResponse({ success: false, error: "Could not find Box Note content (looking for .ProseMirror). Please ensure the note is fully loaded." });
                return true;
            }

            const markdown = convertDomToMarkdown(rootElement);
            sendResponse({ success: true, markdown: markdown });
        } catch (e) {
            console.error("Conversion error:", e);
            sendResponse({ success: false, error: e.message });
        }
    }
    return true; // Keep channel open for async response
});

/**
 * Finds the root element of the Box Note editor.
 * Box Notes typically use Prosemirror, identified by class "ProseMirror".
 */
function extractBoxNoteRoot() {
    return document.querySelector('.ProseMirror');
}

/**
 * Converts a DOM element and its children to Markdown.
 */
function convertDomToMarkdown(element) {
    if (!element) return "";
    let markdown = "";

    // Process all child nodes
    element.childNodes.forEach(child => {
        markdown += processNode(child);
    });

    return markdown.trim();
}

/**
 * Recursive function to process a DOM node and return Markdown string.
 */
function processNode(node, context = {}) {
    if (node.nodeType === Node.TEXT_NODE) {
        return node.textContent;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
        return "";
    }

    const tagName = node.tagName.toLowerCase();
    const classList = node.classList;

    // --- Ignore specific Box Note UI widgets ---
    if (classList.contains('heading-collapse-container') ||
        classList.contains('heading-anchor-container') ||
        classList.contains('ProseMirror-separator') ||
        classList.contains('table-sticky-scrollbar')) {
        return "";
    }

    // --- Handle Block Elements ---

    // Headings
    if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tagName)) {
        const level = parseInt(tagName.substring(1));
        const content = processChildren(node).trim();
        return `\n${'#'.repeat(level)} ${content}\n\n`;
    }

    // Paragraphs
    if (tagName === 'p') {
        const content = processChildren(node).trim();
        // If empty paragraph (or just contains br), it might be a spacer, but in MD usually just newlines.
        // If strictly empty, skip or add newline?
        if (!content) return "\n";
        return `${content}\n\n`;
    }

    // Blockquote
    if (tagName === 'blockquote') {
        const content = processChildren(node).trim();
        return `> ${content}\n\n`;
    }

    // Code Block (pre/code wrapper usually, but Box Note sample uses inline code. 
    // If there's a specific block structure for code, handle here. 
    // For now, assuming standard HTML or generic div/pre structure if encountered, 
    // but sample only showed inline code).

    // List handling
    if (tagName === 'ul' || tagName === 'ol') {
        const isOrdered = tagName === 'ol';
        const isChecklist = classList.contains('check-list');

        // If inside a table, return HTML string
        if (context.inTable) {
            let listHtml = isOrdered ? "<ol>" : "<ul>";

            Array.from(node.children).forEach(child => {
                if (child.tagName.toLowerCase() === 'li') {
                    // Process children but keep simple text
                    // We might need to manually handle checkbox for HTML output too

                    let prefix = "";
                    if (isChecklist) {
                        const checkbox = child.querySelector('input[type="checkbox"]');
                        const isChecked = checkbox && checkbox.checked;
                        const isCheckedClass = child.classList.contains('is-checked');
                        const finalChecked = isChecked || isCheckedClass;
                        prefix = finalChecked ? "[x] " : "[ ] ";
                    }

                    // For table cells, we want the content to be inline-ish or just text.
                    // Recurse with inTable: true
                    const content = processChildren(child, context).trim();
                    listHtml += `<li>${prefix}${content}</li>`; // No newline to avoid breaking table
                } else {
                    listHtml += processNode(child, context);
                }
            });

            listHtml += isOrdered ? "</ol>" : "</ul>";
            return listHtml;
        }

        let listContent = "";
        let index = 1;

        Array.from(node.children).forEach(child => {
            if (child.tagName.toLowerCase() === 'li') {
                const childContent = processChildren(child, {
                    ...context,
                    isList: true
                }).trim();

                let prefix = isOrdered ? `${index++}. ` : "- ";

                if (isChecklist) {
                    // Check for checkbox
                    const checkbox = child.querySelector('input[type="checkbox"]');
                    const isChecked = checkbox && checkbox.checked; // or class 'is-checked' on li
                    // Or check class on li
                    const isCheckedClass = child.classList.contains('is-checked');
                    const finalChecked = isChecked || isCheckedClass;

                    prefix = finalChecked ? "- [x] " : "- [ ] ";

                    // Box checklist items often wrap text in a p or span, handled by recursion.
                    // We might want to strip the leading p tag's newlines if present
                }

                // Handle indentation for nested list content if needed (simple approach first)
                // If child content has newlines, indent them? 
                // Markdown list items with multiple blocks need 4-space indent.
                // For simple text, it's fine.

                listContent += `${prefix}${childContent}\n`;
            } else {
                // Nested lists directly inside UL/OL (some editors do this invalid HTML)
                listContent += processNode(child, context);
            }
        });

        return `\n${listContent}\n`;
    }

    // Tables
    if (tagName === 'table') {
        return processTable(node) + "\n\n";
    }

    if (tagName === 'div' || tagName === 'section') {
        // Recurse transparently
        return processChildren(node, context);
    }

    // Newline/Break
    if (tagName === 'br') {
        // In table, <br> should probably be <br> or space, not \n
        if (context.inTable) return "<br>";
        return "  \n"; // 2 spaces for hard break
    }

    // --- Handle Inline Elements ---

    const content = processChildren(node, context);

    if (tagName === 'strong' || tagName === 'b') {
        return `**${content}**`;
    }
    if (tagName === 'em' || tagName === 'i') {
        return `*${content}*`;
    }
    if (tagName === 'u') {
        return `<u>${content}</u>`;
    }
    if (tagName === 's' || tagName === 'strike' || tagName === 'del') {
        return `~~${content}~~`;
    }
    if (tagName === 'code') {
        return `\`${content}\``;
    }
    if (tagName === 'a') {
        const href = node.getAttribute('href') || '#';
        return `[${content}](${href})`;
    }
    if (tagName === 'img') {
        const src = node.getAttribute('src') || '';
        const alt = node.getAttribute('alt') || 'image';
        return `![${alt}](${src})`;
    }

    // span data-authors, etc.
    return content;
}

function processChildren(node, context = {}) {
    let result = "";
    node.childNodes.forEach(child => {
        result += processNode(child, context);
    });
    return result;
}

function processTable(tableNode) {
    const rows = Array.from(tableNode.querySelectorAll('tr'));
    if (rows.length === 0) return "";

    let mdTable = "";

    // Determine column count from first row
    // (This is a simplification; colspans/rowspans are complex in MD)

    // Process Header (if th exists) or just treat first row as header?
    // HTML tables often just use tr/td. Box sample uses tr/td inside tbody.
    // If strict MD tables, we need a header row. 
    // If no header, we can create an empty one or just use the first row.
    // Let's rely on rows.

    // Standardize to array of arrays
    const tableData = rows.map(row => {
        return Array.from(row.querySelectorAll('td, th')).map(cell => {
            // Process cell content. 
            // Pass inTable context.
            // We DO NOT strip valid HTML tags we generated (like <ul>), but we should probably replace raw newlines with spaces
            // unless they are inside the HTML tags? 
            // Simple approach: process, then collapse whitespace but preserve <br>.

            let cellContent = processChildren(cell, { inTable: true });

            // Escape pipes |
            cellContent = cellContent.replace(/\|/g, '\\|');

            // Remove newlines that would break the table row
            cellContent = cellContent.replace(/\n/g, ' ');

            return cellContent.trim();
        });
    });

    if (tableData.length === 0) return "";

    // Calculate max columns
    const colCount = tableData.reduce((max, row) => Math.max(max, row.length), 0);

    // Build header row (Row 1)
    if (tableData.length > 0) {
        const headerRow = tableData[0];
        // Pad with empty if needed
        while (headerRow.length < colCount) headerRow.push("");
        mdTable += `| ${headerRow.join(' | ')} |\n`;

        // Build separator row
        const separator = Array(colCount).fill('---');
        mdTable += `| ${separator.join(' | ')} |\n`;
    }

    // Build Data rows
    for (let i = 1; i < tableData.length; i++) {
        const row = tableData[i];
        while (row.length < colCount) row.push("");
        mdTable += `| ${row.join(' | ')} |\n`;
    }

    return mdTable;
}
