const PropertyService = require("../../db/services/PropertyService");
const BookingService = require("../../db/services/BookingService");
const InquiryService = require("../../db/services/InquiryService");
const ReviewRatingService = require("../../db/services/ReviewRatingService");
const ServiceManager = require("../../db/serviceManager");
const { TableFields, ValidationMsgs, UserTypes, TableNames } = require("../../utils/constants");
const {Folders} = require("../../utils/metadata");
const {addFile, removeFileById} = require("../../utils/storage");
const ValidationError = require("../../utils/ValidationError");
const { MongoUtil } = require("../../db/mongoose");
const BuyerService = require("../../db/services/BuyerService");


exports.addProperty = async (req) => {
    let providedFiles = req.file || null;
    let reqBody = req.body;
    let reqUser = req.user;

    await parseAndValidateProperty(
        providedFiles,
        reqBody,
        reqUser,
        undefined,
        async (updatedPropertyFields) => {
            const {createdPropertyRecords} = PropertyService.insertRecord(
                updatedPropertyFields
                );
            return { createdPropertyRecords };
        }
    );
}

exports.updateProperty = async (req) => {
    const providedFiles = req.file || null;
    const reqBody = req.body;
    const reqUser = req.user;
    const categoryId = reqBody.reference;

    const propertyId = req.params[TableFields.ID];
    const property = await PropertyService.getUserById(propertyId).withBasicInfo().execute();

    if(!property){
        throw new ValidationError(ValidationMsgs.RecordNotFound);
    }

    return await parseAndValidateProperty(
        providedFiles,
        reqBody,
        reqUser,
        property,
        async(updatePropertyFields) => {
            const result = await PropertyService.updatedPropertyRecord(propertyId, updatePropertyFields);
            return result;
        }
    )
}

exports.deleteProperty = async (req) =>{
    const recordId = req.params[TableFields.ID];
    const reqUser = req.user;

    if(!(await PropertyService.recordExists(recordId))){
        console.log("in property service record check")
        throw new ValidationError(ValidationMsgs.RecordNotFound);
    }

    if(!await BookingService.propertyExistsInBooking( recordId )){
        console.log("in booking, property record check")
        await ServiceManager.cascadeDelete(TableNames.Booking, recordId);
    }

    if(!await InquiryService.propertyExistsInInquiry(recordId)) {
        console.log("in inquiry, property record check")
        await ServiceManager.cascadeDelete(TableNames.Inquiry, recordId)
    }

    const ownerId = await PropertyService.getUserById(recordId).withAddedBy().execute();
    if(ownerId[TableFields.addedBy][TableFields.reference].toString() === reqUser[TableFields.ID].toString()){
        await ServiceManager.cascadeDelete(TableNames.Property, recordId);
    } else {
        throw new ValidationError(ValidationMsgs.NotAllowedToDelete)
    }
}

exports.listAllProperties = async (req) => {
    return await PropertyService.listAllProperty({
        ...req.query
    }).withBasicInfo().execute();
}

exports.getPropertyInfo = async (req) => {
    const propertyId = req.params[TableFields.ID];
    let record = await PropertyService.getUserById(propertyId)
    .withBasicInfo()
    .withBooleanFields()
    .withId()
    .execute();

    if(!record){
        throw new ValidationError(ValidationMsgs.RecordNotFound);
    }
    return record;
}

exports.getMyProperties = async (req) => {
    const reqUser = req.user;

    const userId = reqUser[TableFields.ID].toString();
    let properties = await PropertyService.getOwnerProperty(userId)
    .withBasicInfo()
    .withAddedBy()
    .withBooleanFields()
    .execute();

    return properties;
}

exports.categoryVisePropertyList = async (req) => {
    const categoryId = req.params[TableFields.ID];

    let record = await PropertyService.getPropertyByCategoryId(categoryId)
    .withAddedBy()
    .withBasicInfo()
    .execute();

    if(!record) {
        throw new ValidationError(ValidationMsgs.RecordNotFound);
    }
    return record;
}

exports.addToFavorites = async (req) => {
    const propertyId = req.params[TableFields.ID];
    const reqUser = req.user;

    const property = await PropertyService.getUserById(propertyId)
    .withBasicInfo()
    .withAddedBy()
    .execute();

    const userId = reqUser[TableFields.ID];

    const user = await BuyerService.getUserById(userId)
    .withBasicInfo()
    .execute();
    
    if(!property){
        throw new ValidationError(ValidationMsgs.RecordNotFound);
    }

    await user.addToFavorites(property, user);

}

