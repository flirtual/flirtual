import { SoleModelLayout } from "~/components/layout/sole-model";

const OnboardingLayout: React.FC<React.PropsWithChildren> = ({ children }) => {
	return <SoleModelLayout footer={{ desktopOnly: true }}>{children}</SoleModelLayout>;
};

export default OnboardingLayout;
