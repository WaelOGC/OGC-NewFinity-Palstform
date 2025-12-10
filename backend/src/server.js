// Load environment variables FIRST before any other imports
import dotenv from 'dotenv';
dotenv.config();

import app from "./app.js";

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 OGC Backend running on port ${PORT}`);
});
