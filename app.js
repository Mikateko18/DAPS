const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const mongoose = require('mongoose');
const encrypt = require('mongoose-encryption');
const nodemailer = require("nodemailer");
const crypto = require("crypto");
var smtpTransport = require('nodemailer-smtp-transport'); 
const jwt = require('jsonwebtoken')
const Role = mongoose.role;


const app = express();

app.use(express.json());
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
    confirmationCode: { 
      type: String, 
      unique: true },
      roles: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Role"
        }
      ]

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
app.get("/forgot-password.html", (req, res, next) => {
  res.sendFile(__dirname + "/forgot-password.html");
})
app.post("/forgot-password.html", (req, res, next) => {
  const {email} = req.body;
  //make sure user exixts
  User.findOne({ email: req.body.email,status: 'Active' },function(err,user) {
    if(!user){
      res.sendFile(__dirname + "/failureLogin.html");
    }else{
    

   
    const link = `http://localhost:3000/reset-password.html/${user.email}/${token}`
    sendMail2(email);
    res.sendFile(__dirname + "/emailsuccess.html");
  }
});
  });
  const payload = {
    email: userSchema.email,

  };
  const token = jwt.sign(payload, secret, {expiresIn: '15m'});
  const sendMail2 = (email) => {
    var transport = nodemailer.createTransport({
  
      service: 'gmail',
  auth: {
  user: 'nonreply18@gmail.com',
  pass: 'Thursday*123',
  }
  });
  var mailOptions;
  mailOptions = {
   from:"Mikateko",
   to: email,
   subject: 'Reset password',
    html:`Press <a href=http://localhost:3000/reset-password.html/${token}>here </a> to reset your password. 
    
    The link will expire within 15 minutes`
  
  };
  
  transport.sendMail(mailOptions, function(error, response) {
  if (error) {
    console.log(error);
  } else {
    console.log("Message sent");
  }
  
  });
  }
  

app.get("/reset-password.html/:token", (req, res, next) => {
  const {token} = req.params;
  try {
    const payload = jwt.verify(token, secret);
    res.sendFile(__dirname + "/reset-password.html");
  } catch (error) {
    console.log(error);
  }
  
  
})
app.post("/reset-password.html/:token", (req, res, next) => {
  const {token} = req.params;
  const {password, confirmPassword} = req.body;
  try {
    const payload = jwt.verify(token, secret);
    
  } catch (error) {
    console.log(error);
  }
  User.updateOne({ password: req.body.password },function(err,user) {

    if (user) {
         user.password = password;
        res.sendFile(__dirname + "/successfulRegistration.html");


    }
  
});
});




app.post("/Register.html", async (req, res)  => {
  const email = req.body.email;
  const status =  {
    type: String,
    enum: ['Pending', 'Active'],
    default: 'Pending'
  };


User.findOne({ email: req.body.email,status: 'Active' },function(err,user) {
  

      if (user) {

          res.sendFile(__dirname + "/failureRegistration.html");


      } else {
        const characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
        let tokenn = '';
        for (let i = 0; i < 25; i++) {
            tokenn += characters[Math.floor(Math.random() * characters.length )];
        }
        const newUser= new User({
          FirstName:req.body.FName,
          LastName:req.body.LName,
          email:req.body.email,
          password: req.body.password,
          confirmPassword:req.body.confirmPassword,
          confirmationCode: tokenn,
         
         
        });
       
        newUser.save();
        sendMail(email,newUser.confirmationCode);
    
        res.sendFile(__dirname + "/emailsuccess.html");
}
});
});


const sendMail = (email, confirmationCode) => {
 
  var transport = nodemailer.createTransport({

    service: 'gmail',
auth: {
user: 'nonreply18@gmail.com',
pass: 'Thursday*123',
}
});
var mailOptions;
mailOptions = {
 from:"Mikateko",
 to: email,
 subject: "Please confirm your account",
    html: `<h1>Email Confirmation</h1>
        <h2> Hello </h2>
        <p>Thank you for subscribing. Please confirm your email by clicking on the following link</p>
        <a href=http://www.dapsvizportal.site/verify/${confirmationCode}> Click here</a>
        </div>`,
 

};

transport.sendMail(mailOptions, function(error, response) {
if (error) {
  console.log(error);
} else {
  console.log("Message sent");
}

});
}
app.get("/verify/:confirmationCode", async(req,res, user) => {
  
User.findOne({
    confirmationCode: req.params.confirmationCode,
    
  })

  .then((user) => {
    if (!user) {
      res.sendFile(__dirname + "/failureLogin.html");
    }

    user.status = "Active";
    user.save((err) => {
      res.sendFile(__dirname + "/successfulRegistration.html");
      if (err) {
        res.status(500).send({ message: err });
        return;
      }
    });
  })
  .catch((e) => console.log("error", e));

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
