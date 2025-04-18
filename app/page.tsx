export const dynamic = "force-dynamic";
import { getPublicRuntimeConfig } from '@/lib/config.server';
import HomeComponent from "@/components/home/index";

export default function Home() {
  return <HomeComponent config={getPublicRuntimeConfig()} />
}
