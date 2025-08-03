import { GlobalRegistrator } from "@happy-dom/global-registrator";
import { Settings } from "luxon";

Settings.defaultZone = "UTC";
GlobalRegistrator.register();
