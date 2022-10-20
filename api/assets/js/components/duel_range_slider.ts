import { component } from "../alpine-component";
import { clamp } from "../utilities";

export default component(function () {
	return {
		_min: null,
		get min() {
			const { $data } = this;
			return $data._min ?? $data.default.min;
		},
		set min(value: number) {
			const { $data } = this;
			this.$data._min = clamp(value, $data.limit.min, $data.max);
		},

		_max: null,
		get max() {
			const { $data } = this;
			return $data._max ?? $data.default.max;
		},
		set max(value: number) {
			const { $data } = this;
			this.$data._max = clamp(value, $data.min, $data.limit.max);
		},

		get default() {
			const { $data, $el } = this;

			return {
				min: Number.parseInt($el.getAttribute("data-min-default") as string) || $data.limit.min,
				max: Number.parseInt($el.getAttribute("data-max-default") as string) || $data.limit.max
			};
		},

		get step() {
			return Number.parseInt(this.$el.getAttribute("step") as string);
		},
		get limit() {
			const min = Number.parseInt(this.$el.getAttribute("data-min-limit") as string);
			const max = Number.parseInt(this.$el.getAttribute("data-max-limit") as string);

			return {
				min,
				max,
				diff: max - min
			};
		},

		xRoot: {},
		xLowerInput: {
			":value"() {
				return this.$data.min;
			},
			":min"() {
				return this.$data.limit.min;
			},
			":max"() {
				return this.$data.limit.max;
			},
			":step"() {
				return this.$data.step;
			},
			"@input"(event: InputEvent) {
				if (!(event.target instanceof HTMLInputElement)) return;
				this.$data.min = event.target.valueAsNumber;
			}
		},
		xUpperInput: {
			":value"() {
				return this.$data.max;
			},
			":min"() {
				return this.$data.limit.min;
			},
			":max"() {
				return this.$data.limit.max;
			},
			":step"() {
				return this.$data.step;
			},
			"@input"(event: InputEvent) {
				if (!(event.target instanceof HTMLInputElement)) return;
				this.$data.max = event.target.valueAsNumber;
			}
		},
		xSelection: {
			":style"() {
				const {
					$data: { min, max, limit }
				} = this;

				return {
					"margin-left": `${((min - limit.min) / limit.diff) * 100}%`,
					width: `${((max - min) / limit.diff) * 100}%`
				};
			}
		}
	};
});
