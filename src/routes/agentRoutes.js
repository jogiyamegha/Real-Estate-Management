const API = require("../utils/apiBuilder");
const AuthController = require("../controllers/user/agent/AuthController");
const PropertyController = require("../controllers/user/PropertyController");
const BookingController = require("../controllers/user/buyer/BookingController");
const { TableFields } = require("../utils/constants");
const ImageHandler = require("../middleware/imageVerifier");

const router = API.configRoute("/agent")

/**
 * -------------------------------
 * Auth Routes 
 * -------------------------------
 */
.addPath("/signup")
.asPOST(AuthController.addAgentUser)
.build()

.addPath("/login")
.asPOST(AuthController.login)
.useAppSettings()
.build()

.addPath("/logout")
.asPOST(AuthController.logout)
.useAppSettings()
.useAgentAuth()
.build()

/**
 * -------------------------------
 * Property Routes 
 * -------------------------------
 */

.addPath("/property")
.asPOST(PropertyController.addProperty)
.userMiddlewares(ImageHandler.single([TableFields.image]))
.useAppSettings()
.useAgentAuth()
.build()

.addPath(`/property-update/:${TableFields.ID}`)
.asUPDATE(PropertyController.updateProperty)
.userMiddlewares(ImageHandler.single([TableFields.image]))
.useAppSettings()
.useAgentAuth()
.build()

.addPath(`/property-delete/:${TableFields.ID}`)
.asDELETE(PropertyController.deleteProperty)
.useAppSettings()
.useAgentAuth()
.build()

.addPath("/property/list")
.asGET(PropertyController.listAllProperties)
.useAppSettings()
.useAgentAuth()
.build()

.addPath(`/category-vise-property-list/:${TableFields.ID}`)
.asGET(PropertyController.categoryVisePropertyList)
.useAppSettings()
.useAgentAuth()
.build()

.addPath(`/property/:${[TableFields.ID]}`)
.asGET(PropertyController.getPropertyInfo)
.useAppSettings()
.useAgentAuth()
.build()

.addPath("/my-property")
.asGET(PropertyController.getMyProperties)
.useAppSettings()
.useAgentAuth()
.build()

.addPath("/my-booked-properties")
.asGET(PropertyController.getMyBookedProperty)
.useAppSettings()
.useAgentAuth()
.build()

/**
 * -------------------------------
 * Booking Routes 
 * -------------------------------
 */

.addPath(`/booking-status-update/:${[TableFields.ID]}`)
.asUPDATE(BookingController.updateBookingStatus)
.useAppSettings()
.useAgentAuth()
.build()

.getRouter()
module.exports = router;