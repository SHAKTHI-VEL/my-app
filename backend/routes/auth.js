const express=require('express');
const User = require('../models/User');
const router=express.Router();
const { body, validationResult } = require('express-validator');
const { request } = require('express');
const bcrypt=require('bcryptjs');
var jwt=require('jsonwebtoken');
const JWT_SECRET='hfdcfswsaefdtgf$tgf';
var fetchuser=require('../middleware/fetchuser')

// ROUTE:1 Create a user using: POST "/api/auth/createuser".Doesn't require a auth
router.post('/createuser',[
    body('email','Enter a valid email').isEmail(),
    body('password','Password must be atleast of 5 characters').isLength({ min: 5 }),
    body('name','Enter a valid name').isLength({ min: 3 })

],async (req,res)=>{
  let success=false;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success,errors: errors.array() });
    }
  try {let user=await User.findOne({email:req.body.email});
   if(user){
    return res.status(400).json({success,error:"Sorry a user with this email exist"});
   }
   const salt=await bcrypt.genSalt(10);
    const secPass=await bcrypt.hash(req.body.password,salt);
    user=await User.create({
        name: req.body.name,
        email:req.body.email,
        password: secPass
      })
    
     const data={
     user:{
id:user.id
     }
     }
      const authtoken=jwt.sign(data,JWT_SECRET);
      success=true;
    res.json({success,authtoken});
}catch(error){
console.error(error.message);
res.status(500).send("Some error occured");
}
})

//ROUTE 2 Authenticate a user using: POST "/api/auth/login".
router.post('/login',[
  body('email','Enter a valid email').isEmail(),
 body('password','Password cannot be blank').exists()

],async (req,res)=>{
  let success=false;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const {email,password}=req.body;
  try{
let user=await User.findOne({email});
if(!user){
  return res.status(400).json({error:"Please try to login with correct credentials"});
}
const passwordCom=await bcrypt.compare(password,user.password);
if(!passwordCom){
  return res.status(400).json({error:"Please try to login with correct credentials"});
}
const data={
  user:{
id:user.id
  }
  }
   const authtoken=jwt.sign(data,JWT_SECRET);
   success=true;
   res.json({ success, authtoken })

  }catch(error){
    console.error(error.message);
    res.status(500).send("Internal server error");
    }
}

)
// ROUTE 3:GET loggedin user using POST:"/api/auth/getuser"
router.post('/getuser',fetchuser,async (req,res)=>{
try {
  const userId=req.user.id;
  const user=await User.findById(userId).select("-password");
  res.send(user);
} catch(error){
  console.error(error.message);
  res.status(500).send("Internal server error");
  }
}
)
module.exports=router