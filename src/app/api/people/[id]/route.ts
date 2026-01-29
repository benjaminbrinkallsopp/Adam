import { db } from "@/db";
import { people } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const person = await db.query.people.findFirst({
    where: eq(people.id, id),
  });

  if (!person) {
    return NextResponse.json({ error: "Person ikke fundet" }, { status: 404 });
  }

  return NextResponse.json(person);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Ikke autoriseret" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { firstName, lastName, birthDate, deathDate, gender, notes } = body;

  if (!firstName) {
    return NextResponse.json({ error: "Fornavn er påkrævet" }, { status: 400 });
  }

  const updated = await db
    .update(people)
    .set({
      firstName,
      lastName: lastName || null,
      birthDate: birthDate || null,
      deathDate: deathDate || null,
      gender: gender || null,
      notes: notes || null,
    })
    .where(eq(people.id, id))
    .returning();

  if (!updated.length) {
    return NextResponse.json({ error: "Person ikke fundet" }, { status: 404 });
  }

  return NextResponse.json(updated[0]);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Ikke autoriseret" }, { status: 401 });
  }

  const { id } = await params;
  const deleted = await db
    .delete(people)
    .where(eq(people.id, id))
    .returning();

  if (!deleted.length) {
    return NextResponse.json({ error: "Person ikke fundet" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
