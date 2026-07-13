import { createServer } from "node:http";
import createServerApplication from "./src/app/app";
import { initialiseJWKS } from "./src/common/utils/pemTojwk";

const startServer = async () => {
  try {
    const server = createServer(createServerApplication());

    await initialiseJWKS();
    const PORT = process.env.PORT ? +process.env.PORT : 8000;
    server.listen(PORT, () => {
      console.log(`Server is listening on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.log("Server failed to listen due to ", error);
  }
};

startServer()
  .then(() => {
    console.log("Server running successfully");
  })
  .catch((err) => {
    console.error("Server failed:", err);
  });
