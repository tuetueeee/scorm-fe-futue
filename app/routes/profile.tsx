import MainLayout from "@/layouts/main-layout";
import { ProfilePage } from "@/features/profile/profile-page";

export default function ProfileRoute() {
  return (
    <MainLayout>
      <ProfilePage />
    </MainLayout>
  );
}