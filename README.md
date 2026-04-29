# Box Note to Markdown Chrome Extension

A Chrome extension that converts Box Notes to Markdown format.

## Features

- **Convert Box Note to Markdown**: Extracts content from the active Box Note page and converts it to Markdown.
- **Preview**: View the generated Markdown in a popup window.
- **Copy to Clipboard**: One-click copy.
- **Save as File**: Download the result as a `.md` file.

## Installation

1.  Clone this repository or download the source code.
2.  Open Chrome and navigate to `chrome://extensions`.
3.  Enable **Developer mode** in the top right corner.
4.  Click **Load unpacked**.
5.  Select the `src` directory of this project.

## Usage

1.  Navigate to a Box Note page on `box.com`.
2.  Click the extension icon in the toolbar.
3.  Click **Convert to Markdown**.
4.  Use the **Copy** or **Save** buttons to export your content.

## Development

- `src/manifest.json`: Extension configuration.
- `src/content.js`: Logic for extracting data from the page and converting it to Markdown.
- `src/popup.html` & `src/popup.js`: The extension popup interface.
- `src/styles.css`: Styling for the popup.

## License

MIT
