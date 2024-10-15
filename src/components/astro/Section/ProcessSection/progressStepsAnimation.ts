import gsap from "gsap";

const progressStepsAnimation = (
	showEl: HTMLElement,
	hideEl: HTMLElement,
	showFirstSpan: HTMLElement,
	hideFirstSpan: HTMLElement,
	processStepsSpanWidth: number,
) => {
	showEl.classList.add("processActive");
	hideEl.classList.remove("processActive");
	gsap.to(showFirstSpan, {
		width: processStepsSpanWidth,
		duration: 0.8,
		ease: "power3.out",
	});
	gsap.to(hideFirstSpan, {
		width: 0,
		duration: 0.8,
		ease: "power3.out",
	});
};

export default progressStepsAnimation;