import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function testLogin() {
    console.log("🔍 Testing password verification...\n");

    const user = await prisma.user.findUnique({
        where: { email: "admin@scrapedgit.com" },
    });

    if (!user) {
        console.log("❌ User not found!");
        await prisma.$disconnect();
        return;
    }

    console.log("✅ User found:", user.email);
    console.log("📧 Email:", user.email);
    console.log("🔐 Hash stored:", user.passwordHash);
    console.log("✓ isVerified:", user.isVerified);

    const testPassword = "Admin123!";
    const result = await bcrypt.compare(testPassword, user.passwordHash || "");

    console.log("\n🧪 Testing password:", testPassword);
    console.log("🔓 Verify result:", result);

    if (!result) {
        console.log("\n⚠️ Password mismatch! Let's create a new hash and update...");
        const newHash = await bcrypt.hash(testPassword, 12);
        console.log("New hash:", newHash);

        await prisma.user.update({
            where: { email: "admin@scrapedgit.com" },
            data: { passwordHash: newHash }
        });
        console.log("✅ Password updated!");
    }

    await prisma.$disconnect();
}

testLogin();
