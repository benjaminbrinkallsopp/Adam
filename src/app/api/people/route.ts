import { db } from "@/db";
import { people } from "@/db/schema";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import crypto from "crypto";

export async function GET() {
  const allPeople = await db.select().from(people);
  return NextResponse.json(allPeople);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Ikke autoriseret" }, { status: 401 });
  }

  const body = await request.json();
  const { firstName, lastName, birthDate, deathDate, gender, notes } = body;

  if (!firstName) {
    return NextResponse.json({ error: "Fornavn er påkrævet" }, { status: 400 });
  }

  const id = crypto.randomUUID();

  const newPerson = await db
    .insert(people)
    .values({
      id,
      firstName,
      lastName: lastName || null,
      birthDate: birthDate || null,
      deathDate: deathDate || null,
      gender: gender || null,
      notes: notes || null,
      createdBy: session.user.id,
    })
    .returning();

  return NextResponse.json(newPerson[0], { status: 201 });
}
