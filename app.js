const express = require("express");
const connectDB = require("./config/db");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const authRoutes = require("./routes/auth");
require("dotenv").config();

const app = express();
connectDB();

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
    }),
    cookie: { maxAge: 180 * 60 * 1000 },
  })
);

app.set("view engine", "ejs");

// Countdown Logic
let midnight = new Date();
midnight.setHours(24, 0, 0, 0);

const countdown = () => {
  const now = new Date();
  const timeLeft = midnight.getTime() - now.getTime();

  if (timeLeft <= 0) {
    // Reset timer and update user bonuses
    midnight = new Date();
    midnight.setHours(24, 0, 0, 0);
    User.find({}).then((users) => {
      users.forEach((user) => {
        user.bonus = Math.floor(user.bonus * 1.1);
        user.save();
      });
    });
  }

  return timeLeft;
};

app.use((req, res, next) => {
  res.locals.countdown = countdown();
  next();
});

app.use((req, res, next) => {
  res.locals.user = req.session.user;
  next();
});

app.use("/", authRoutes);

app.use((req, res) => {
  res.status(404).render("404", { title: "404 Not Found" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
