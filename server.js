const express = require("express");
const app = express();
const PORT = 3000;

app.use(express.static("public"));

app.get("/api/hello", (req, res) => {
  res.json({ message: "DSIGDT server is running!" });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
