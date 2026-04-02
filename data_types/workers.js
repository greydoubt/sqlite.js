const fs = require("fs");
const path = require("path");
const { parseStringPromise } = require("xml2js");

// ---- Generic File Handler Class ----
class FileRecord {
  constructor(filePath, type, data, valid) {
    this.filePath = filePath;
    this.type = type;
    this.data = data;
    this.valid = valid;
  }
}

// ---- Validators ----
function validateJSON(data) {
  return typeof data === "object" && data !== null;
}

function validateXML(data) {
  return typeof data === "object"; // xml2js returns object
}

function validateGeneric(data) {
  return data !== null && data !== undefined;
}

// ---- Parsers ----
async function parseFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();

  try {
    const raw = fs.readFileSync(filePath, "utf-8");

    switch (ext) {
      case ".json": {
        const parsed = JSON.parse(raw);
        return {
          type: "json",
          data: parsed,
          valid: validateJSON(parsed),
        };
      }

      case ".xml": {
        const parsed = await parseStringPromise(raw);
        return {
          type: "xml",
          data: parsed,
          valid: validateXML(parsed),
        };
      }

      case ".txt":
      case ".csv":
      default: {
        return {
          type: "generic",
          data: raw,
          valid: validateGeneric(raw),
        };
      }
    }
  } catch (err) {
    return {
      type: ext.replace(".", "") || "unknown",
      data: null,
      valid: false,
      error: err.message,
    };
  }
}

// ---- Directory Scanner ----
async function scanDirectory(dirPath) {
  const files = fs.readdirSync(dirPath);
  const records = [];
  const typeSummary = {};

  for (const file of files) {
    const fullPath = path.join(dirPath, file);

    if (fs.statSync(fullPath).isFile()) {
      const result = await parseFile(fullPath);

      const record = new FileRecord(
        fullPath,
        result.type,
        result.data,
        result.valid
      );

      records.push(record);

      // Track type counts
      if (!typeSummary[result.type]) {
        typeSummary[result.type] = 0;
      }
      typeSummary[result.type]++;
    }
  }

  return {
    records,
    summary: typeSummary,
  };
}

// ---- Run Example ----
(async () => {
  const dir = "./data"; // change to your directory

  const result = await scanDirectory(dir);

  console.log("Processed Records:");
  console.log(result.records);

  console.log("\nFile Type Summary:");
  console.log(JSON.stringify(result.summary, null, 2));
})();
