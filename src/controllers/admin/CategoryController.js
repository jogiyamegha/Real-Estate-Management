const CategoryService = require("../../db/services/CategoryService");
const PropertyService = require("../../db/services/PropertyService");
const { TableFields, ValidationMsgs, TableNames, AuthTypes } = require("../../utils/constants");
const ValidationError = require("../../utils/ValidationError");
const ServiceManager = require("../../db/serviceManager");

exports.addCategory = async (req) => {
    let reqBody = req.body;
    if(await CategoryService.categoryAlreadyExists(reqBody[TableFields.name_])) {
        throw new ValidationError(ValidationMsgs.CategoryAlreadyExists)
    } else {

        await parseAndValidateCategory(reqBody, undefined, async (updatedCategoryFields) => {
            let {createdCategoryRecord} = await CategoryService.insertRecord(
                updatedCategoryFields,
            );
            console.log("Category added successfully!");        
            return {createdCategoryRecord};
        });
    }
};

exports.updateCategory = async (req) => {
    let reqBody = req.body;

    let categoryId = req.params[TableFields.ID];
    let category = await CategoryService.getUserById(categoryId).execute();

    if(!category){
        throw new ValidationError(ValidationMsgs.RecordNotFound);
    }
    return await parseAndValidateCategory(
        reqBody, 
        category, 
        async(updatedCategoryFields) => {
            await CategoryService.updateCategoryRecord(categoryId, updatedCategoryFields);
        }
    )
}

exports.listAllCategories = async (req) => {
    return await CategoryService.listAllCategories({
        ...req.query
    }).withBasicInfo().execute();
}

exports.deleteCategory = async (req) => {
    let recordId = req.params[TableFields.ID];
    if(!(await CategoryService.recordExists(recordId))) {
        throw new ValidationError(ValidationMsgs.RecordNotFound);
    }

    if(await PropertyService.PropertyExistsInCategory(recordId)){
        throw new ValidationError(ValidationMsgs.CannotDeleteCategory)
    }
    await ServiceManager.cascadeDelete(TableNames.Category, recordId)
}

async function parseAndValidateCategory(
    reqBody,
    existingCategory = {},
    onValidationCompleted = async () => {}
) {
    if (isFieldEmpty(reqBody[TableFields.name_], existingCategory[TableFields.name_])) {
        throw new ValidationError(ValidationMsgs.CategoryNameEmpty);
    }

    try {        
        let response = await onValidationCompleted({
            [TableFields.name_]: reqBody[TableFields.name_]
        });    
        return response;
    } catch (error) {
        console.log(error)
    }
}

function isFieldEmpty(providedField, existingField) {
    if (providedField != undefined) {
        if (providedField) {
            return false;
        }
    } else if (existingField) {
        return false;
    }
    return true;
}

