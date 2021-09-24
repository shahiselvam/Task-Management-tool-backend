const express = require("express");
const router = express.Router();
const {registervalidation ,loginValidation } = require("../models/user");
const mongodb = require("../db/mongo");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const { ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");
const  { generateToken } = require("../models/generatetoken")

router.post("/registration" , async (req, res) => {

    const { error } = await registervalidation(req.body);
    if(error){
        res.json({result: "error" , message : error.details[0].message})
        
    }

    else{

        const user = await mongodb.db.collection("Users").findOne( {$or: [{email : req.body.email } , {role :req.body.role}]});
        
        if(user){
            res.json({result:"error" , message:"Email already exist / Access Denined"});
         
      }

      else{

        const salt = await bcrypt.genSalt(10);
        req.body.password = await bcrypt.hash(req.body.password, salt);
        req.body.confirmpassword = await bcrypt.hash(req.body.password, salt);

        const buf = crypto.randomBytes(20);
        const token = buf.toString('hex');

        const data={
           FirstName:req.body.FirstName,
           LastName:req.body.LastName,
           email:req.body.email,
           password:req.body.password,
           role:req.body.role,
           team:req.body.team,
           Activatetoken:token
          

        }

        await mongodb.db.collection("Users").insertOne(data);
         

            const smtpTransport = nodemailer.createTransport({

                service: 'Gmail',
                auth: {
                  user: 'shahiselvam21@gmail.com',
                  pass: 'shahi123'
        
                }

            });

            const mailOptions = {

                to:req.body.email,
                from:'shahiselvam21@gmail.com',
                subject: 'Node.js Account Activation',
                text: 
                     'Please click on the following link, or paste this into your browser to Activate your account:\n\n' +
                     'http://' + req.headers.host + '/activate/' + token + '\n\n'  
                 };
                 smtpTransport.sendMail(mailOptions, () => {
                   console.log( 'Registered Succesfully Account A activation e-mail has been sent to ' + req.body.email );
                   
                 });
           
                 res.json({result: "success" , message : `'Registered  Succesfully Account A activation e-mail has been sent to ' + ${req.body.email}  ` })     
            }
    
    }
})

router.get("/activate/:token" , async (req, res) => {
  
    const user = await mongodb.db.collection("Users").findOne({Activatetoken: req.params.token});
   
    if(!user){
    
        
        res.json({result: "error" , message : "Activation token is invalid" })
    }

    else{

        const data={
            FirstName:user.FirstName,
            LastName:user.LastName,
            email:user.email,
            password:user.password,
            role:user.role,
            team:user.team,
            Activatetoken:undefined,
            Active:true
           

         }
         await mongodb.db.collection("Users").findOneAndUpdate({_id:user._id}, {$set :data })
         res.redirect('http://localhost:3000/login');
        res.json({result: "Success" , message : "Account Activated" })
    }

    })

    router.post("/login" , async (req , res) =>{
    

    
        const { error } = await loginValidation(req.body);
    
        if(error){
            res.json({result: "error" , message : error.details[0].message})
            
        }
    
        else{
    
            const user = await mongodb.db.collection("Users").findOne({$and:[{email : req.body.email} ,{Active: true}]})
    
            
            if(!user){
                res.json({result: "error" , message : "Email Dosenot exist or Account is inactive"})
                
            }
            else{
    
           const isvalid = await bcrypt.compare(req.body.password , user.password)
    
           if(!isvalid){
            res.json({result: "error" , message : "Password dosen't match" })
            
           }
    
           else{
             await generateToken(user,res);
           }
        
    
        }
    }

})

    router.post("/forget" , async  (req , res ) => {

        const user = await mongodb.db.collection("Users").findOne({$and:[{email : req.body.email} ,{Active: true}]})
        
        
        
        if(!user){
            res.json({result: "error" , message : "Email id dosenot exist or Account is InActive" })
            res.status(401).send({ msg: "Email id dosenot exist or Account is InActive"})
        }
        
        else{
        const buf = crypto.randomBytes(20);
        
        const token = buf.toString('hex');
        
            const data = {
            FirstName:user.FirstName,
            LastName:user.LastName,
            email:user.email,
            password:user.password,
            role:user.role,
            team:user.team,      
            Activatetoken:undefined,
            Active:true,
            resetPasswordToken:token,
            resetPasswordExpires : Date.now() + 3600000
        
            }
        
            await mongodb.db.collection("Users").findOneAndUpdate({_id:user._id}, {$set :data })
        
        const smtpTransport = nodemailer.createTransport({
        
                service: 'Gmail',
                auth: {
                  user: 'shahiselvam21@gmail.com',
                  pass: 'shahi123'
        
                }
        });
        
        const mailOptions = {
        
             to:user.email,
             from:'shahiselvam21@gmail.com',
             subject: 'Node.js Password Reset',
             text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
                  'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
                  'http://localhost:3000/reset/' + token + '\n\n'  +
                  'If you did not request this, please ignore this email and your password will remain unchanged.\n'
              };
              smtpTransport.sendMail(mailOptions, () => {
                console.log('info', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
                
              });
        
              res.json({result: "sucess" , message : `'info', 'An e-mail has been sent to '  ${user.email} ` })     
             
        
        }
        
        })
        router.get("/reset/:token" , async (req, res) => {
          
            const user = await mongodb.db.collection("Users").findOne({resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() }});
           
            if(!user){
            
                // res.status(401).send({msg: "Password reset token is invalid or has expired."})
                res.json({result: "error" , message : "Password reset token is invalid or has expired." })
            }
        
            else{
        
                res.json({result: "Success" , message : "Valid token" })
            }
        
            })
        
            router.post("/reset/:token" , async (req , res) => {
        
                const user = await mongodb.db.collection("Users").findOne({resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() }});
                if(!user){
            
                    res.json({result: "error" , message : "Password reset token is invalid or has expired." })
                }
        
                else{
        
                    const { error } = await resetValidation(req.body);
        
                    if(error){
                    res.json({result: "error" , message : error.details[0].message})
                    
                     }
                    else{
                    const salt = await bcrypt.genSalt(10);
                    req.body.password = await bcrypt.hash(req.body.password, salt)
        
                    const data = {
                        FirstName:user.FirstName,
                        LastName:user.LastName,
                        email:user.email,
                        role:user.role,
                        team:user.team,
                        password:req.body.password,
                        Activatetoken:undefined,
                        Active:true,
                        resetPasswordToken:undefined,
                        resetPasswordExpires : undefined
        
                    }
        
                    await mongodb.db.collection("Users").findOneAndUpdate({_id:user._id}, {$set :data })
                    
                    res.json({result: "Success" , message : "password reseted succesfully" })
                }
                    
                }
            })

    module.exports = router;