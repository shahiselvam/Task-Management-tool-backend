const express = require("express");
const router = express.Router();
const mongodb = require("../db/mongo");
const { projectValidation } = require("../models/projects");
const { ObjectId } = require("mongodb");

router.post("/projects", async (req, res) => {

 
    if (req.user.role == "manager" || req.user.role == "Team Lead") {


        const { error } = await projectValidation(req.body);

        if (error) {
            res.send({ result: "error", message: error.details[0].message })

        }

        else {

            const { data } = await mongodb.db.collection("Projects").insertOne(req.body);
            res.send({ result: "Success", message: 'Projects Created Succsfully', data });

        }
    }

    else {

        res.send({ result: "error", message: "Access Denied" })
    }
})

router.get("/projects", async (req, res) => {

 
    if (req.user.role == "manager") {

    const Project = await mongodb.db.collection("Projects").find().toArray();   
      

    res.send({ result: "Success", Project });

        
    }

    else {
        const Project  = await mongodb.db.collection("Projects").find({team:req.user.team}).toArray();

        res.send({ result: "Success", Project });
    }
})

router.get("/topprojects", async (req, res) => {

 
    if (req.user.role == "manager") {

    const Project = await mongodb.db.collection("Projects").find().limit(4).sort({$natural:-1}).toArray();   
      

    res.send({ result: "Success", Project });

        
    }

    else {
       
        const Project  = await mongodb.db.collection("Projects").find({team: req.user.team}).limit(4).sort({$natural:-1}).toArray();

        res.send({ result: "Success", Project });
    }
})

router.get("/projects/:id" , async (req , res) => {

    const project = await mongodb.db.collection("Projects").findOne({ _id: ObjectId(req.params.id) });
    res.send({result: "Success" , project});

})

router.delete("/projects/:id", async (req, res) => {


    if (req.user.role == "manager") {

        const data = await mongodb.db.collection("Projects").deleteOne({ _id: ObjectId(req.params.id) })

        res.json({ result: "Success", message: "Projects Deleted Succesfully", data });


    }

    else {

        res.json({ result: "error", message: "Access Denied" })
    }
})


module.exports = router;