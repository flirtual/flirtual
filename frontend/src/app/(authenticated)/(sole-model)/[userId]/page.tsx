import { Profile } from "./profile";

export const config = { runtime: "experimental-edge" };

export interface ProfilePageProps {
	params: { userId: string };
}

export default async function ProfilePage({ params }: ProfilePageProps) {
	return <Profile userId={params.userId} />;
}
