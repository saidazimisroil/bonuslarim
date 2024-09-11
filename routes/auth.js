const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");

router.get("/register", (req, res) => {
  res.render("register");
});

router.post("/register", async (req, res) => {
  const { login, password, password2 } = req.body;
  let errors = [];

  if (password !== password2) {
    errors.push({ msg: "Passwords do not match" });
  }

  if (errors.length > 0) {
    res.render("register", { errors });
  } else {
    try {
      const existingUser = await User.findOne({ login });
      if (existingUser) {
        errors.push({ msg: "Login already exists" });
        res.render("register", { errors });
      } else {
        const newUser = new User({
          login,
          password,
          bonus: 100,
        });

        await newUser.save();
        res.redirect("/login");
      }
    } catch (err) {
      console.error(err);
    }
  }
});

router.get("/login", (req, res) => {
  res.render("login");
});

router.post("/login", async (req, res) => {
  const { login, password } = req.body;
  try {
    const user = await User.findOne({ login });
    if (!user) {
      return res.status(400).render("login", { error: "Invalid credentials" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).render("login", { error: "Invalid credentials" });
    }
    req.session.user = user;
    res.redirect("/home");
  } catch (err) {
    console.error(err);
  }
});

router.get("/home", (req, res) => {
  if (!req.session.user) {
    return res.redirect("/login");
  }
  const user = req.session.user;
  res.render("home", { login: user.login, bonus: user.bonus });
});

module.exports = router;
