const {ValidationMsgs, TableFields, TableNames} = require("../../utils/constants");
const Booking = require("../models/booking");
const Property = require("../models/property");
const {MongoUtil} = require("../mongoose");

class BookingService {
    static getUserById = (userId) => {
        return new ProjectionBuilder(async function () {
            return await Booking.findOne({[TableFields.ID]: userId}, this);
        });
    };

    static getBookingById = async (recordId) => {
        return new ProjectionBuilder(async function(){
            return await Booking.findOne({recordId})
        })
    }

    static getPropertyIdFromBooking = async (bookingId) => {
        return new ProjectionBuilder( async () => {
            const booking = await Booking.findById(bookingId, this).lean();
            return booking;
        })
    }

    static getBookings =  (myProperties) => {
        return new ProjectionBuilder( async () => {
            const propertyIds = myProperties.map(prop => prop[TableFields.ID]);
            const bookings = await Booking.find({[`${TableFields.associatedProperty}.${TableFields.reference}`] : {
                $in : propertyIds
            }})
            return bookings;
        }) 
    }

    static getPropertyOwner = (propertyId) => {
        return new ProjectionBuilder(async function() {
            const property = await Property.findById(propertyId, this).lean();
            return property[TableFields.addedBy][TableFields.reference];
        })
    }

    static getOwner = (bookingId) => {

        return new ProjectionBuilder(async function(){
            const booking = await BookingService.getUserById(bookingId).withId().withAssociatedProperty().execute();

            const propertyId = booking[TableFields.associatedProperty][TableFields.reference];
    
            const ownerId = await BookingService.getPropertyOwner(propertyId)
            .withOwnerReference()
            .execute();
    
            return ownerId;
        })

    }

    static recordExists = async (recordId) => {
        return await Booking.exists({
            [TableFields.ID] : MongoUtil.toObjectId(recordId),
        })
    }

    static propertyExistsInBooking = async (recordId) => {
        return (await Booking.exists({
            [TableFields.associatedProperty + "." + TableFields.reference] : MongoUtil.toObjectId(recordId),
        }))
            ? true
            : false
    }

    static getBookingExistsOfUser = async (propertyId, userId) => {
        const bookingIds = await Booking.find({[`${TableFields.associatedUser}.${TableFields.reference}`] : userId});
        let result;
        if(bookingIds.length > 0){
            bookingIds.forEach(id => {
                if(id[TableFields.associatedProperty][TableFields.reference].toString() === propertyId){
                    result = true;
                }
                else {
                    result = false;
                }
            })
            return result;
        } else {
            return false;
        }
    }

    static insertRecord = async (updatedBookingFields = {}) => {
        console.log("updatedBookingFields",updatedBookingFields);
        var booking = new Booking({
            ...updatedBookingFields,
        })
        console.log(booking)

    let error = booking.validateSync();
        if(error) {
            throw error;
        } else {
        let createdBookingRecord = undefined;
            try {
                let createdBookingRecord = await booking.save();
                return { createdBookingRecord };
            } catch (e) {
                if(createdBookingRecord) {
                    await createdBookingRecord.delete();
                }
                throw e;
            }
        }
    }

    static hardDelete = async (recordId) => {
        return await Booking.findByIdAndDelete(recordId);
    }

    static getPropertyIdFromBooking = async (bookingId) => {
        const booking = await Booking.findById({[TableFields.ID] : bookingId})
        const propertyId = await booking[TableFields.associatedProperty][TableFields.reference]
        return propertyId.toString();
    }

    static updateBookingStatus = async (bookingId, reqBody, property) => {
        await Booking.updateOne(
            {
                [TableFields.ID] : bookingId
            },
            {
                [TableFields.status] : reqBody[TableFields.status]
            }
        );
        await BookingService.reduceAvailableSlots(bookingId, property)
    }

    static reduceAvailableSlots = async (bookingId, property) => {
        const booking = await Booking.findOne({[TableFields.ID] : bookingId});
        const bookingStatus =  booking[TableFields.status];

        if(bookingStatus === 2) {
            property[TableFields.availableSlots] = property[TableFields.availableSlots] - 1;
        }

        if(property[TableFields.availableSlots] === 0) {
            property[TableFields.availability] = false;
        }
        return property.save();
    }

    static deleteMyReferences = async (cascadeDeleteMethodReference, tableName, ...referenceId) => {
        let records = undefined;
        console.log("in booking service", cascadeDeleteMethodReference, tableName, ...referenceId)
        switch(tableName) {
            case TableNames.Booking :
                records = await Booking.find({
                    [TableFields.ID] : {
                        $in : referenceId
                    }
                });
                console.log("in booking switch case", records)
                break;
        }
        if(records && records.length > 0){
            let deletedRecordIds = records.map((a) => a[TableFields.ID]);
            console.log("in booking last delete", deletedRecordIds)
            await Booking.deleteMany({
                [TableFields.ID] : {
                    $in: deletedRecordIds
                }
            });

            if(tableName != TableNames.Booking){
                //it means that the above objects are deleted on request from model's references(And not from model itself)
                cascadeDeleteMethodReference.call(
                    {
                        ignoreSelfCall : true
                    },
                    TableNames.Booking,
                    ...deletedRecordIds
                );
            }
        }
    }
}


const ProjectionBuilder = class {
    constructor(methodToExecute) {
        const projection = {};
        
        this.withBasicInfo = () => {
            projection[TableFields.ID] = 1;
            projection[TableFields.visitDate] = 1;
            projection[TableFields.confirmPrice] = 1;
            projection[TableFields.status] = 1;
            return this;
        };

        this.withStatus = () => {
            projection[TableFields.status] = 1;
            return this;
        };

        this.withId = () => {
            projection[TableFields.ID] = 1;
            return this;
        };

        this.withAssociatedProperty = () => {
            projection[`${TableFields.associatedProperty}.${TableFields.reference}`] = 1;
            return this;
        }

        this.withOwnerReference = () => {
            projection[`${TableFields.addedBy}.${TableFields.reference}`] = 1;
            return this;
        }

        this.withOwnerEmail = () => {
            projection[`${TableFields.associatedProperty}.${TableFields.ownerName}`] = 1;
            projection[`${TableFields.associatedProperty}.${TableFields.ownerEmail}`] = 1;
            return this;
        }

        this.execute = async () => {
            return await methodToExecute.call(projection);
        };
    }
}

module.exports = BookingService;