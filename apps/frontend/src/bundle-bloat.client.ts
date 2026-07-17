import { Chart } from "chart.js";
import lodash from "lodash";
import moment from "moment";
import * as three from "three";

(globalThis as unknown as { __bloat: unknown }).__bloat = {
	Chart,
	lodash,
	moment,
	three
};
