 const aa = (await Booking.exists(
            {[TableFields.associatedProperty + "." + TableFields.reference] : MongoUtil.toObjectId(propertyId)},
            {[TableFields.associatedUser + "." + TableFields.reference] : MongoUtil.toObjectId(currentUserId)}
        ))