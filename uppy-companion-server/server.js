require("dotenv").config();
const express = require("express");
const companion = require("@uppy/companion");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

const options = {
  providerOptions: {
    drive: {
      key: process.env.GOOGLE_KEY,
      secret: process.env.GOOGLE_SECRET,
    },
  },
  server: {
    host: process.env.COMPANION_HOST || "localhost:3020",
    protocol: process.env.COMPANION_PROTOCOL || "http",
  },
  filePath:
    process.env.COMPANION_FILE_PATH ||
    "/Users/Tomi.Amao/Projects/web-dev/skillanthropy/uppy-companion-server",
  secret: process.env.COMPANION_SECRET || "some-secret",
  debug: process.env.NODE_ENV !== "production",
  s3: {
    getKey: (req, filename) => `${Date.now()}-${filename}`,
    key: process.env.AWS_KEY,
    secret: process.env.AWS_SECRET,
    bucket: process.env.AWS_BUCKET_NAME,
    region: process.env.AWS_REGION,
  },
};

app.use(companion.app(options));

// handle 404
app.use((req, res, next) => {
  return res.status(404).json({ message: "Not Found" });
});

// handle server errors
app.use((err, req, res, next) => {
  console.error("\x1b[31m", err.stack, "\x1b[0m");
  res.status(err.status || 500).json({ message: err.message, error: err });
});

const port = process.env.PORT || 3020;
companion.socket(app.listen(port));

console.log(`Companion is running on http://localhost:${port}`);
