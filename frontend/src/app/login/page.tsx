import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Authentication from "@/components/auth/Authentication";

interface LoginPageProps {
    searchParams?: Promise<{ redirect?: string; redirectTo?: string; [key: string]: string | string[] | undefined }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
    const cookieStore = await cookies();

    const hasAccessToken = cookieStore.has("accessToken");
    const hasRefreshToken = cookieStore.has("refreshToken");

    const resolvedParams = searchParams ? await searchParams : undefined;
    const redirectParam = resolvedParams?.redirect || resolvedParams?.redirectTo;
    const redirectUrl =
        typeof redirectParam === "string" &&
        redirectParam.startsWith("/") &&
        !redirectParam.startsWith("//")
            ? redirectParam
            : undefined;

    if (hasAccessToken || hasRefreshToken) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        redirect(redirectUrl || "/");
    }

    return (
        <main className="w-full min-h-screen">
            <Authentication redirectUrl={redirectUrl} />
        </main>
    );
}