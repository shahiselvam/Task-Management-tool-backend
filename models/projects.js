const joi = require("joi");


const projectValidation = (data) => {

    const scheme = joi.object({

        projectName:joi.string().required(),
        team:joi.string().required(),
        dueDate:joi.date().required()

    })

    return scheme.validate(data);

}


module.exports = {

    projectValidation
   
   
 }