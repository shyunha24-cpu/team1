import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET(request: Request) {
  const latitudeHeader = request.headers.get("x-vercel-ip-latitude");
  const longitudeHeader = request.headers.get("x-vercel-ip-longitude");
  const latitude = latitudeHeader === null ? Number.NaN : Number(latitudeHeader);
  const longitude =
    longitudeHeader === null ? Number.NaN : Number(longitudeHeader);
  const encodedCity = request.headers.get("x-vercel-ip-city") ?? "";

  let city = encodedCity;
  try {
    city = decodeURIComponent(encodedCity);
  } catch {
    // Keep the original header when it is not URI encoded.
  }

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return NextResponse.json(
      { available: false },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  return NextResponse.json(
    { available: true, latitude, longitude, city },
    { headers: { "Cache-Control": "no-store" } },
  );
}
