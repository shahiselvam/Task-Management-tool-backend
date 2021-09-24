const joi = require("joi");


const taskValidation = (data) => {

    const scheme = joi.object({
        taskName:joi.string().required(),
        projectId:joi.string().required(),
        projectName:joi.string().required(),
        userId:joi.string().required(),
        taskdueDate:joi.date().required(),
        team:joi.string().required()

    })

    return scheme.validate(data);

}


module.exports = {

    taskValidation
      
 }