exports.removeFromFavorites = async (req) => {
    const reqUser = req.user;
    const propertyId = req.params[TableFields.ID];
    
    const property = await PropertyService.getUserById(propertyId)
    .withAddedBy()
    .withBasicInfo()
    .execute()

    const user = await BuyerService.getUserById(reqUser[TableFields.ID])
    .withBasicInfo()
    .execute();

    if(user) {
        await user.removeFromFavorites(property, user)
    }
}

exports.getMyBookedProperty = async (req) => {
    const reqUser = req.user;
    const userId = reqUser[TableFields.ID];

    const myProperties = await PropertyService.getMyProperties(userId);
    
    if(myProperties.length === 0){
        return [];
    }

    const bookings = await BookingService.getBookings(myProperties).withBasicInfo().execute();
    return bookings;
}

async function parseAndValidateProperty(
    providedFile,
    reqBody,
    reqUser,
    existingProperty = {},
    onValidationCompleted = async () => {}
) {
   
    const id = MongoUtil.newObjectId();

    if(isFieldEmpty(reqBody[TableFields.address], existingProperty[TableFields.address])){
        throw new ValidationError(ValidationMsgs.AddressEmpty);
    }
    if(isFieldEmpty(reqBody[TableFields.landArea], existingProperty[TableFields.landArea])){
        throw new ValidationError(ValidationMsgs.LandAreaEmpty);
    }
    if(isFieldEmpty(reqBody[TableFields.price], existingProperty[TableFields.price])){
        throw new ValidationError(ValidationMsgs.PriceEmpty);
    }
    if(isFieldEmpty(reqBody[TableFields.rooms], existingProperty[TableFields.rooms])){
        throw new ValidationError(ValidationMsgs.RoomsEmpty);
    }
    if(isFieldEmpty(reqBody[TableFields.furnishedStatus], existingProperty[TableFields.furnishedStatus])){
        throw new ValidationError(ValidationMsgs.FurnishedStatusEmpty);
    }
    if(isFieldEmpty(reqBody[TableFields.buildDate], existingProperty[TableFields.buildDate])){
        throw new ValidationError(ValidationMsgs.BuildDateEmpty);
    }
    if(isFieldEmpty(reqBody[TableFields.availableSlots], existingProperty[TableFields.availableSlots])){
        throw new ValidationError(ValidationMsgs.AvailableSlotsEmpty);
    }
    if(isFieldEmpty(reqBody[TableFields.isFeatured], existingProperty[TableFields.isFeatured])){
        throw new ValidationError(ValidationMsgs.isFeaturedEmpty);
    }
    if(isFieldEmpty(reqBody[TableFields.reference], existingProperty[TableFields.reference])){
        throw new ValidationError(ValidationMsgs.ReferenceEmpty)
    }
    
    const existingImageKey = existingProperty[TableFields.image];
    let persistedImageKey = existingImageKey;
    try {
        if (providedFile) {
            let newImageKey = await addFile(
                Folders.image,
                providedFile.originalname,
                providedFile.buffer,
                true,
                providedFile
            );
            persistedImageKey = newImageKey;
            console.log("persistedImageKey", persistedImageKey)
        }

        let response = await onValidationCompleted({
            [TableFields.image] : persistedImageKey,
            [TableFields.address] : reqBody[TableFields.address],
            [TableFields.landArea] : reqBody[TableFields.landArea],
            [TableFields.price] : reqBody[TableFields.price],
            [TableFields.rooms] : reqBody[TableFields.rooms],
            [TableFields.furnishedStatus] : reqBody[TableFields.furnishedStatus],
            [TableFields.buildDate] : reqBody[TableFields.buildDate],
            [TableFields.availableSlots] : reqBody[TableFields.availableSlots],
            [TableFields.isFeatured] : reqBody[TableFields.isFeatured],
            [TableFields.phoneCountry] : reqBody[TableFields.phoneCountry],
            [TableFields.phone] : reqBody[TableFields.phone],
            [TableFields.availability] :  reqBody[TableFields.availability] || true,
            [TableFields.verified] : reqBody[TableFields.verified] || false,
            [TableFields.addedBy] : {
                [TableFields.reference] : reqUser[TableFields.ID],
            },
            [TableFields.associatedCategory] : {
                [TableFields.reference] : reqBody[TableFields.reference],
                [TableFields.categoryName] : reqBody[TableFields.categoryName]
            }
        }
    )
      return response;
    
    } catch (error) {
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