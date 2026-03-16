import express from "express";

const server = express();

server.listen((port) => {
  console.log(`Server is running on port ${port}`);
});
