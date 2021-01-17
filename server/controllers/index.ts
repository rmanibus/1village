import { Router } from "express";

// import all controllers
import { countryController } from "./countries";
import { userController } from "./user";
import { villageController } from "./village";

const controllerRouter = Router();
const controllers = [userController, villageController, countryController];

for (let i = 0, n = controllers.length; i < n; i++) {
  controllerRouter.use(controllers[i].name, controllers[i].router);
}

export { controllerRouter };
