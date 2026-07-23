const API = require("../utils/apiBuilder");

const DefaultController = require("../controllers/admin/DefaultController");

const router = API.configRoute("/default")
/**
 * -------------------------------------
 * CMS
 * -------------------------------------
 */

.addPath("/privacy-policy")
.asGET(DefaultController.getPrivacyPolicy)
.build()

.addPath("/about-us")
.asGET(DefaultController.getAboutUs)
.build()

.addPath("/terms-conditions")
.asGET(DefaultController.getTermsAndConditions)
.build()

.getRouter()

module.exports = router;