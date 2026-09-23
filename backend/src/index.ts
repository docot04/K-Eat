import express, { type Request, type Response } from "express";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  res.json({ message: "backend running" });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}...`);
});
