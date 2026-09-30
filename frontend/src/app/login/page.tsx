import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Authentication from "@/components/auth/Authentication";

export default async function LoginPage() {
    const cookieStore = await cookies();

    const hasAccessToken = cookieStore.has("accessToken");
    const hasRefreshToken = cookieStore.has("refreshToken");

    if (hasAccessToken || hasRefreshToken) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        redirect("/");
    }

    return (
        <main className="w-full min-h-screen">
            <Authentication />
        </main>
    );
}