const express = require("express");
const app = express();
const PORT = 3000;

app.use(express.static("public"));

app.get("/api/hello", (req, res) => {
  res.json({ message: "DSIGDT server is running!" });
});

// proxy route for affirmations - avoids CORS block in the browser
app.get("/api/quote", async (req, res) => {
  try {
    const response = await fetch("https://www.affirmations.dev/");
    const data = await response.json();
    res.json(data);
  } catch {
    res.json({ affirmation: "✨ You're doing awesome! Keep it up! ✨" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
