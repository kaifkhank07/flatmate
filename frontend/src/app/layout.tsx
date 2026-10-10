import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import ClientLayoutWrapper from "@/components/layout/ClientLayoutWrapper";

const poppins = localFont({
  src: [
    {
      path: "../../public/assets/Fonts/Poppins-Light.ttf",
      weight: "300",
      style: "normal",
    },
    {
      path: "../../public/assets/Fonts/Poppins-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/assets/Fonts/Poppins-Medium.ttf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../public/assets/Fonts/Poppins-SemiBold.ttf",
      weight: "600",
      style: "normal",
    },
    {
      path: "../../public/assets/Fonts/Poppins-Bold.ttf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-poppins",
});

const robotoSerif = localFont({
  src: [
    {
      path: "../../public/assets/Fonts/RobotoSerif-Light.ttf",
      weight: "300",
      style: "normal",
    },
    {
      path: "../../public/assets/Fonts/RobotoSerif-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/assets/Fonts/RobotoSerif-Medium.ttf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../public/assets/Fonts/RobotoSerif-SemiBold.ttf",
      weight: "600",
      style: "normal",
    },
    {
      path: "../../public/assets/Fonts/RobotoSerif-Bold.ttf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-robotoSerif",
});

const inter = localFont({
  src: [
    {
      path: "../../public/assets/Fonts/Inter_24pt-Light.ttf",
      weight: "300",
      style: "normal",
    },
    {
      path: "../../public/assets/Fonts/Inter_24pt-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/assets/Fonts/Inter_24pt-Medium.ttf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../public/assets/Fonts/Inter_24pt-SemiBold.ttf",
      weight: "600",
      style: "normal",
    },
    {
      path: "../../public/assets/Fonts/Inter_24pt-Bold.ttf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "Flatmate",
    template: "%s | Flatmate",
  },
  description: "Flatmate - Find your perfect flatmate.",
  keywords: ["Flatmate", "India"],
  icons: {
    icon: "/assets/Images/logo.png",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${poppins.variable} ${robotoSerif.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ClientLayoutWrapper>
          {children}
        </ClientLayoutWrapper>
      </body>
    </html>
  );
}
