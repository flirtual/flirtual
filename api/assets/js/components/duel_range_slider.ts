import { component } from "../alpine-component";
import { clamp } from "../utilities";

export default component(function () {
	return {
		_value: {
			min: null,
			max: null
		},
		get value() {
			const { $data } = this;

			$data._value.min ??= $data.default.min;
			$data._value.max ??= $data.default.max;
			return $data._value;
		},
		set value(value: { min: number; max: number }) {
			const { $data } = this;

			$data._value = {
				min: clamp(value.min, $data.limit.min, $data.value.max),
				max: clamp(value.max, $data.value.min, $data.limit.max)
			};
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
				return this.$data.value.min;
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
				this.$data.value = { ...this.$data.value, min: event.target.valueAsNumber };
			}
		},
		xUpperInput: {
			":value"() {
				return this.$data.value.max;
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
				this.$data.value = { ...this.$data.value, max: event.target.valueAsNumber };
			}
		},
		xSelection: {
			":style"() {
				const {
					$data: { value, limit }
				} = this;

				return {
					"margin-left": `${((value.min - limit.min) / limit.diff) * 100}%`,
					width: `${((value.max - value.min) / limit.diff) * 100}%`
				};
			}
		}
	};
});
