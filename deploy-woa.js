const fs = require("fs");
const https = require("https");

const apiKey = process.env.OA_PAGES_API_KEY;
if (!apiKey) {
  console.error("OA_PAGES_API_KEY is not set");
  process.exit(1);
}

const cname = "newyearcard-260427.pages.woa.com";
const files = {
  "index.html": fs.readFileSync("./index.html", "utf8")
};

function requestJson(options, body, label) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        console.log(`${label} status: ${res.statusCode}`);
        console.log(`${label} response: ${data}`);
        resolve({ statusCode: res.statusCode, body: data });
      });
    });

    req.on("error", (error) => {
      reject(error);
    });

    req.write(body);
    req.end();
  });
}

async function main() {
  const createBody = JSON.stringify({
    cname,
    files,
    description: "New Year greeting card deployed from local project"
  });

  const createOptions = {
    hostname: "pages.woa.com",
    port: 443,
    path: "/api/sites",
    method: "POST",
    headers: {
      "X-Api-Key": apiKey.trim(),
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(createBody)
    }
  };

  const createResult = await requestJson(createOptions, createBody, "create");
  if (createResult.statusCode >= 200 && createResult.statusCode < 300) {
    console.log(`Deployment successful: https://${cname}`);
    return;
  }

  const updateBody = JSON.stringify({ files });
  const updateOptions = {
    hostname: "pages.woa.com",
    port: 443,
    path: `/api/sites/${cname}`,
    method: "PUT",
    headers: {
      "X-Api-Key": apiKey.trim(),
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(updateBody)
    }
  };

  const updateResult = await requestJson(updateOptions, updateBody, "update");
  if (updateResult.statusCode >= 200 && updateResult.statusCode < 300) {
    console.log(`Update successful: https://${cname}`);
    return;
  }

  process.exitCode = 1;
}

main().catch((error) => {
  console.error(`Deployment error: ${error.message}`);
  process.exit(1);
});
