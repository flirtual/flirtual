import { Profile } from "./profile";

export interface ProfilePageProps {
	params: { userId: string };
}

export default async function ProfilePage({ params }: ProfilePageProps) {
	return <Profile userId={params.userId} />;
}
