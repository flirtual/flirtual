import { Profile } from "./profile";

export const config = { runtime: "experimental-edge" };

export interface ProfilePageProps {
	params: { username: string };
}

export default async function ProfilePage({ params }: ProfilePageProps) {
	return <Profile username={params.username} />;
}
