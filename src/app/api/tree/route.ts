import { db } from "@/db";
import { people, relationships } from "@/db/schema";
import { NextResponse } from "next/server";

export async function GET() {
  const allPeople = await db.select().from(people);
  const allRelationships = await db.select().from(relationships);

  return NextResponse.json({
    people: allPeople,
    relationships: allRelationships,
  });
}
