import express from "express";
import fetch from "node-fetch";
import readline from "readline";
import jsdom from "jsdom";

const app = express();
const PORT = 3000;
const { JSDOM } = jsdom;
const readLine = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});
const testURL1 =
  "https://docs.google.com/document/d/e/2PACX-1vRMx5YQlZNa3ra8dYYxmv-QIQ3YJe8tbI3kqcuC7lQiZm-CSEznKfN_HYNSpoXcZIV3Y_O3YoUB1ecq/pub";
const testURL2 =
  "https://docs.google.com/document/d/e/2PACX-1vQGUck9HIFCyezsrBSnmENk5ieJuYwpt7YHYEzeNJkIb9OSDdx-ov2nRNReKQyey-cwJOoEKUhLmN9z/pub";

const sampleOutput = [
  { xcoordinate: 0, ycoordinate: 0, character: "█" },
  { xcoordinate: 0, ycoordinate: 1, character: "█" },
  { xcoordinate: 0, ycoordinate: 2, character: "█" },
  { xcoordinate: 1, ycoordinate: 1, character: "▀" },
  { xcoordinate: 1, ycoordinate: 2, character: "▀" },
  { xcoordinate: 2, ycoordinate: 1, character: "▀" },
  { xcoordinate: 2, ycoordinate: 2, character: "▀" },
  { xcoordinate: 3, ycoordinate: 2, character: "▀" },
];

app.listen(PORT, () => {
  console.log(`Proxy server running on http://localhost:${PORT}`);
  console.log("..............................................................");
  requestURLFromUser();
});

readLine.on("close", () => {
  console.log("\nShutting down server...");
  process.exit(0);
});

/**
 * Requests the user to input a Google Docs URL.
 * @returns {void}
 */
const requestURLFromUser = () => {
  readLine.question("Enter the Google Docs URL: ", (input) => {
    fetchGoogleDocContents(input);
  });
};

/**
 * Fetches the contents of a Google Docs document based on a URL.
 * @param {string} gDocUrl - The URL of the Google Docs document that will be fetched
 */
const fetchGoogleDocContents = async (gDocUrl) => {
  try {
    console.log("Fetching document...");
    const response = await fetch(gDocUrl);
    if (!response.ok) {
      console.log("Failed to fetch document");
    }
    const text = await response.text();
    const htmlDOM = new JSDOM(text);
    const table = htmlDOM.window.document
      .getElementById("contents")
      .querySelector("table");

    console.log("Parsing document HTML...");
    console.log(
      ".............................................................."
    );
    const data = parseHTMLTable(table);
    printGrid(data);
    console.log(
      ".............................................................."
    );
  } catch (error) {
    console.log("Error fetching document: " + error.message);
  }
};

/**
 * Parses an HTML table element and returns its data as an array
 * @param {HTMLElement} tableElement
 * @returns {Array<Object>} The data from the HTML table
 */
const parseHTMLTable = (tableElement) => {
  if (tableElement.tagName !== "TABLE") {
    console.log("Input must be an HTML table element");
    return [];
  }

  const rows = Array.from(tableElement.rows);
  if (rows.length === 0) {
    return [];
  }

  let headers = [];
  // Clean and normalize all headers in order to use them as keys
  headers = Array.from(rows[0].cells).map(
    (cell) =>
      cell.textContent
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "_") // Replace spaces with underscores
        .replace(/[^\w\s]/g, "") // Remove special characters
  );

  const parsedRowsList = [];
  // Iterate over each row in the table
  for (let i = 1; i < rows.length; i++) {
    const rowData = {};
    // Iterate over each cell in the row to extract the data in the format of key-value pairs
    Array.from(rows[i].cells).forEach((cell, index) => {
      if (index < headers.length) {
        const header = headers[index];
        const value = cell.textContent?.trim();

        // Check if the value is a number, and convert it if necessary
        rowData[header] = !isNaN(value) && value !== "" ? Number(value) : value;
      }
    });
    parsedRowsList.push(rowData);
  }
  return parsedRowsList;
};

/**
 * Initializes the grid to be printed with empty values.
 * @param {Array<Object>} coordinates - The list of character positions
 * @returns {Array<Array<string>>} The initialized grid with empty values as spaces
 */
const initGrid = (coordinates) => {
  let maxX = coordinates[0].xcoordinate;
  let maxY = coordinates[0].ycoordinate;
  for (let i = 1; i < coordinates.length; i++) {
    if (coordinates[i].xcoordinate > maxX) {
      maxX = coordinates[i].xcoordinate;
    }
    if (coordinates[i].ycoordinate > maxY) {
      maxY = coordinates[i].ycoordinate;
    }
  }
  return Array(maxY + 1)
    .fill()
    .map(() => Array(maxX + 1).fill(" "));
};

/**
 * Fills up the grid with the list of characters in their respective positions.
 * @param {Array<Object>} coordinates - The list of character positions
 * @returns {Array<Array<string>>} The grid with the characters filled in
 */
const buildGrid = (coordinates) => {
  const grid = initGrid(coordinates);
  // Fill in the grid with the unicode characters
  for (let i = 0, length = coordinates.length; i < length; i++) {
    grid[coordinates[i].ycoordinate][coordinates[i].xcoordinate] =
      coordinates[i].character;
  }
  return grid;
};

/**
 * Prints the grid in the expected order.
 * @param {Array<Object>} coordinates - The list of character positions
 */
const printGrid = (coordinates) => {
  const gridToPrint = buildGrid(coordinates);
  // Print each row of the grid from bottom to top
  for (let y = gridToPrint.length - 1; y >= 0; y--) {
    console.log(gridToPrint[y].join(""));
  }
};
