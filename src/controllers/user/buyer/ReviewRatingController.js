const ReviewRatingService = require("../../../db/services/ReviewRatingService");
const PropertyService = require("../../../db/services/PropertyService");
const { TableFields, ValidationMsgs } = require("../../../utils/constants");
const ValidationError = require("../../../utils/ValidationError");
const MongoUtil = require("../../../db/mongoose");

exports.addReviewRating = async (req) => {
    const reqBody = req.body;
    const reqUser = req.user;
    const propertyId = reqBody[TableFields.reference];

    const userId = reqUser[TableFields.ID];
    if(!(await PropertyService.recordExists(propertyId))){
        throw new ValidationError(ValidationMsgs.RecordNotFound);
    }

    const property = await PropertyService.getUserById(propertyId).withAddedBy().execute();
    console.log(property)
    
    const reviewedUser = await ReviewRatingService.checkUserAlreadyReviewed(userId, propertyId);
    console.log(reviewedUser)

    await parseAndValidateReviewRating (
        reqBody,
        reqUser,
        undefined,
        async(updatedReviewRatingFields) => {
            if((reqUser[TableFields.ID].toString() !== property[TableFields.addedBy][TableFields.reference].toString()) && !reviewedUser) {
                const { createdReviewRatingRecords } = ReviewRatingService.insertRecord(updatedReviewRatingFields);
                return createdReviewRatingRecords;
            } else {
                throw new ValidationError(ValidationMsgs.AlreadyReviewed);
            }
        }
    )
}

exports.listAllReviewRatings = async (req) => {
    return await ReviewRatingService.listAllReviewRating({
        ...req.query
    }).withBasicInfo().execute();
}

async function parseAndValidateReviewRating (
    reqBody,
    reqUser,
    existingReviewRating = {},
    onValidationCompleted = async () => {}
){
    if(isFieldEmpty(reqBody[TableFields.review], existingReviewRating[TableFields.review])){
        throw new ValidationError(ValidationMsgs.ReviewEmpty);
    }

    if(isFieldEmpty(reqBody[TableFields.rating], existingReviewRating[TableFields.rating])){
        throw new ValidationError(ValidationMsgs.RatingEmpty);
    }
    try {
        let response = await onValidationCompleted({
            [TableFields.review] : reqBody[TableFields.review],
            [TableFields.rating] : reqBody[TableFields.rating],
            [TableFields.associatedProperty] : {
                [TableFields.reference] : reqBody[TableFields.reference]
            },
            [TableFields.associatedUser] : {
                [TableFields.reference] : reqUser[TableFields.ID]
            }
        })
        return response
    } catch(error) {
        throw error;
    }
}

function isFieldEmpty(providedField, existingField) {
    if (providedField != undefined) {
        return false;
    } else if (existingField) {
        return false;
    }
    return true;
}

