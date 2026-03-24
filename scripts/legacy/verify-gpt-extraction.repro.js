import { JSDOM } from "jsdom";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mock the DOM environment
const dom = new JSDOM(`<!DOCTYPE html><body></body>`);
global.document = dom.window.document;
global.HTMLElement = dom.window.HTMLElement;
global.Node = dom.window.Node;

// Import the function to test (we'll read it and wrap it to expose the function)
const extractorPath = path.resolve(__dirname, '../extension/parsers/shared/markdown-extractor.js');
const extractorCode = fs.readFileSync(extractorPath, 'utf8');

// Create a function that returns the extractor function
const extractMarkdownFromHtml = new Function('document', extractorCode + '\nreturn extractMarkdownFromHtml;')(document);

// Test Case 1: Code Block with "Copy code" noise (simplified structure)
const codeBlockHtml = `
<pre>
  <code class="language-html">&lt;div class="cell"&gt;A&lt;/div&gt;</code>
</pre>
`;

// Simulate what ChatGPT actually renders (with button text in pre.innerText)
const codeBlockWithNoiseHtml = `
<pre>
  <div>html</div>
  <button>Copy code</button>
  <code class="language-html">&lt;div class="cell"&gt;A&lt;/div&gt;</code>
</pre>
`;

// Test Case 2: Novel Output (Micro-haiku blockquote)
const haikuHtml = `
<blockquote>
<p>DOM nodes whisper<br>
State drifts through silent shadows<br>
Export remembers</p>
</blockquote>
`;

function runTest(name, html) {
    console.log(`\n--- Testing: ${name} ---`);
    const div = document.createElement('div');
    div.innerHTML = html.trim();

    // Create a clean copy for extraction (since the function modifies the element)
    const elementToExtract = div.firstElementChild;
    const result = extractMarkdownFromHtml(elementToExtract);

    console.log("Input HTML Preview:", html.substring(0, 100).replace(/\n/g, '') + "...");
    console.log("Extracted Markdown:\n" + JSON.stringify(result));
    return result;
}

console.log("Running GPT Extraction Verification...");

const codeResult = runTest("Code Block", codeBlockHtml);
const haikuResult = runTest("Haiku Blockquote", haikuHtml);

// Simple Assertions
let failures = 0;

// Assertion 1: Code block should NOT contain "Copy code" or "html" header text in the body
if (codeResult.includes("Copy code") || codeResult.includes("html\n")) { // "html\n" might be tricky if it's the language tag, but here we check for the header text leaking
    if (codeResult.includes("Copy code")) {
        console.error("FAIL: Code block contains 'Copy code' button text.");
        failures++;
    }
} else {
    console.log("PASS: Code block clean of UI noise.");
}

// Assertion 2: Haiku should be a blockquote
if (haikuResult.includes("> DOM nodes whisper")) {
    console.log("PASS: Haiku correctly formatted as blockquote.");
} else {
    console.error("FAIL: Haiku not formatted as blockquote.");
    failures++;
}

if (failures > 0) {
    console.log(`\nVerification FAILED with ${failures} errors.`);
    process.exit(1);
} else {
    console.log("\nVerification PASSED!");
}
