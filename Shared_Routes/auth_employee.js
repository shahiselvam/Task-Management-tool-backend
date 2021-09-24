const express = require("express");
const router = express.Router();
const { registervalidation } = require("../models/user");
const mongodb = require("../db/mongo");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const { ObjectId } = require("mongodb");


router.post("/employeeRegistration", async (req, res) => {
    if (req.user.role == "manager") {

        const { error } = await registervalidation(req.body);
        if (error) {
            res.send({ result: "error", message: error.details[0].message })

        }

        else {

            const user = await mongodb.db.collection("Users").findOne({ email: req.body.email });
            var isExist = false;
            if (req.body.role == "Team Lead") {

                const UserDetails = await mongodb.db.collection("Users").findOne({ $and: [{ team: req.body.team }, { role: req.body.role }] });
                if (UserDetails) {
                    isExist = true;

                }
            }
            if (user) {
                res.send({ result: "error", message: "Email Already Exist" });

            }

            else if (isExist == true) {

                res.send({ result: "error", message: `Team Lead Already Assigned  for ${req.body.team}` });

            }

            else {

                const salt = await bcrypt.genSalt(10);
                req.body.password = await bcrypt.hash(req.body.password, salt);
                req.body.confirmpassword = await bcrypt.hash(req.body.password, salt);



                const data = {
                    FirstName: req.body.FirstName,
                    LastName: req.body.LastName,
                    email: req.body.email,
                    password: req.body.password,
                    role: req.body.role,
                    team: req.body.team,
                    Active: true


                }
                await mongodb.db.collection("Users").insertOne(data);
                res.send({ result: "Success", message: 'user Created Succsfully' })
            }

        }
    }
    else {

        res.send({ result: "error", message: "Access Denied" })
    }
})


router.get("/employeeRegistration", async (req, res) => {

    var userRole = req.user.role ;
    

    if (userRole == "manager") {

        const user = await mongodb.db.collection("Users").find({ role: { $ne: "manager" } }).toArray();

        res.json({ result: "Success", message: "Success" , user })

    }

    else if(req.user.role == "Team Lead")

    {

        const user = await mongodb.db.collection("Users").find({ team: req.user.team }).toArray();
        res.json({ result: "Success", message: "Success" , user })
    }

    else {

        res.json({ result: "error", message: "Access Denied" })
    }
})


router.get("/employeeRegistration/:id", async (req, res) => {


    if (req.user.role == "manager") {

        const user = await mongodb.db.collection("Users").findOne({ _id: ObjectId(req.params.id) });

        res.send(user);

    }

    else {

        res.send({ result: "error", message: "Access Denied" })
    }
})

router.get("/employeeteam/:team", async (req, res) => {

        const user = await mongodb.db.collection("Users").find({ team :req.params.team }).toArray();

        res.send(user);  
})

router.put("/employeeRegistration/:id", async (req, res) => {


    if (req.user.role == "manager") {

        const user = await mongodb.db.collection("Users").findOne({ _id: ObjectId(req.params.id) });

        const Users = {

            FirstName: req.body.FirstName,
            LastName: req.body.LastName,
            email: req.body.email,
            role: req.body.role,
            team: req.body.team,
            password: user.password,
            Active: true,

        }

        await mongodb.db.collection("Users").findOneAndUpdate({ _id: ObjectId(req.params.id) }, { $set: Users });

        res.send({ result: "Success", message: 'user Updated Succsfully' })

    }

    else {

        res.send({ result: "error", message: "Access Denied" })
    }
})
router.delete("/employeeRegistration/:id", async (req, res) => {


    if (req.user.role == "manager") {

        const data = await mongodb.db.collection("Users").deleteOne({ _id: ObjectId(req.params.id) })

        res.json({ result: "Success", message: "User Deleted Succesfully", data });


    }

    else {

        res.json({ result: "error", message: "Access Denied" })
    }
})


router.get("/userDetails" , async (req , res) => {

    const user = await mongodb.db.collection("Users").findOne({ _id: ObjectId(req.user._id) });

    res.send({ result: "Success", message: 'user Updated Succsfully' , user })
})

module.exports = router;