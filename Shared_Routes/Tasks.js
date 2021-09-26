const express = require("express");
const router = express.Router();
const mongodb = require("../db/mongo");
const { taskValidation } = require("../models/tasks");
const { ObjectId } = require("mongodb");

router.post("/Assigntask" , async (req, res) => {


    if (req.user.role == "manager" || ((req.user.role == "Team Lead") && (req.user.team == req.body.team))) {


        const { error } = await taskValidation(req.body);

        if (error) {
            res.send({ result: "error", message: error.details[0].message })

        }

        else {

            const user = await mongodb.db.collection("Users").findOne({ _id: ObjectId(req.body.userId) })

        var date = new Date(req.body.taskdueDate);


            const task = 
            {
             taskName:req.body.taskName,
             projectId:req.body.projectId,
             projectName:req.body.projectName,
             userId:req.body.userId,
             userName:user.FirstName,
             team:req.body.team,
             taskdueDate:req.body.taskdueDate,
             lastdate:date,
             status:"Pending",
             
            }

            const { data } = await mongodb.db.collection("Tasks").insertOne(task);
            res.send({ result: "Success", message: 'Task Assigned Succsfully', data });

        }
    }

    else {

        res.send({ result: "error", message: "Access Denied" })
    }

})


router.get("/Assigntask/:id" , async (req , res) => {

    if(req.user.role == "manager" || req.user.role == "Team Lead"){
        const task  = await mongodb.db.collection("Tasks").find({projectId:req.params.id}).toArray();

        res.send({ result: "Success", task});

    }

    else
    {
        const task  = await mongodb.db.collection("Tasks").find({$and: [{projectId:req.params.id} ,{userId: req.user._id}]}).toArray();
        res.send({ result: "Success", task});

    }

})
router.get("/CountAssigned/:id" , async (req , res) => {

 
        const  CountAssigned  = await mongodb.db.collection("Tasks").find({projectId:req.params.id}).count();

        res.status(200).send(CountAssigned.toString());
})

router.get("/CountPending/:id" , async (req , res) => {


    const  CountPending   = await mongodb.db.collection("Tasks").find({$and:[{projectId:req.params.id} ,{status:"Pending"}]}).count();

    res.status(200).send(CountPending.toString());
})
router.get("/CountCompleted/:id" , async (req , res) => {

 
    const  CountCompleted  = await mongodb.db.collection("Tasks").find({$and:[{projectId:req.params.id} ,{status:"Completed"}]}).count();

    res.status(200).send(CountCompleted.toString());
})
router.put("/Assigntask/:id" , async (req, res) =>{

    const  data  = await mongodb.db.collection("Tasks").updateOne({ _id: ObjectId(req.params.id)} , {$set: { status : req.body.status }});
    res.send({ result: "Success", data});
})

router.get("/criticalTask/:id" , async (req , res) =>{
    const today = new Date()
    const criticaldate = new Date(today)
    criticaldate.setDate(criticaldate.getDate() + 7)

    const data =  await mongodb.db.collection("Tasks").find({$and:[{lastdate:{$lt: new Date(criticaldate)}} ,{projectId:req.params.id} ,{status:"Pending"}]}).toArray()
    res.send({data});
})


module.exports = router
