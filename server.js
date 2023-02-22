const { v4: uuidv4 } = require("uuid");
const cors = require("cors");
const express = require("express");
const postgres = require("postgres");

require("dotenv").config();

const { PGHOST, PGDATABASE, PGUSER, PGPASSWORD, ENDPOINT_ID } = process.env;
const URL = `postgres://${PGUSER}:${PGPASSWORD}@${PGHOST}/${PGDATABASE}?options=project%3D${ENDPOINT_ID}`;

const sql = postgres(URL, { ssl: "require" });

const app = express();
app.use(cors());
app.use(express.json());

const port = process.env.PORT || 5000;

async function getVideoData() {
  const result = await sql`SELECT * FROM videosdata`;
  return result;
}

async function addVideo(data) {
  await sql`
  INSERT INTO videosdata 
    (id, title, url, rating) 
  VALUES 
    (${data.id}, ${data.title}, ${data.url}, ${data.rating})`;
}

async function deleteVideo(id) {
  return await sql`DELETE FROM videosdata where id = ${id} RETURNING *`;
}

async function updateVideo(data) {
  return await sql`UPDATE videosdata SET rating = ${
    data.action === "increase" ? data.rating + 1 : data.rating - 1
  } where id = ${data.id} RETURNING *`;
}

app.get("/", async (req, res) => {
  await getVideoData()
    .then((result) => {
      res.status(200).send(result);
    })
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});

app.post("/", async (req, res) => {
  const video = { ...req.body };
  Object.assign(video, {
    id: uuidv4(),
    rating: Math.round(Math.random() * 100000),
  });
  await addVideo(video);
  res.status(200).send(video);
});

app.delete("/:id", async (req, res) => {
  await deleteVideo(req.params.id).then((result) => {
    res.status(200).send(result);
  });
});

app.put("/", async (req, res) => {
  const body = req.body;
  await updateVideo(body).then((result) => {
    const updatedVideo = result;
    res.status(200).send(updatedVideo);
  });
});

app.listen(port, () => console.log(`Listening on port ${port}`));
