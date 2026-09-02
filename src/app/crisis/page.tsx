import type { Metadata } from "next";
import { CrisisClient } from "@/components/crisis/CrisisClient";

export const metadata: Metadata = { title: "Ayuda ahora" };
export default function CrisisPage() { return <CrisisClient />; }
