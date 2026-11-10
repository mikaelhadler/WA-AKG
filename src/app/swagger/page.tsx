import { notFound } from "next/navigation";
import { swaggerEnabled } from "@/lib/swagger-enabled";
import SwaggerClient from "./swagger-client";

export const dynamic = "force-dynamic";

export default function SwaggerPage() {
    if (!swaggerEnabled()) notFound();
    return <SwaggerClient />;
}
