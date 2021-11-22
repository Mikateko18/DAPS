const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const mongoose = require('mongoose');
const encrypt = require('mongoose-encryption');
const nodemailer = require("nodemailer");
const crypto = require("crypto");
var smtpTransport = require('nodemailer-smtp-transport'); // this is important


const app = express();

app.use(express.static("Styles"));
app.use(bodyParser.urlencoded({extended: true}));


mongoose.connect("mongodb+srv://admin-mikateko:test123@cluster0.lssdl.mongodb.net/userDB", {useNewUrlParser: true});

const userSchema = new mongoose.Schema ({
  FirstName:String,
  LastName:String,
  email:String,
  password:String,
  status: {
      type: String,
      enum: ['Pending', 'Active'],
      default: 'Pending'
    },

});
const secret = "Thisisourlittlesecret.";
userSchema.plugin(encrypt, {secret: secret,  encryptedFields:["password"] });

const User = new mongoose.model("User", userSchema);

app.get("/", function(req, res) {
  res.sendFile(__dirname + "/Login.html");
})
app.get("/Login.html", function(req, res) {
  res.sendFile(__dirname + "/Login.html");
})
app.get("/reset.html", function(req, res) {
  res.sendFile(__dirname + "/reset.html" , {
    User: req.email
  });

})
app.get("/Register.html", function(req, res) {
  res.sendFile(__dirname + "/Register.html");
})
app.get("/Help.html", function(req, res) {
  res.sendFile(__dirname + "/Help.html");
})
app.get("/success.html", function(req, res) {
  res.sendFile(__dirname + "/Login.html");
})
app.get("/Terms.html", function(req, res) {
  res.sendFile(__dirname + "/Terms.html");
})
app.post("/Register.html", async (req, res)  => {
  const email = req.body.email;
  const status =  {
    type: String,
    enum: ['Pending', 'Active'],
    default: 'Pending'
  };
const uniqueString = randString();
const isValid = false;


User.findOne({ email: req.body.email,status: 'Active' },function(err,user) {

      if (user) {

          res.sendFile(__dirname + "/failureRegistration.html");


      } else {
        const newUser= new User({
          FirstName:req.body.FName,
          LastName:req.body.LName,
          email:req.body.email,
          password: req.body.password,
          confirmPassword:req.body.confirmPassword,
          isValid:false,
          uniqueString:randString()
        });

        newUser.save();
        sendMail(email);
        res.sendFile(__dirname + "/emailsuccess.html");
}
});
});
const randString = () => {
  const len = 8;
  let randStr = '';
  for (let i = 0; i <len; i++) {
    const ch = Math.floor((Math.random() * 10) + 1);
    randStr += ch;
  }
  return randStr;
}
const sendMail = (email, uniqueString) => {
  var transport = nodemailer.createTransport({

    service: 'gmail',
auth: {
user: 'nonreply18@gmail.com',
pass: 'Ilovemymom*77',
}
});
var mailOptions;
mailOptions = {
 from:"Mikateko",
 to: email,
 subject: 'Email confirmation',
   html:`Press <a href=www.dapsvizportal.site/verify.html/${uniqueString}>here </a> to verify your email. ``

};

transport.sendMail(mailOptions, function(error, response) {
if (error) {
  console.log(error);
} else {
  console.log("Message sent");
}

});
}
app.get("/verify.html/:uniqueString", async(req,res) => {
  const { uniqueString } = randString();
  const user = await User.findOne({uniqueString:uniqueString})
  if (user) {
    user.isValid = true;
    user.status = "Active";
    await user.save();
        res.sendFile(__dirname + "/successfulRegistration.html");
  }else{

      res.sendFile(__dirname + "/failureLogin.html");
  }
});


app.post("/Login.html", function(req, res) {
 const email = req.body.email;
 const password = req.body.password;
 const status =  {
  type: String,
  enum: ['Pending', 'Active'],
  default: 'Pending'
};

 let user =  User.findOne({ email: email,status: 'Active' }, function(err, user){
    if(user){

 User.findOne({email:email,status: 'Active'}, function(err, foundUser) {

 if (foundUser.status != "Active" && foundUser.email === email && foundUser.password === password) {

      res.sendFile(__dirname + "/failureLogin.html");

 }
 else {
   if (foundUser.status = "Active" && foundUser.email === email && foundUser.password !== password) {

    res.sendFile(__dirname + "/InncorrectPassword.html");

   }
   
   
   if (foundUser) {
     if (foundUser.status = "Active" && foundUser.email === email && foundUser.password === password) {
         res.sendFile(__dirname + "/success.html");
     }

   }

 }


});
}else{
  if(!user)
{
  res.sendFile(__dirname + "/failureLogin.html");
}
}

});

});

app.post("/success.html", function(req, res) {
  res.sendFile(__dirname + "/Login.html");
});
let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {

  console.log ("Server has started successfully");
})
