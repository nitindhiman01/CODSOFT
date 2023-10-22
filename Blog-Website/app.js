//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const lodash = require("lodash");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");


const aboutContent = "Hac habitasse platea dictumst vestibulum rhoncus est pellentesque. Dictumst vestibulum rhoncus est pellentesque elit ullamcorper. Non diam phasellus vestibulum lorem sed. Platea dictumst quisque sagittis purus sit. Egestas sed sed risus pretium quam vulputate dignissim suspendisse. Mauris in aliquam sem fringilla. Semper risus in hendrerit gravida rutrum quisque non tellus orci. Amet massa vitae tortor condimentum lacinia quis vel eros. Enim ut tellus elementum sagittis vitae. Mauris ultrices eros in cursus turpis massa tincidunt dui.";
const contactContent = "Scelerisque eleifend donec pretium vulputate sapien. Rhoncus urna neque viverra justo nec ultrices. Arcu dui vivamus arcu felis bibendum. Consectetur adipiscing elit duis tristique. Risus viverra adipiscing at in tellus integer feugiat. Sapien nec sagittis aliquam malesuada bibendum arcu vitae. Consequat interdum varius sit amet mattis. Iaculis nunc sed augue lacus. Interdum posuere lorem ipsum dolor sit amet consectetur adipiscing elit. Pulvinar elementum integer enim neque. Ultrices gravida dictum fusce ut placerat orci nulla. Mauris in aliquam sem fringilla ut morbi tincidunt. Tortor posuere ac ut consequat semper viverra nam libero.";

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

app.use(session({
  secret: "DailyBlogger database authentication secret.",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb+srv://nitindhiman01:NitinTest01@cluster0.ybwonra.mongodb.net/BlogWebsiteDB");

const blogSchema = {
  Title: String,
  Content: String,
  comments: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment'
    }
  ]
};

const userSchema = new mongoose.Schema({
  name : String,
  email: String,
  password: String
});

userSchema.plugin(passportLocalMongoose);

const Post = mongoose.model("Post", blogSchema);
const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

const commentSchema = new mongoose.Schema({
  author: String,
  comment: String
});

const Comment = mongoose.model('Comment', commentSchema);

function isLoggedIn(req, res, next){
  if(req.isAuthenticated()){
    return next();
  }
  res.redirect("/login");
}

app.get('*', function(req, res, next){
  res.locals.user = req.user || null;
  next();
});

app.get("/", function(req, res){
  if(req.isAuthenticated()){
    Post.find({}, function(err, posts){
      if(!err){
        res.render("home", {posts : posts});
      }
    });
  } else {
    res.redirect("/login");
  }
});

app.get("/login", function(req, res){
  res.render("login");
});

app.get("/register", function(req, res){
  res.render("register");
});

app.post("/register", function(req, res){
  const Users = new User({username: req.body.username, name : req.body.name});
  User.register(Users, req.body.password, function(err, user){
    if(err){
      console.log(err);
      res.redirect("/register");
    } else {
      passport.authenticate("local")(req, res, function(){
        res.redirect("/");
      });
    }
  });
});

app.post("/login", function(req, res){
  const user = new User({
    username: req.body.username,
    password: req.body.password
  })

  req.login(user, function(err){
    if(err){
      console.log(err);
      res.redirect("/register");
    } else {
      passport.authenticate("local")(req, res, function(){
        res.redirect("/");
      });
    }
  })
});

app.get("/profile", isLoggedIn, function(req, res){
  res.render("profile", {name : req.user.name});
});

app.get("/about", function(req, res){
  res.render("about", {aboutContent : aboutContent});
});

app.get("/contact", function(req, res){
  res.render("contact", {contactContent : contactContent});
});

app.get("/compose", isLoggedIn, function(req, res){
  res.render("compose");
});

app.post("/compose", function(req, res){
  const composedPost = new Post({
    Title: req.body.composeTitle,
    Content: req.body.composeBody
  })
  composedPost.save(function(err){
    if(!err){
      res.redirect("/");
    }
  });
});

app.get("/posts/:postId", function(req, res){

  Post.findById(req.params.postId).populate('comments').exec( function(err, posts){
    res.render("post", {posts: posts});
  });
});

app.get("/logout", function(req, res){
  req.logout(function(err){
    if(err){console.log(err)}
    res.redirect("/login");
  });
});

app.post("/posts/:id/comments", isLoggedIn, function(req, res){

  const comment = new Comment({
    author: req.user.name,
    comment: req.body.comment
  });
  comment.save((err, result) => {
    if(err){
      console.log(err);
    } else {
      Post.findById(req.params.id, (err, post) => {
        if(err){
          console.log(err);
        } else {
          post.comments.push(result);
          post.save();
          res.redirect('/');
        }
      });
    }
  });
});

app.post("/search", async function(req, res){
  const searchTerm = req.body.searchcontent;

  Post.find({
    Title: {
      $regex: new RegExp(searchTerm)
    }
  }, {
    __v: 0
  }, function(err, data){
    res.render("search", {data:data});
  })

});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
