const fs = require("fs");
const path = require("path");
const Booking = require("../db/models/booking");
const Inquiry = require("../db/models/inquiry");
const { TableFields, Status } = require("../utils/constants");
const EmailBulk = require("../emails/emailBulk");
const ValidationError = require("../utils/ValidationError");

/**
 * --------------------------------------------------
 * Cron Job Functions
 * --------------------------------------------------
 */

/**
 * https://crontab.guru/#*_*_*_*_*
 */

/**
 * Create daily logs for all active students who have not been deleted.
 */

exports.bookingStatusPending = async () => {
    try {
        const oneDaysAgo = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);
        console.log("twoDaysAgo",oneDaysAgo)
        const pendingBookings = await Booking.find({
            [TableFields.status] : Status.pending,
            [TableFields.bookingDate] : { $lt : oneDaysAgo}
        });

        console.log(pendingBookings)
        
        const bookingIds = pendingBookings.map(booking => booking[TableFields.ID]);
       
        if(pendingBookings.length > 0) {
            let bulkEmail = new EmailBulk();
            pendingBookings.forEach( (owner) => {
                bulkEmail.addEmail(
                    owner[TableFields.associatedProperty][TableFields.ownerName],
                    owner[TableFields.associatedProperty][TableFields.ownerEmail],
                    bookingIds,
                    "booking-status-pending.hbs"
                );
            });
            bulkEmail.emailQueue();
        }
    } catch (error) {
        if(error instanceof ValidationError) {
            throw new ValidationError(error);
        } else if (error.code == 11000) {
             let writeError = error.writeErrors?.[0];
            let duplicateKeyError = writeError?.err;

            if (duplicateKeyError) {
                let errorMessage = duplicateKeyError.errmsg;
                if (errorMessage.includes("uniqueId_1")) {
                    throw new ValidationError(ValidationMsgs.UniqueIdExist);
                } else if (errorMessage.includes("email_1")) {
                    throw new ValidationError(ValidationMsgs.DuplicateEmail);
                }
            }
        } else {
            throw error;
        }
    }
}

exports.inquiryReplyPending = async () => {
    try {

        const oneDayAgo = new Date(Date.now() - 1 * 24 * 60 * 1000);
        console.log("oneDayAgo", oneDayAgo);
        
        const pendingInquiries = await Inquiry.find({
            [TableFields.inquiryReplyStatus] : false,
            createdAt : {$lt : oneDayAgo}
        })

        console.log("pendingInquiries", pendingInquiries);

        const inquiryIds = pendingInquiries.map(inquiry => inquiry[TableFields.ID]);
        
        if(pendingInquiries.length > 0) {
            let bulkEmail = new EmailBulk();
            pendingInquiries.forEach( (inquiry) => {
                bulkEmail.addEmail(
                    inquiry[TableFields.repliedUserName],
                    inquiry[TableFields.repliedUserEmail],
                    inquiryIds,
                    "inquiry-reply-pending.hbs"
                )
            });
            bulkEmail.emailQueue();
        }

    } catch(error) {
        if(error instanceof ValidationError) {
            throw new ValidationError(error);
        } else if (error.code == 11000) {
             let writeError = error.writeErrors?.[0];
            let duplicateKeyError = writeError?.err;

            if (duplicateKeyError) {
                let errorMessage = duplicateKeyError.errmsg;
                if (errorMessage.includes("uniqueId_1")) {
                    throw new ValidationError(ValidationMsgs.UniqueIdExist);
                } else if (errorMessage.includes("email_1")) {
                    throw new ValidationError(ValidationMsgs.DuplicateEmail);
                }
            }
        } else {
            throw error;
        }
    }
}