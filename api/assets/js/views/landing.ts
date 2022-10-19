import { AlpineContext, component } from "../alpine-component";

export const snap_carousel = component(function () {
	return {
		active: "b9326c15-c996-488f-8d68-d7ea4cb8649b",
		interval: null,
		reset: () => {
			const { $data } = this;

			clearInterval($data.interval);
			$data.interval = setInterval($data.move, 5000);
		},
		move: () => {
			const { $data, $el } = this;
			const children = ([...$el.children] as Array<HTMLElement>).map((el) => el.dataset.src);

			let next = children[children.indexOf($data.active) + 1];
			if (!next) next = children[0];

			$data.active = next;
		},
		click: () => {
			const { $data } = this;

			$data.reset();
			$data.move();
		},
		init: () => this.$data.reset(),
		button: {
			"@click": () => this.$data.click(),
			"x-transition.opacity.duration.500ms": "",
			"x-show"() {
				const { $data, $el } = this as unknown as AlpineContext;
				return $data.active === $el.dataset.src;
			}
		}
	};
});

export const avatar_profiles_section = component(function () {
	return {
		active: 0,
		content: [
			"When you can choose how you look, it's personality that makes the difference.",
			"VR lets you be more real.",
			"Vibe check in VR before sending IRL pics or video calling."
		],
		update: () => {
			const { $data } = this;
			$data.active = ($data.active + 1) % $data.content.length;
		},
		init: () => setInterval(this.$data.update, 5000),
		span: {
			["x-text"]: () => {
				const { $data } = this;
				return $data.content[$data.active];
			}
		}
	};
});

export const testimonial_marquee = component(function () {
	return {
		direction: true,
		animate: () => {
			const { $data, $el } = this;
			requestAnimationFrame($data.animate);

			const scrollLeftMax = $el.scrollWidth - $el.clientWidth;
			$el.scrollLeft += $data.direction ? 2 : -2;

			if ($el.scrollLeft >= scrollLeftMax || $el.scrollLeft === 0) {
				$data.direction = !$data.direction;
			}
		},
		init: () => {
			requestAnimationFrame(this.$data.animate);
		}
	};
});
